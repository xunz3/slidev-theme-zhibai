import { computed, ref, watch } from 'vue'

export const MEDIA_FITS = Object.freeze(['contain', 'cover'] as const)

export const IMAGE_TEXT_MEDIA_RATIO_MIN = 30
export const IMAGE_TEXT_MEDIA_RATIO_MAX = 70
export const IMAGE_TEXT_MEDIA_RATIO_DEFAULT = 50

export type MediaFit = typeof MEDIA_FITS[number]
export type MediaLoadState = 'missing' | 'pending' | 'ready' | 'failed'

export type MediaAlternative = Readonly<{
  decorative: boolean
  resolvedAlt: string
}>

const supportedFits = new Set<string>(MEDIA_FITS)
const UNSAFE_BACKGROUND_SIZE = /[;{}]/
const MEDIA_POSITION_HORIZONTAL = '(?:left|center|right)'
const MEDIA_POSITION_VERTICAL = '(?:top|center|bottom)'
const MEDIA_POSITION_PERCENTAGE = '(?:100(?:\\.0+)?|\\d{1,2}(?:\\.\\d+)?)%'
const SAFE_MEDIA_POSITION = new RegExp(
  `^(?:${MEDIA_POSITION_HORIZONTAL}|${MEDIA_POSITION_VERTICAL}|${MEDIA_POSITION_HORIZONTAL}\\s+${MEDIA_POSITION_VERTICAL}|${MEDIA_POSITION_VERTICAL}\\s+${MEDIA_POSITION_HORIZONTAL}|${MEDIA_POSITION_PERCENTAGE}(?:\\s+${MEDIA_POSITION_PERCENTAGE})?)$`,
  'i',
)

export const normalizeMediaSource = (value: unknown): string => (
  typeof value === 'string' ? value.trim() : ''
)

export const normalizeMediaFit = (
  value: unknown,
  fallback: MediaFit = 'contain',
): MediaFit => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  return supportedFits.has(normalized) ? normalized as MediaFit : fallback
}

export const isMediaFit = (value: unknown): value is MediaFit => (
  typeof value === 'string'
  && supportedFits.has(value.trim().toLowerCase())
)

export const normalizeMediaBackgroundSize = (
  value: unknown,
  fallback = 'contain',
): string => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  if (
    !normalized
    || normalized.length > 256
    || UNSAFE_BACKGROUND_SIZE.test(normalized)
  ) return fallback
  return normalized
}

export const normalizeImageTextMediaRatio = (
  value: unknown,
  fallback = IMAGE_TEXT_MEDIA_RATIO_DEFAULT,
): number => {
  const normalizedFallback = Number.isFinite(fallback)
    ? Math.min(
        IMAGE_TEXT_MEDIA_RATIO_MAX,
        Math.max(IMAGE_TEXT_MEDIA_RATIO_MIN, fallback),
      )
    : IMAGE_TEXT_MEDIA_RATIO_DEFAULT
  const candidate = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN
  if (!Number.isFinite(candidate)) return normalizedFallback
  return Math.min(
    IMAGE_TEXT_MEDIA_RATIO_MAX,
    Math.max(IMAGE_TEXT_MEDIA_RATIO_MIN, candidate),
  )
}

export const normalizeMediaPosition = (
  value: unknown,
  fallback = 'center',
): string => {
  const normalizedFallback = typeof fallback === 'string'
    && SAFE_MEDIA_POSITION.test(fallback.trim())
    ? fallback.trim().toLowerCase().replace(/\s+/g, ' ')
    : 'center'
  if (typeof value !== 'string') return normalizedFallback
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ')
  return SAFE_MEDIA_POSITION.test(normalized)
    ? normalized
    : normalizedFallback
}

export const resolveMediaAlternative = ({
  alt,
  fallback,
}: {
  alt: unknown
  fallback: unknown
}): MediaAlternative => {
  const authored = typeof alt === 'string' ? alt.trim() : null
  const decorative = authored !== null && authored === ''
  const fallbackText = typeof fallback === 'string' ? fallback.trim() : ''
  return Object.freeze({
    decorative,
    resolvedAlt: authored ?? fallbackText,
  })
}

export const mediaStateForSource = (source: unknown): MediaLoadState => (
  normalizeMediaSource(source) ? 'pending' : 'missing'
)

export const mediaStateAfterEvent = (
  event: 'load' | 'error',
): MediaLoadState => event === 'load' ? 'ready' : 'failed'

export const shouldRenderMediaFallback = ({
  decorative,
  state,
}: {
  decorative: boolean
  state: MediaLoadState
}): boolean => (
  !decorative && (state === 'missing' || state === 'failed')
)

export const useMediaLoadState = ({
  alt,
  fallback,
  source,
}: {
  alt: () => unknown
  fallback: () => unknown
  source: () => unknown
}) => {
  const normalizedSource = computed(() => normalizeMediaSource(source()))
  const alternative = computed(() => resolveMediaAlternative({
    alt: alt(),
    fallback: fallback(),
  }))
  const loadState = ref<MediaLoadState>('missing')
  const retryCount = ref(0)

  watch(normalizedSource, (value) => {
    retryCount.value = 0
    loadState.value = mediaStateForSource(value)
  }, { immediate: true })

  const onLoad = () => {
    loadState.value = mediaStateAfterEvent('load')
  }
  const onError = () => {
    loadState.value = mediaStateAfterEvent('error')
  }
  const retry = () => {
    if (!normalizedSource.value) return
    retryCount.value += 1
    loadState.value = 'pending'
  }
  const imageKey = computed(() => `${normalizedSource.value}:${retryCount.value}`)
  const showImage = computed(() => (
    Boolean(normalizedSource.value) && loadState.value !== 'failed'
  ))
  const showFallback = computed(() => shouldRenderMediaFallback({
    decorative: alternative.value.decorative,
    state: loadState.value,
  }))

  return {
    alternative,
    imageKey,
    loadState,
    onError,
    onLoad,
    retry,
    showFallback,
    showImage,
    source: normalizedSource,
  }
}
