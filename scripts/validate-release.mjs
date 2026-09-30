import { appendFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const validateRelease = ({ version, tag, prerelease }) => {
  const match = typeof version === 'string' && version.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?$/,
  )
  if (!match || match[0] !== version || match[4]?.split('.').some(part => /^0\d+$/.test(part))) {
    throw new Error(`Invalid package semver: ${String(version)}`)
  }
  if (tag !== `v${version}`) {
    throw new Error(`Release tag must exactly match v${version}; received ${String(tag)}`)
  }
  if (prerelease !== 'true' && prerelease !== 'false') {
    throw new Error('RELEASE_PRERELEASE must be the GitHub release boolean string "true" or "false"')
  }
  const isPrerelease = Boolean(match[4])
  if ((prerelease === 'true') !== isPrerelease) {
    throw new Error(`GitHub prerelease flag must be ${isPrerelease} for version ${version}`)
  }
  return { version, dist_tag: isPrerelease ? 'next' : 'latest' }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const metadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    const result = validateRelease({
      version: metadata.version,
      tag: process.env.RELEASE_TAG,
      prerelease: process.env.RELEASE_PRERELEASE,
    })
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(process.env.GITHUB_OUTPUT, `version=${result.version}\ndist_tag=${result.dist_tag}\n`)
    }
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error(`Release validation failed: ${error.message}`)
    process.exitCode = 1
  }
}
