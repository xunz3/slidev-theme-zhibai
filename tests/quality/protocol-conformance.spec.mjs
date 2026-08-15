import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const snapshotRoot = resolve(
  repositoryRoot,
  'vendor/obsidian-slidev-protocol/1.0.0',
)
const coreRoot = resolve(snapshotRoot, 'core/1.0.0')
const profileRoot = resolve(
  snapshotRoot,
  'profiles/obsidian-slidev-presentation/1.0.0',
)

const sha256 = value => createHash('sha256').update(value).digest('hex')
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))

const loadTypeScript = async () => {
  try {
    return (await import('typescript')).default
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error

    const pnpmDirectory = new URL('../../node_modules/.pnpm/', import.meta.url)
    const packageDirectory = (await readdir(pnpmDirectory))
      .filter(name => /^typescript@[^_]+$/.test(name))
      .sort()
      .at(-1)
    if (!packageDirectory) throw error

    const compilerUrl = new URL(
      `${packageDirectory}/node_modules/typescript/lib/typescript.js`,
      pnpmDirectory,
    )
    return (await import(compilerUrl.href)).default
  }
}

const ts = await loadTypeScript()

const loadTypeScriptModule = async (path) => {
  const moduleUrl = new URL(`../../${path}`, import.meta.url)
  const source = await readFile(moduleUrl, 'utf8')
  const transpiled = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  const encoded = Buffer.from(
    `${transpiled.outputText}\n//# sourceURL=${pathToFileURL(fileURLToPath(moduleUrl)).href}`,
  ).toString('base64')
  return import(`data:text/javascript;base64,${encoded}`)
}

const verifyManifest = async (root, manifest) => {
  for (const artifact of manifest.artifacts) {
    const bytes = await readFile(resolve(root, artifact.path))
    assert.equal(bytes.length, artifact.bytes, artifact.path)
    assert.equal(sha256(bytes), artifact.sha256, artifact.path)
  }
}

