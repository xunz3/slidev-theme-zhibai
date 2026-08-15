export type CompatibilityStatus = 'compatible' | 'unverified' | 'incompatible'
export type CompatibilityScope = 'core' | 'core+profile'
export type CompatibilityReasonCode =
  | 'COMPATIBLE_CORE'
  | 'COMPATIBLE_CORE_AND_PROFILE'
  | 'THEME_DECLARATION_MISSING'
  | 'THEME_DECLARATION_MALFORMED'
  | 'CORE_ID_UNSUPPORTED'
  | 'CORE_VERSION_UNSUPPORTED'
  | 'PROFILE_ID_UNSUPPORTED'
  | 'PROFILE_VERSION_UNSUPPORTED'

export interface ExactCoordinate {
  readonly id: string
  readonly version: string
}

export interface VersionRange {
  readonly minInclusive: string
  readonly maxExclusive: string
}

export interface SupportCoordinate {
  readonly id: string
  readonly ranges: readonly VersionRange[]
}

export interface DeckDeclaration {
  readonly core: ExactCoordinate
  readonly profile?: ExactCoordinate
}

export interface ThemeSupportDeclaration {
  readonly schemaVersion: 1
  readonly core: SupportCoordinate
  readonly profiles: readonly SupportCoordinate[]
}

export interface ValidationIssue {
  readonly path: string
  readonly message: string
}

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] }

export interface CompatibilityAssessment {
  readonly status: CompatibilityStatus
  readonly scope: CompatibilityScope
  readonly reasonCode: CompatibilityReasonCode
  readonly message: string
  readonly core: {
    readonly status: CompatibilityStatus
    readonly requested: ExactCoordinate
    readonly supportedRanges: readonly VersionRange[]
  }
  readonly profile: {
    readonly status: CompatibilityStatus | 'not-applicable'
    readonly requested: ExactCoordinate | null
    readonly supportedRanges: readonly VersionRange[]
  }
}

interface StableVersion {
  readonly raw: string
  readonly major: number
  readonly minor: number
  readonly patch: number
}

const STABLE_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/
const COORDINATE_ID =
  /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)+$/

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const issue = (path: string, message: string): ValidationIssue => ({
  path,
  message,
})

const failure = <T>(issues: readonly ValidationIssue[]): ParseResult<T> => ({
  ok: false,
  issues,
})

const success = <T>(value: T): ParseResult<T> => ({ ok: true, value })

const unknownFieldIssues = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): ValidationIssue[] => Object.keys(value)
  .filter(key => !allowed.includes(key))
  .map(key => issue(`${path}.${key}`, 'Unexpected field.'))

const parseStableVersion = (
  value: unknown,
  path: string,
): ParseResult<StableVersion> => {
  if (typeof value !== 'string') {
    return failure([issue(path, 'Expected a stable semantic version string.')])
  }
  const match = STABLE_VERSION.exec(value)
  if (!match) {
    return failure([issue(path, 'Expected stable SemVer in major.minor.patch form.')])
  }
  return success({
    raw: value,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  })
}

const compareVersions = (left: StableVersion, right: StableVersion): number => (
  left.major - right.major
  || left.minor - right.minor
  || left.patch - right.patch
)

const parseCoordinate = (
  value: unknown,
  path: string,
): ParseResult<ExactCoordinate> => {
  if (!isRecord(value)) {
    return failure([issue(path, 'Expected an exact protocol coordinate.')])
  }
  const issues = unknownFieldIssues(value, ['id', 'version'], path)
  if (typeof value.id !== 'string' || !COORDINATE_ID.test(value.id)) {
    issues.push(issue(`${path}.id`, 'Expected a namespaced coordinate ID.'))
  }
  const version = parseStableVersion(value.version, `${path}.version`)
  if (!version.ok) issues.push(...version.issues)
  if (issues.length > 0 || !version.ok || typeof value.id !== 'string') {
    return failure(issues)
  }
  return success({ id: value.id, version: version.value.raw })
}

const parseRange = (
  value: unknown,
  path: string,
): ParseResult<VersionRange> => {
  if (!isRecord(value)) {
    return failure([issue(path, 'Expected a half-open version range.')])
  }
  const issues = unknownFieldIssues(
    value,
    ['minInclusive', 'maxExclusive'],
    path,
  )
  const minimum = parseStableVersion(value.minInclusive, `${path}.minInclusive`)
  const maximum = parseStableVersion(value.maxExclusive, `${path}.maxExclusive`)
  if (!minimum.ok) issues.push(...minimum.issues)
  if (!maximum.ok) issues.push(...maximum.issues)
  if (
    minimum.ok
    && maximum.ok
    && compareVersions(minimum.value, maximum.value) >= 0
  ) {
    issues.push(
      issue(path, 'The exclusive maximum must exceed the inclusive minimum.'),
    )
  }
  if (issues.length > 0 || !minimum.ok || !maximum.ok) {
    return failure(issues)
  }
  return success({
    minInclusive: minimum.value.raw,
    maxExclusive: maximum.value.raw,
  })
}

