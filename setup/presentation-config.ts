export const PRESENTATION_PRESETS = Object.freeze([
  'default',
  'ucas',
  'ict',
] as const)

export const PRESENTATION_DENSITIES = Object.freeze([
  'compact',
  'normal',
  'relaxed',
] as const)

export const PRESENTATION_CHROME_VALUES = Object.freeze([
  'auto',
  'on',
  'off',
] as const)

export const FRAME_VARIANTS = Object.freeze([
  'default',
  'cover',
  'intro',
  'section',
  'toc',
  'center',
  'two-cols',
  'statement',
  'quote',
  'figure',
  'references',
  'closing',
  'image-text',
  'code',
] as const)

type TupleValue<T extends readonly unknown[]> = T[number]

export type PresentationPreset = TupleValue<typeof PRESENTATION_PRESETS>
export type PresentationDensity = TupleValue<typeof PRESENTATION_DENSITIES>
export type PresentationChrome = TupleValue<typeof PRESENTATION_CHROME_VALUES>
export type FrameVariant = TupleValue<typeof FRAME_VARIANTS>
export type CssColorSupport = (value: string) => boolean

export type DeckPresentationState = Readonly<{
  preset: PresentationPreset
  density: PresentationDensity
  chrome: PresentationChrome
  header: boolean
  footerAuthors: boolean
  pageNumber: boolean
  accent: string | null
}>

export type ResolvedPresentationState = DeckPresentationState & Readonly<{
  variant: FrameVariant
  showChrome: boolean
  showHeader: boolean
}>

type PresentationOptionDefinition<T> = Readonly<{
  deckKey: string
  inputKeys: readonly string[]
  slideKeys: readonly string[]
  defaultValue: T
  normalize: (value: unknown, supportsColor?: CssColorSupport) => T | undefined
}>

const normalizeEnum = <T extends string>(
  value: unknown,
  acceptedValues: readonly T[],
): T | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return acceptedValues.includes(normalized as T) ? normalized as T : undefined
}

export const normalizePreset = (value: unknown): PresentationPreset | undefined => {
  return normalizeEnum(value, PRESENTATION_PRESETS)
}

export const normalizeDensity = (value: unknown): PresentationDensity | undefined => {
  return normalizeEnum(value, PRESENTATION_DENSITIES)
}

export const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (value === true || value === false) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.trim()
  if (normalized === 'true' || normalized === 'on') return true
  if (normalized === 'false' || normalized === 'off') return false
  return undefined
}

export const normalizeChrome = (value: unknown): PresentationChrome | undefined => {
  const enumValue = normalizeEnum(value, PRESENTATION_CHROME_VALUES)
  if (enumValue) return enumValue

  const booleanValue = normalizeBoolean(value)
  if (booleanValue === true) return 'on'
  if (booleanValue === false) return 'off'
  return undefined
}

const FALLBACK_COLOR_PATTERN = /^(?:#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|var)\(.+\)|(?:aliceblue|black|blue|currentcolor|gray|green|grey|inherit|initial|orange|purple|rebeccapurple|red|transparent|white|yellow))$/i

export const supportsCssColor: CssColorSupport = (value) => {
  if (typeof globalThis.CSS?.supports === 'function') {
    return globalThis.CSS.supports('color', value)
  }

  if (typeof document !== 'undefined') {
    const probe = document.createElement('span')
    probe.style.color = ''
    probe.style.color = value
    return probe.style.color !== ''
  }

  // Server rendering cannot query the browser parser. This conservative fallback covers the
  // documented/common CSS color forms; the client re-evaluates through CSS.supports.
  return FALLBACK_COLOR_PATTERN.test(value)
}

export const normalizeAccent = (
  value: unknown,
  supportsColor: CssColorSupport = supportsCssColor,
): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized || !supportsColor(normalized)) return undefined
  return normalized
}

export const normalizeFrameVariant = (value: unknown): FrameVariant | undefined => {
  return normalizeEnum(value, FRAME_VARIANTS)
}

const freezeDefinition = <T>(
  definition: Omit<
    PresentationOptionDefinition<T>,
    'inputKeys' | 'slideKeys'
  > & {
    inputKeys?: readonly string[]
    slideKeys: readonly string[]
  },
): PresentationOptionDefinition<T> => {
  return Object.freeze({
    ...definition,
    inputKeys: Object.freeze([...(definition.inputKeys ?? [])]),
    slideKeys: Object.freeze([...definition.slideKeys]),
  })
}

