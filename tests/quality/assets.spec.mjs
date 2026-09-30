import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import {
  discoverThemeOwnedAssets,
  findOversizedThemeAssets,
  themeOwnedAssetPolicy,
} from './brand-assets.mjs'
import { repositoryRoot } from './helpers.mjs'

const intrinsicDimensions = async (path) => {
  const bytes = await readFile(resolve(repositoryRoot, path))
  if (path.endsWith('.png')) {
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(bytes.subarray(12, 16).toString(), 'IHDR')
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  }
  const tag = bytes.toString().match(/<svg\b[^>]*>/)?.[0] ?? ''
  const width = Number.parseFloat(tag.match(/\bwidth="([^"]+)"/)?.[1])
  const height = Number.parseFloat(tag.match(/\bheight="([^"]+)"/)?.[1])
  assert.ok(width > 0 && height > 0, `${path}: intrinsic SVG dimensions`)
  // HTML image dimensions use whole CSS pixels for these SVG sources.
  return { width: Math.round(width), height: Math.round(height) }
}

test('repository asset policy covers unlisted files under assets and public', async () => {
  assert.equal(themeOwnedAssetPolicy.maximumBytes, 256_000)
  assert.deepEqual(themeOwnedAssetPolicy.roots, ['assets', 'public'])

  const discovered = await discoverThemeOwnedAssets()
  const paths = discovered.map(asset => asset.path)
  assert.ok(paths.includes('assets/ICT/signature-official.png'))
  assert.ok(paths.includes('assets/UCAS/emblem-name-bilingual-hz.svg'))
  assert.deepEqual(findOversizedThemeAssets(discovered), [])

  assert.deepEqual(findOversizedThemeAssets([
    { bytes: 256_000, path: 'assets/reviewed.bin' },
    { bytes: 256_001, path: 'assets/unlisted.bin' },
  ]), [{
    bytes: 256_001,
    maximumBytes: 256_000,
    path: 'assets/unlisted.bin',
  }])

  for (const exception of themeOwnedAssetPolicy.reviewedExceptions) {
    assert.ok(exception.path)
    assert.ok(Number.isSafeInteger(exception.bytes))
    assert.ok(exception.reviewer)
    assert.ok(exception.rationale)
    assert.ok(exception.mitigation)
    assert.ok(exception.followUp)
  }
})

test('theme-owned image elements reserve their intrinsic geometry', async () => {
  const componentPath = resolve(repositoryRoot, 'internals/PresetBranding.vue')
  const component = await readFile(componentPath, 'utf8')
  const imports = new Map(
    [...component.matchAll(
      /import\s+(\w+)\s+from\s+['"]\.\.\/(assets\/[^'"]+)['"]/g,
    )].map(([, identifier, path]) => [identifier, path]),
  )
  const imageTags = [...component.matchAll(/<img\b[\s\S]*?\/>/g)]

  assert.ok(imageTags.length > 0)
  for (const [index, match] of imageTags.entries()) {
    const tag = match[0]
    const width = Number(tag.match(/\bwidth="(\d+)"/)?.[1])
    const height = Number(tag.match(/\bheight="(\d+)"/)?.[1])
    const expression = tag.match(/:src="([^"]+)"/)?.[1] ?? ''
    const referencedAssets = [...imports]
      .filter(([identifier]) => new RegExp(`\\b${identifier}\\b`).test(expression))
      .map(([, path]) => path)

    assert.ok(Number.isFinite(width) && width > 0, `image ${index}: width`)
    assert.ok(Number.isFinite(height) && height > 0, `image ${index}: height`)
    assert.match(tag, /\balt="[^"]*"/, `image ${index}: alt text`)
    assert.match(tag, /\bdecoding="(?:async|sync)"/, `image ${index}: decoding`)
    assert.ok(referencedAssets.length > 0, `image ${index}: imported source`)

    for (const path of referencedAssets) {
      const intrinsic = await intrinsicDimensions(path)
      assert.deepEqual(
        { height, width },
        intrinsic,
        `image ${index}: ${path} intrinsic dimensions`,
      )
    }
  }
})


test('published assets contain only the institution signatures used by the theme', async () => {
  const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'))
  const assets = manifest.files.filter(path => /^(assets|public)(\/|$)/.test(path))
  assert.deepEqual(assets.sort(), [
    'assets/ICT/SOURCES.md',
    'assets/ICT/signature-official.png',
    'assets/UCAS/emblem-name-bilingual-hz.svg',
  ])
  assert.equal(manifest.name, 'slidev-theme-zhubai')
  assert.equal(manifest.slidev.defaults.colorSchema, 'light')
  assert.equal(manifest.slidev.colorSchema, 'both')
  assert.ok(manifest.engines.slidev, 'declare the supported Slidev version')
})
