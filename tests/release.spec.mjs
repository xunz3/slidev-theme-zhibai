import assert from 'node:assert/strict'
import test from 'node:test'
import { validateRelease } from '../scripts/validate-release.mjs'

test('stable releases publish under latest and prereleases under next', () => {
  assert.deepEqual(validateRelease({ version: '0.5.0', tag: 'v0.5.0', prerelease: 'false' }), {
    version: '0.5.0', dist_tag: 'latest',
  })
  assert.deepEqual(validateRelease({ version: '0.6.0-rc.1', tag: 'v0.6.0-rc.1', prerelease: 'true' }), {
    version: '0.6.0-rc.1', dist_tag: 'next',
  })
})

test('release tags cannot silently publish a different checked-out version', () => {
  for (const tag of [undefined, '0.5.0', 'v0.4.0', 'v0.5.0 ', 'v0.5.0\ndist_tag=latest']) {
    assert.throws(() => validateRelease({ version: '0.5.0', tag, prerelease: 'false' }), /exactly match/)
  }
})

test('GitHub prerelease metadata must agree with semver and be explicit', () => {
  for (const [version, prerelease] of [
    ['0.5.0', 'true'], ['0.5.0-rc.1', 'false'],
    ['0.5.0', undefined], ['0.5.0', ''], ['0.5.0', 'FALSE'],
  ]) {
    assert.throws(() => validateRelease({ version, tag: `v${version}`, prerelease }), /prerelease|RELEASE_PRERELEASE/)
  }
})

test('malformed versions cannot influence publish tags or GitHub outputs', () => {
  for (const version of [undefined, 'v0.5.0', '0.5', '00.5.0', '0.5.0-01', '0.5.0-rc.01', '0.5.0-', '0.5.0\n', '0.5.0\ndist_tag=next']) {
    assert.throws(() => validateRelease({ version, tag: `v${version}`, prerelease: 'false' }), /semver/)
  }
})
