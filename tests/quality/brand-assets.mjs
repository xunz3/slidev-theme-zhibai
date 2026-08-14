import { createHash } from 'node:crypto'
import { lstat, readFile, readdir } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'
import {
  stripAllowlistedUcasMetadata,
  ucasSvgPaths,
} from '../../scripts/optimize-brand-assets.mjs'
import { repositoryRoot } from './helpers.mjs'

export {
  stripAllowlistedUcasMetadata,
  ucasSvgPaths,
}

export const brandBaselinePath = resolve(
  repositoryRoot,
  'tests/quality/baselines/brand-assets.json',
)
export const brandVisualBaselineDirectory = resolve(
  repositoryRoot,
  'tests/quality/baselines/visual/brands',
)

export const requiredPairPaths = [
  'assets/UCAS/emblem.svg',
  'assets/UCAS/emblem-name-bilingual-hz.svg',
]

export const themeOwnedAssetPolicy = Object.freeze({
  maximumBytes: 256_000,
  roots: Object.freeze(['assets', 'public']),
  reviewedExceptions: Object.freeze([]),
})

const portablePath = path => path.split(sep).join('/')

export const discoverThemeOwnedAssets = async ({
  policy = themeOwnedAssetPolicy,
  root = repositoryRoot,
} = {}) => {
  const discovered = []
  const visit = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const absolutePath = resolve(directory, entry.name)
      const path = portablePath(relative(root, absolutePath))
      if (entry.isSymbolicLink()) {
        throw new Error(`${path}: symbolic links are not valid shipped assets`)
      }
      if (entry.isDirectory()) {
        await visit(absolutePath)
        continue
      }
      if (!entry.isFile()) {
        throw new Error(`${path}: shipped assets must be regular files`)
      }
      const metadata = await lstat(absolutePath)
      discovered.push({
        bytes: metadata.size,
        path,
      })
    }
  }

  for (const assetRoot of policy.roots) {
    const directory = resolve(root, assetRoot)
    const metadata = await lstat(directory).catch(() => null)
    if (!metadata) continue
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error(`${assetRoot}: shipped asset root must be a directory`)
    }
    await visit(directory)
  }
  return discovered.sort((left, right) => left.path.localeCompare(right.path))
}