const parseSupportCoordinate = (
  value: unknown,
  path: string,
): ParseResult<SupportCoordinate> => {
  if (!isRecord(value)) {
    return failure([issue(path, 'Expected a support coordinate.')])
  }
  const issues = unknownFieldIssues(value, ['id', 'ranges'], path)
  if (typeof value.id !== 'string' || !COORDINATE_ID.test(value.id)) {
    issues.push(issue(`${path}.id`, 'Expected a namespaced coordinate ID.'))
  }
  if (!Array.isArray(value.ranges) || value.ranges.length === 0) {
    issues.push(issue(`${path}.ranges`, 'Expected one or more version ranges.'))
  }
  const ranges: VersionRange[] = []
  if (Array.isArray(value.ranges)) {
    for (const [index, rawRange] of value.ranges.entries()) {
      const range = parseRange(rawRange, `${path}.ranges[${index}]`)
      if (range.ok) ranges.push(range.value)
      else issues.push(...range.issues)
    }
  }
  for (let index = 1; index < ranges.length; index += 1) {
    const priorMaximum = parseStableVersion(
      ranges[index - 1].maxExclusive,
      `${path}.ranges[${index - 1}].maxExclusive`,
    )
    const nextMinimum = parseStableVersion(
      ranges[index].minInclusive,
      `${path}.ranges[${index}].minInclusive`,
    )
    if (
      priorMaximum.ok
      && nextMinimum.ok
      && compareVersions(priorMaximum.value, nextMinimum.value) > 0
    ) {
      issues.push(
        issue(`${path}.ranges[${index}]`, 'Ranges must be sorted and non-overlapping.'),
      )
    }
  }
  if (
    issues.length > 0
    || typeof value.id !== 'string'
    || ranges.length === 0
  ) {
    return failure(issues)
  }
  return success({ id: value.id, ranges })
}

export const parseDeckDeclaration = (
  value: unknown,
): ParseResult<DeckDeclaration> => {
  if (!isRecord(value)) {
    return failure([issue('$', 'Expected a generated deck declaration.')])
  }
  const issues = unknownFieldIssues(
    value,
    ['core', 'profile'],
    '$',
  )
  const core = parseCoordinate(value.core, '$.core')
  const profile = value.profile === undefined
    ? undefined
    : parseCoordinate(value.profile, '$.profile')
  if (!core.ok) issues.push(...core.issues)
  if (profile && !profile.ok) issues.push(...profile.issues)
  if (
    issues.length > 0
    || !core.ok
    || (profile && !profile.ok)
  ) {
    return failure(issues)
  }
  return success({
    core: core.value,
    ...(profile ? { profile: profile.value } : {}),
  })
}

export const parseThemeSupportDeclaration = (
  value: unknown,
): ParseResult<ThemeSupportDeclaration> => {
  if (!isRecord(value)) {
    return failure([issue('$', 'Expected a theme support declaration.')])
  }
  const issues = unknownFieldIssues(
    value,
    ['schemaVersion', 'core', 'profiles'],
    '$',
  )
  if (value.schemaVersion !== 1) {
    issues.push(issue('$.schemaVersion', 'Expected schema version 1.'))
  }
  const core = parseSupportCoordinate(value.core, '$.core')
  if (!core.ok) issues.push(...core.issues)

  const profiles: SupportCoordinate[] = []
  if (!Array.isArray(value.profiles)) {
    issues.push(issue('$.profiles', 'Expected an array of Profile support.'))
  } else {
    for (const [index, rawProfile] of value.profiles.entries()) {
      const profile = parseSupportCoordinate(
        rawProfile,
        `$.profiles[${index}]`,
      )
      if (profile.ok) profiles.push(profile.value)
      else issues.push(...profile.issues)
    }
  }
  const profileIds = new Set<string>()
  for (const [index, profile] of profiles.entries()) {
    if (profileIds.has(profile.id)) {
      issues.push(
        issue(`$.profiles[${index}].id`, 'Profile support IDs must be unique.'),
      )
    }
    profileIds.add(profile.id)
  }
  if (
    issues.length > 0
    || value.schemaVersion !== 1
    || !core.ok
  ) {
    return failure(issues)
  }
  return success({
    schemaVersion: 1,
    core: core.value,
    profiles,
  })
}

const profileFact = (
  deck: DeckDeclaration,
  status: CompatibilityStatus | 'not-applicable',
  supportedRanges: readonly VersionRange[] = [],
) => ({
  status: deck.profile ? status : 'not-applicable' as const,
  requested: deck.profile ?? null,
  supportedRanges,
})

