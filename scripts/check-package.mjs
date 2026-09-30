import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { basename, dirname, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = fileURLToPath(new URL('..', import.meta.url))
const artifactDirectory = resolve(root, '.artifacts/package')
const runtimeDirectories = ['components', 'internals', 'layouts', 'setup', 'styles']
const requiredFiles = [
  'package.json', 'README.md', 'LICENSE',
  'assets/ICT/SOURCES.md',
  'assets/ICT/signature-official.png',
  'assets/UCAS/emblem-name-bilingual-hz.svg',
]

const sourceFiles = async (directory) => {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    const path = `${directory}/${entry.name}`
    return entry.isDirectory() ? sourceFiles(path) : /\.(vue|ts|css)$/.test(path) ? [path] : []
  }))).flat()
}

const npmPack = async (args) => {
  const { stdout } = await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'pack', '--json', '--ignore-scripts', ...args,
  ], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
  const result = JSON.parse(stdout)
  assert.equal(result.length, 1, 'npm pack must produce exactly one package')
  return result[0]
}

try {
  const metadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const preview = await npmPack(['--dry-run'])
  assert.equal(preview.name, metadata.name)
  assert.equal(preview.version, metadata.version)
  const files = new Set(preview.files.map(file => file.path))
  const sources = (await Promise.all(runtimeDirectories.map(sourceFiles))).flat()
  for (const file of [...requiredFiles, ...sources]) {
    assert.ok(files.has(file), `Required package file missing: ${file}`)
  }
  for (const file of files) {
    assert.ok(
      requiredFiles.includes(file)
      || /^(components|internals|layouts|setup|styles)\/(?!.*(?:^|\/)\.)[^\\]+\.(vue|ts|css)$/.test(file),
      `Unexpected package file (examples, tests, build output, and private files must stay local): ${file}`,
    )
    assert.ok(!file.split('/').some(part => part.startsWith('.')), `Hidden package file: ${file}`)
  }

  // Check relative source imports against the actual pack list, including
  // extensionless TypeScript imports and relative CSS imports/assets.
  for (const file of sources) {
    const source = await readFile(resolve(root, file), 'utf8')
    const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|@import\s*|url\(\s*)["'](\.{1,2}\/[^"'?#]+)(?:[?#][^"']*)?["']/g)
    for (const [, specifier] of imports) {
      const target = posix.normalize(posix.join(dirname(file), specifier))
      const candidates = [target, ...['.ts', '.vue', '.js', '.mjs', '.css', '/index.ts', '/index.js'].map(suffix => target + suffix)]
      assert.ok(candidates.some(candidate => files.has(candidate)), `${file}: local import is missing from package: ${specifier}`)
    }
  }

  await mkdir(artifactDirectory, { recursive: true })
  const packed = await npmPack(['--pack-destination', artifactDirectory])
  assert.equal(basename(packed.filename), packed.filename, 'npm returned an unsafe package filename')
  assert.deepEqual(packed.files.map(file => file.path).sort(), [...files].sort(), 'Pack contents changed after validation')
  const tarball = resolve(artifactDirectory, packed.filename)
  const { stdout } = await run('tar', ['-tzf', tarball], { maxBuffer: 8 * 1024 * 1024 })
  const archivedFiles = stdout.trim().split('\n').map(path => {
    assert.ok(path.startsWith('package/'), `Unexpected tar entry: ${path}`)
    return path.slice('package/'.length)
  })
  assert.deepEqual(archivedFiles.sort(), [...files].sort(), 'Tarball contents must match npm pack manifest')
  console.log(`Package validated: ${metadata.name}@${metadata.version} (${files.size} files)`)
  console.log(`Tarball: ${tarball}`)
} catch (error) {
  console.error(`Package validation failed: ${error.message}`)
  if (error.stderr?.trim()) console.error(error.stderr.trim())
  else if (error.stdout?.trim()) console.error(error.stdout.trim())
  process.exitCode = 1
}