export const PRESENTATION_OPTIONS = Object.freeze({
  preset: freezeDefinition<PresentationPreset>({
    deckKey: 'preset',
    slideKeys: ['presentationPreset'],
    defaultValue: 'default',
    normalize: normalizePreset,
  }),
  density: freezeDefinition<PresentationDensity>({
    deckKey: 'density',
    slideKeys: ['presentationDensity'],
    defaultValue: 'normal',
    normalize: normalizeDensity,
  }),
  chrome: freezeDefinition<PresentationChrome>({
    deckKey: 'chrome',
    inputKeys: ['chrome'],
    slideKeys: ['presentationChrome', 'chrome'],
    defaultValue: 'auto',
    normalize: normalizeChrome,
  }),
  header: freezeDefinition<boolean>({
    deckKey: 'header',
    slideKeys: ['presentationHeader', 'header'],
    defaultValue: false,
    normalize: normalizeBoolean,
  }),
  footerAuthors: freezeDefinition<boolean>({
    deckKey: 'footerAuthors',
    slideKeys: ['footerAuthors'],
    defaultValue: true,
    normalize: normalizeBoolean,
  }),
  pageNumber: freezeDefinition<boolean>({
    deckKey: 'pageNumber',
    slideKeys: ['pageNumber'],
    defaultValue: true,
    normalize: normalizeBoolean,
  }),
  accent: freezeDefinition<string | null>({
    deckKey: 'accent',
    slideKeys: ['accent'],
    defaultValue: null,
    normalize: normalizeAccent,
  }),
} satisfies Record<string, PresentationOptionDefinition<unknown>>)

export type PresentationOptionKey = keyof typeof PRESENTATION_OPTIONS

export const PRESENTATION_OPTION_KEYS = Object.freeze(
  Object.keys(PRESENTATION_OPTIONS) as PresentationOptionKey[],
)

const optionDefinition = <K extends PresentationOptionKey>(
  key: K,
): PresentationOptionDefinition<DeckPresentationState[K]> => (
  PRESENTATION_OPTIONS[key] as unknown as
  PresentationOptionDefinition<DeckPresentationState[K]>
)

export const PRESENTATION_DEFAULTS = Object.freeze(
  Object.fromEntries(PRESENTATION_OPTION_KEYS.map(key => [
    key,
    optionDefinition(key).defaultValue,
  ])) as DeckPresentationState,
)

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

const firstValid = <T>(
  normalize: (
    value: unknown,
    supportsColor?: CssColorSupport,
  ) => T | undefined,
  candidates: readonly unknown[],
  fallback: T,
  supportsColor?: CssColorSupport,
): T => {
  for (const candidate of candidates) {
    const normalized = normalize(candidate, supportsColor)
    if (normalized !== undefined) return normalized
  }
  return fallback
}

export const resolveDeckOption = <K extends PresentationOptionKey>(
  key: K,
  raw: Readonly<Record<string, unknown>>,
  supportsColor: CssColorSupport,
): DeckPresentationState[K] => {
  const definition = optionDefinition(key)
  return firstValid(
    definition.normalize,
    [raw[definition.deckKey]],
    definition.defaultValue,
    supportsColor,
  )
}

export const resolveSlideOption = <K extends PresentationOptionKey>(
  key: K,
  input: Readonly<Record<string, unknown>>,
  slide: Readonly<Record<string, unknown>>,
  deck: DeckPresentationState,
  supportsColor: CssColorSupport,
): DeckPresentationState[K] => {
  const definition = optionDefinition(key)
  return firstValid(
    definition.normalize,
    [
      ...definition.inputKeys.map(inputKey => input[inputKey]),
      ...definition.slideKeys.map(slideKey => slide[slideKey]),
      deck[key],
    ],
    definition.defaultValue,
    supportsColor,
  )
}

export const resolveDeckPresentation = (
  rawPresentation?: unknown,
  options: Readonly<{ supportsColor?: CssColorSupport }> = {},
): DeckPresentationState => {
  const raw = asRecord(rawPresentation)
  const supportsColor = options.supportsColor ?? supportsCssColor

  return Object.freeze(Object.fromEntries(
    PRESENTATION_OPTION_KEYS.map(key => [
      key,
      resolveDeckOption(key, raw, supportsColor),
    ]),
  ) as unknown as DeckPresentationState)
}

export const deriveChromeVisibility = (
  chrome: PresentationChrome,
  variant: FrameVariant,
): boolean => {
  if (chrome === 'on') return true
  if (chrome === 'off') return false
  return variant !== 'cover'
    && variant !== 'section'
    && variant !== 'closing'
}

export const deriveHeaderVisibility = (
  showChrome: boolean,
  header: boolean,
): boolean => {
  return showChrome && header
}

export const resolvePresentation = (
  input: Readonly<{
    deck?: unknown
    slide?: unknown
    chrome?: unknown
    variant?: unknown
    supportsColor?: CssColorSupport
  }> = {},
): ResolvedPresentationState => {
  const deck = resolveDeckPresentation(input.deck, {
    supportsColor: input.supportsColor,
  })
  const slide = asRecord(input.slide)
  const rawInput = asRecord(input)
  const supportsColor = input.supportsColor ?? supportsCssColor
  const variant = normalizeFrameVariant(input.variant) ?? 'default'

  const resolved = Object.fromEntries(PRESENTATION_OPTION_KEYS.map(key => [
    key,
    resolveSlideOption(key, rawInput, slide, deck, supportsColor),
  ])) as unknown as DeckPresentationState
  const {
    accent,
    chrome,
    density,
    footerAuthors,
    header,
    pageNumber,
    preset,
  } = resolved
  const showChrome = deriveChromeVisibility(chrome, variant)
  const showHeader = deriveHeaderVisibility(showChrome, header)

  return Object.freeze({
    preset,
    density,
    chrome,
    header,
    footerAuthors,
    pageNumber,
    accent,
    variant,
    showChrome,
    showHeader,
  })
}