export const findOversizedThemeAssets = (
  assets,
  policy = themeOwnedAssetPolicy,
) => {
  const reviewed = new Set(
    policy.reviewedExceptions.map(exception => (
      `${exception.path}\0${exception.bytes}`
    )),
  )
  return assets
    .filter(asset => (
      asset.bytes > policy.maximumBytes
      && !reviewed.has(`${asset.path}\0${asset.bytes}`)
    ))
    .map(asset => ({
      bytes: asset.bytes,
      maximumBytes: policy.maximumBytes,
      path: asset.path,
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
}

export const brandAssetDefinitions = [
  {
    path: 'assets/ICT/emblem-name-bilingual-stacked.svg',
    displayRoles: ['cover-lockup', 'section-lockup'],
    referenceSize: { height: 180, width: 242 },
  },
  {
    path: 'assets/ICT/emblem.svg',
    displayRoles: ['section-watermark'],
    referenceSize: { height: 120, width: 146 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-hz-kaiti.svg',
    displayRoles: ['package-only-source'],
    referenceSize: { height: 57, width: 320 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-hz-white.png',
    displayRoles: ['section-wordmark'],
    referenceSize: { height: 67, width: 320 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-hz.svg',
    displayRoles: ['package-only-source'],
    referenceSize: { height: 67, width: 320 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-stacked.svg',
    displayRoles: ['package-only-source'],
    referenceSize: { height: 133, width: 240 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-vt-kaiti.svg',
    displayRoles: ['package-only-source'],
    referenceSize: { height: 300, width: 59 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-vt-white.png',
    displayRoles: ['cover-lockup'],
    referenceSize: { height: 300, width: 59 },
  },
  {
    path: 'assets/UCAS/emblem-name-bilingual-vt.svg',
    displayRoles: ['package-only-source'],
    referenceSize: { height: 300, width: 59 },
  },
  {
    path: 'assets/UCAS/emblem-white.png',
    displayRoles: ['section-watermark'],
    referenceSize: { height: 128, width: 128 },
  },
  {
    path: 'assets/UCAS/emblem.svg',
    displayRoles: ['cover-watermark'],
    referenceSize: { height: 128, width: 128 },
  },
  {
    path: 'assets/UCAS/sidebar-gradient.png',
    displayRoles: ['cover-rail-background'],
    referenceSize: { height: 552, width: 35 },
  },
]

export const sha256 = value => createHash('sha256').update(value).digest('hex')

const attributeValues = (source, attribute) => {
  const expression = new RegExp(`\\s${attribute}="([^"]*)"`, 'g')
  return [...source.matchAll(expression)].map(match => match[1])
}

const tagCount = (source, tag) => (
  [...source.matchAll(new RegExp(`<${tag}(?:\\s|>)`, 'g'))].length
)

const fingerprintValues = values => ({
  count: values.length,
  sha256: sha256(`${values.join('\n')}\n`),
})

export const inspectSvg = (source, { ucas = false } = {}) => {
  const root = source.match(/<svg\b([^>]*)>/)
  if (!root) throw new Error('SVG root element is missing')
  const readRootAttribute = (name) => (
    root[1].match(new RegExp(`\\s${name}="([^"]+)"`))?.[1] ?? null
  )
  const normalized = ucas ? stripAllowlistedUcasMetadata(source) : source
  const structuralSource = ucas ? normalized : source

  return {
    dimensions: {
      height: readRootAttribute('height'),
      viewBox: readRootAttribute('viewBox'),
      width: readRootAttribute('width'),
    },
    elementCounts: {
      circle: tagCount(structuralSource, 'circle'),
      defs: tagCount(structuralSource, 'defs'),
      ellipse: tagCount(structuralSource, 'ellipse'),
      g: tagCount(structuralSource, 'g'),
      image: tagCount(structuralSource, 'image'),
      path: tagCount(structuralSource, 'path'),
      polygon: tagCount(structuralSource, 'polygon'),
      rect: tagCount(structuralSource, 'rect'),
      text: tagCount(structuralSource, 'text'),
      use: tagCount(structuralSource, 'use'),
    },
    fills: fingerprintValues(attributeValues(structuralSource, 'fill')),
    ids: fingerprintValues(attributeValues(structuralSource, 'id')),
    normalizedBytes: Buffer.byteLength(normalized),
    normalizedSha256: sha256(normalized),
    pathData: fingerprintValues(attributeValues(structuralSource, 'd')),
    transforms: fingerprintValues(attributeValues(structuralSource, 'transform')),
  }
}

export const inspectPng = (buffer) => {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('PNG signature is missing')
  }
  const colorType = buffer.readUInt8(25)
  return {
    dimensions: {
      height: buffer.readUInt32BE(20),
      width: buffer.readUInt32BE(16),
    },
    encodedAlpha: colorType === 4 || colorType === 6,
    pngColorType: colorType,
  }
}

export const inspectBrandSource = async (definition) => {
  const absolutePath = resolve(repositoryRoot, definition.path)
  const buffer = await readFile(absolutePath)
  const format = extname(definition.path).slice(1).toLowerCase()
  const source = format === 'svg' ? buffer.toString('utf8') : null

  return {
    ...definition,
    format,
    rawBytes: buffer.length,
    rawSha256: sha256(buffer),
    source: format === 'svg'
      ? inspectSvg(source, { ucas: definition.path.startsWith('assets/UCAS/') })
      : inspectPng(buffer),
  }
}

const dataUrl = (format, buffer) => (
  `data:image/${format === 'svg' ? 'svg+xml' : 'png'};base64,${buffer.toString('base64')}`
)

export const renderBrandReference = async (page, definition) => {
  const buffer = await readFile(resolve(repositoryRoot, definition.path))
  const rendered = await page.evaluate(async ({ height, src, width }) => {
    const image = new Image()
    image.decoding = 'sync'
    image.src = src
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    const rgba = context.getImageData(0, 0, width, height).data
    const alpha = new Uint8Array(width * height)
    let opaquePixels = 0
    let translucentPixels = 0
    let transparentPixels = 0
    for (let pixel = 0; pixel < alpha.length; pixel += 1) {
      const value = rgba[(pixel * 4) + 3]
      alpha[pixel] = value
      if (value === 0) transparentPixels += 1
      else if (value === 255) opaquePixels += 1
      else translucentPixels += 1
    }
    const encode = (value) => {
      let binary = ''
      for (let offset = 0; offset < value.length; offset += 0x8000) {
        binary += String.fromCharCode(...value.subarray(offset, offset + 0x8000))
      }
      return btoa(binary)
    }

    return {
      alpha: {
        opaquePixels,
        bytes: encode(alpha),
        translucentPixels,
        transparentPixels,
      },
      intrinsic: {
        height: image.naturalHeight,
        width: image.naturalWidth,
      },
      png: canvas.toDataURL('image/png'),
      rgbaBytes: encode(rgba),
    }
  }, {
    ...definition.referenceSize,
    src: dataUrl(extname(definition.path).slice(1).toLowerCase(), buffer),
  })

  return {
    alpha: {
      opaquePixels: rendered.alpha.opaquePixels,
      sha256: sha256(Buffer.from(rendered.alpha.bytes, 'base64')),
      translucentPixels: rendered.alpha.translucentPixels,
      transparentPixels: rendered.alpha.transparentPixels,
    },
    intrinsic: rendered.intrinsic,
    png: rendered.png,
    rgbaSha256: sha256(Buffer.from(rendered.rgbaBytes, 'base64')),
  }
}

export const visualReferenceName = path => (
  `${path.replace(/^assets\//, '').replaceAll('/', '--').replace(/\.[^.]+$/, '')}.png`
)