const result = (
  deck: DeckDeclaration,
  input: {
    readonly status: CompatibilityStatus
    readonly reasonCode: CompatibilityReasonCode
    readonly message: string
    readonly coreStatus: CompatibilityStatus
    readonly coreRanges?: readonly VersionRange[]
    readonly profileStatus: CompatibilityStatus | 'not-applicable'
    readonly profileRanges?: readonly VersionRange[]
  },
): CompatibilityAssessment => ({
  status: input.status,
  scope: deck.profile ? 'core+profile' : 'core',
  reasonCode: input.reasonCode,
  message: input.message,
  core: {
    status: input.coreStatus,
    requested: deck.core,
    supportedRanges: input.coreRanges ?? [],
  },
  profile: profileFact(
    deck,
    input.profileStatus,
    input.profileRanges ?? [],
  ),
})

const versionIsSupported = (
  version: string,
  ranges: readonly VersionRange[],
): boolean => {
  const requested = parseStableVersion(version, '$.version')
  if (!requested.ok) return false
  return ranges.some((range) => {
    const minimum = parseStableVersion(range.minInclusive, '$.minInclusive')
    const maximum = parseStableVersion(range.maxExclusive, '$.maxExclusive')
    return (
      minimum.ok
      && maximum.ok
      && compareVersions(requested.value, minimum.value) >= 0
      && compareVersions(requested.value, maximum.value) < 0
    )
  })
}

export const assessProtocolCompatibility = (
  rawDeck: unknown,
  rawSupport?: unknown,
): CompatibilityAssessment => {
  const parsedDeck = parseDeckDeclaration(rawDeck)
  if (!parsedDeck.ok) {
    throw new TypeError(
      `Invalid generated deck declaration: ${parsedDeck.issues
        .map(entry => `${entry.path} ${entry.message}`)
        .join('; ')}`,
    )
  }
  const deck = parsedDeck.value
  if (rawSupport === undefined) {
    return result(deck, {
      status: 'unverified',
      reasonCode: 'THEME_DECLARATION_MISSING',
      message:
        'Theme compatibility is unverified because no support declaration was received.',
      coreStatus: 'unverified',
      profileStatus: 'unverified',
    })
  }

  const parsedSupport = parseThemeSupportDeclaration(rawSupport)
  if (!parsedSupport.ok) {
    return result(deck, {
      status: 'incompatible',
      reasonCode: 'THEME_DECLARATION_MALFORMED',
      message:
        'The theme support declaration is malformed; fix or remove it before preview.',
      coreStatus: 'incompatible',
      profileStatus: 'incompatible',
    })
  }
  const support = parsedSupport.value
  if (support.core.id !== deck.core.id) {
    return result(deck, {
      status: 'incompatible',
      reasonCode: 'CORE_ID_UNSUPPORTED',
      message: `Theme declares ${support.core.id}, not requested ${deck.core.id}.`,
      coreStatus: 'incompatible',
      coreRanges: support.core.ranges,
      profileStatus: 'incompatible',
    })
  }
  if (!versionIsSupported(deck.core.version, support.core.ranges)) {
    return result(deck, {
      status: 'incompatible',
      reasonCode: 'CORE_VERSION_UNSUPPORTED',
      message: `Theme does not support ${deck.core.id}@${deck.core.version}.`,
      coreStatus: 'incompatible',
      coreRanges: support.core.ranges,
      profileStatus: 'incompatible',
    })
  }
  if (!deck.profile) {
    return result(deck, {
      status: 'compatible',
      reasonCode: 'COMPATIBLE_CORE',
      message: `Theme support is compatible with ${deck.core.id}@${deck.core.version}.`,
      coreStatus: 'compatible',
      coreRanges: support.core.ranges,
      profileStatus: 'not-applicable',
    })
  }

  const matchingProfile = support.profiles.find(
    candidate => candidate.id === deck.profile?.id,
  )
  if (!matchingProfile) {
    return result(deck, {
      status: 'incompatible',
      reasonCode: 'PROFILE_ID_UNSUPPORTED',
      message: `Theme does not declare support for ${deck.profile.id}.`,
      coreStatus: 'compatible',
      coreRanges: support.core.ranges,
      profileStatus: 'incompatible',
    })
  }
  if (!versionIsSupported(deck.profile.version, matchingProfile.ranges)) {
    return result(deck, {
      status: 'incompatible',
      reasonCode: 'PROFILE_VERSION_UNSUPPORTED',
      message: `Theme does not support ${deck.profile.id}@${deck.profile.version}.`,
      coreStatus: 'compatible',
      coreRanges: support.core.ranges,
      profileStatus: 'incompatible',
      profileRanges: matchingProfile.ranges,
    })
  }
  return result(deck, {
    status: 'compatible',
    reasonCode: 'COMPATIBLE_CORE_AND_PROFILE',
    message:
      `Theme support is compatible with ${deck.core.id}@${deck.core.version} `
      + `and ${deck.profile.id}@${deck.profile.version}.`,
    coreStatus: 'compatible',
    coreRanges: support.core.ranges,
    profileStatus: 'compatible',
    profileRanges: matchingProfile.ranges,
  })
}