const fixtureAdapter = async (path) => {
  const source = await readFile(resolve(repositoryRoot, path), 'utf8')
  const imported = source.match(/^src:\s*(\S+)$/m)?.[1]
  assert.ok(imported, `${path} must use Slidev's src adapter`)
  assert.match(source, /^theme:\s*\.\.\/$/m)
  assert.match(source, /^protocolCanonicalSha256:\s*["']?[0-9a-f]{64}["']?$/m)
  return {
    imported,
    canonicalHash: source.match(
      /^protocolCanonicalSha256:\s*["']?([0-9a-f]{64})["']?$/m,
    )?.[1],
  }
}

const compatibleDeck = {
  core: {
    id: 'obsidian-slidev/core',
    version: '1.0.0',
  },
  profile: {
    id: 'obsidian-slidev/presentation',
    version: '1.0.0',
  },
}

const runtimeProtocolDeclaration = {
  id: compatibleDeck.core.id,
  version: compatibleDeck.core.version,
}

const declaredSupport = {
  schemaVersion: 1,
  core: {
    id: 'obsidian-slidev/core',
    ranges: [
      {
        minInclusive: '1.0.0',
        maxExclusive: '1.1.0',
      },
    ],
  },
  profiles: [
    {
      id: 'obsidian-slidev/presentation',
      ranges: [
        {
          minInclusive: '1.0.0',
          maxExclusive: '1.1.0',
        },
      ],
    },
  ],
}

test('vendored publication, archive, manifests, and canonical fixture hashes are exact', async () => {
  const [lock, publication, coreManifest, profileManifest, archive] =
    await Promise.all([
      readJson(resolve(repositoryRoot, 'protocol.lock.json')),
      readFile(resolve(snapshotRoot, 'publications/1.0.0.json')),
      readJson(resolve(coreRoot, 'manifest.json')),
      readJson(resolve(profileRoot, 'manifest.json')),
      readFile(resolve(repositoryRoot, 'vendor/obsidian-slidev-protocol/1.0.0.tar')),
    ])

  assert.equal(sha256(publication), lock.publication.manifestSha256)
  assert.equal(
    lock.source.repository,
    'https://github.com/xunz3/obsidian-slidev.git',
  )
  assert.equal(
    lock.source.revision,
    'cf673113553b89f6555f5468d95541fedbfb16cc',
  )
  assert.equal(sha256(archive), lock.archive.sha256)
  await verifyManifest(coreRoot, coreManifest)
  await verifyManifest(profileRoot, profileManifest)
})

test('the pure Lilas evaluator passes every vendored canonical compatibility vector', async () => {
  const { assessProtocolCompatibility } = await loadTypeScriptModule(
    'setup/protocol-compatibility.ts',
  )
  const vectors = await readJson(
    resolve(coreRoot, 'fixtures/compatibility-vectors.json'),
  )

  for (const vector of vectors.vectors) {
    if (vector.name === 'publication drift') continue
    const { publication: _deckPublication, ...deck } = vector.deck
    const support = vector.support === undefined
      ? undefined
      : (({ publication: _supportPublication, ...value }) => value)(vector.support)
    const actual = assessProtocolCompatibility(deck, support)
    assert.deepEqual(
      {
        status: actual.status,
        scope: actual.scope,
        reasonCode: actual.reasonCode,
      },
      vector.expected,
      vector.name,
    )
  }
})

test('package support pins exact half-open core and Presentation Profile ranges', async () => {
  const packageJson = await readJson(resolve(repositoryRoot, 'package.json'))
  assert.deepEqual(packageJson.obsidianSlidev?.support, declaredSupport)
  assert.equal(packageJson.name, 'slidev-theme-lilas')
  assert.equal('name' in packageJson.obsidianSlidev.support, false)
  assert.equal('package' in packageJson.obsidianSlidev.support, false)
})

test('core and Profile adapters import immutable canonical bytes before Lilas overlays', async () => {
  const cases = [
    {
      adapter: 'fixtures/protocol-core.md',
      canonical: resolve(coreRoot, 'fixtures/generated-core.md'),
      expectedRelative:
        '../vendor/obsidian-slidev-protocol/1.0.0/core/1.0.0/fixtures/generated-core.md',
    },
    {
      adapter: 'fixtures/protocol-profile.md',
      canonical: resolve(profileRoot, 'fixtures/authoring.md'),
      expectedRelative:
        '../vendor/obsidian-slidev-protocol/1.0.0/profiles/obsidian-slidev-presentation/1.0.0/fixtures/authoring.md',
    },
  ]

  for (const definition of cases) {
    const adapter = await fixtureAdapter(definition.adapter)
    assert.equal(adapter.imported, definition.expectedRelative)
    assert.equal(adapter.canonicalHash, sha256(await readFile(definition.canonical)))
  }
})

test('runtime bridge updates the in-deck notice and echoes the token', async () => {
  const compatibility = await loadTypeScriptModule(
    'setup/protocol-compatibility.ts',
  )
  const runtime = await loadTypeScriptModule('setup/protocol-runtime.ts')
  const assessment = compatibility.assessProtocolCompatibility(
    compatibleDeck,
    declaredSupport,
  )
  const attributes = new Map()
  const notice = {
    hidden: false,
    textContent: '',
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
  }
  const documentLike = {
    querySelector: selector => (
      selector === '.obsidian-slidev-compatibility' ? notice : null
    ),
    referrer: 'app://obsidian.md/workspace',
  }

  assert.equal(runtime.applyProtocolCompatibilityNotice(documentLike, assessment), true)
  assert.equal(notice.hidden, true)
  assert.equal(attributes.get('data-obsidian-slidev-status'), 'compatible')

  const posted = []
  const didPost = runtime.postProtocolSupport({
    assessment,
    deck: compatibleDeck,
    document: documentLike,
    location: {
      href: 'http://127.0.0.1:3030/?obsidianSlidevToken=opaque-token',
    },
    parent: {
      postMessage: (...args) => posted.push(args),
    },
    self: {},
    support: declaredSupport,
  })
  assert.equal(didPost, true)
  assert.equal(posted.length, 1)
  assert.equal(posted[0][0].token, 'opaque-token')
  assert.deepEqual(posted[0][0].deck, {
    core: compatibleDeck.core,
    profile: compatibleDeck.profile,
  })
  assert.deepEqual(posted[0][0].assessment, {
    status: 'compatible',
    scope: 'core+profile',
    reasonCode: 'COMPATIBLE_CORE_AND_PROFILE',
  })

  const incompatible = compatibility.assessProtocolCompatibility(
    compatibleDeck,
    {
      ...declaredSupport,
      core: {
        ...declaredSupport.core,
        ranges: [{ minInclusive: '2.0.0', maxExclusive: '3.0.0' }],
      },
    },
  )
  assert.equal(runtime.applyProtocolCompatibilityNotice(documentLike, incompatible), true)
  assert.equal(notice.hidden, false)
  assert.match(notice.textContent, /does not support|incompatible/i)
})

test('runtime compatibility findings never block theme startup', async () => {
  const compatibility = await loadTypeScriptModule(
    'setup/protocol-compatibility.ts',
  )
  const runtime = await loadTypeScriptModule('setup/protocol-runtime.ts')
  const posted = []
  const self = {}
  const stop = runtime.installProtocolCompatibilityBridge({
    assess: compatibility.assessProtocolCompatibility,
    document: {
      querySelector: () => null,
      referrer: 'app://obsidian.md/workspace',
    },
    location: {
      href: 'http://127.0.0.1:3030/',
    },
    parent: {
      postMessage: (...args) => posted.push(args),
    },
    rawProtocol: {
      id: 'obsidian-slidev/core',
      version: '2.0.0',
    },
    rawSupport: declaredSupport,
    self,
  })

  assert.equal(typeof stop, 'function')
  assert.equal(posted.length, 0)
  stop()

  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => warnings.push(args)
  try {
    const stopMalformed = runtime.installProtocolCompatibilityBridge({
      assess: compatibility.assessProtocolCompatibility,
      document: {
        querySelector: () => null,
      },
      location: {
        href: 'http://127.0.0.1:3030/',
      },
      parent: self,
      rawProtocol: { malformed: true },
      rawSupport: declaredSupport,
      self,
    })
    assert.equal(typeof stopMalformed, 'function')
    assert.equal(warnings.length, 1)
    stopMalformed()
  } finally {
    console.warn = originalWarn
  }
})

test('runtime bridge adapts the canonical generated frontmatter declaration', async () => {
  const compatibility = await loadTypeScriptModule(
    'setup/protocol-compatibility.ts',
  )
  const runtime = await loadTypeScriptModule('setup/protocol-runtime.ts')
  const attributes = new Map()
  const notice = {
    hidden: false,
    textContent: '',
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
  }
  const documentLike = {
    querySelector: selector => (
      selector === '.obsidian-slidev-compatibility' ? notice : null
    ),
    referrer: 'app://obsidian.md/workspace',
  }
  const posted = []
  const self = {}
  const stop = runtime.installProtocolCompatibilityBridge({
    assess: compatibility.assessProtocolCompatibility,
    document: documentLike,
    location: {
      href: 'http://127.0.0.1:3030/?obsidianSlidevToken=runtime-token',
    },
    parent: {
      postMessage: (...args) => posted.push(args),
    },
    rawProtocol: runtimeProtocolDeclaration,
    rawSupport: declaredSupport,
    self,
  })

  assert.equal(notice.hidden, true)
  assert.equal(attributes.get('data-obsidian-slidev-status'), 'compatible')
  assert.equal(posted.length, 1)
  assert.deepEqual(posted[0][0].deck, {
    core: compatibleDeck.core,
  })
  assert.equal(posted[0][0].assessment.reasonCode, 'COMPATIBLE_CORE')
  assert.equal(posted[0][0].token, 'runtime-token')

  stop()
  assert.equal(notice.hidden, false)
  assert.equal(attributes.get('data-obsidian-slidev-status'), 'unverified')
})

test('main setup installs and disposes the compatibility bridge without polling', async () => {
  const source = await readFile(resolve(repositoryRoot, 'setup/main.ts'), 'utf8')
  assert.match(source, /installProtocolCompatibilityBridge/)
  assert.match(source, /stopProtocolCompatibility/)
  assert.match(source, /app\.onUnmount/)
  assert.doesNotMatch(source, /setInterval|setTimeout/)
})

test('Lilas presets remain implementation-only and never become Profile facts', async () => {
  const [packageJson, profile, compatibilitySource] = await Promise.all([
    readJson(resolve(repositoryRoot, 'package.json')),
    readJson(resolve(profileRoot, 'profile.json')),
    readFile(resolve(repositoryRoot, 'setup/protocol-compatibility.ts'), 'utf8'),
  ])

  assert.deepEqual(profile.commonConfiguration.preset, {
    type: 'implementation-defined-string',
  })
  assert.equal(
    JSON.stringify(packageJson.obsidianSlidev?.support).match(/\b(?:default|ucas|ict)\b/),
    null,
  )
  assert.doesNotMatch(
    compatibilitySource,
    /\b(?:presentationPreset|default|ucas|ict)\b/i,
  )
})
