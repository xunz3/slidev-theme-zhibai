import { lstat, readdir } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { repositoryRoot } from './helpers.mjs'

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
