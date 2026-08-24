import { computed, ref, watch } from 'vue'

export const MEDIA_FITS = Object.freeze(['contain', 'cover'] as const)

export type MediaFit = typeof MEDIA_FITS[number]
export type MediaLoadState = 'missing' | 'pending' | 'ready' | 'failed'

export type MediaAlternative = Readonly<{
  decorative: boolean
  resolvedAlt: string
}>

const supportedFits = new Set<string>(MEDIA_FITS)
const UNSAFE_BACKGROUND_SIZE = /[;{}]/

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

export const GENERATED_IMAGE_FIGURE_SELECTOR = [
  'figure.obsidian-slidev-media--image',
  '.obsidian-slidev-media--image',
].join(', ')

export const GENERATED_IMAGE_ASSET_SELECTOR = [
  ':scope > img.obsidian-slidev-media__image',
  ':scope > img.obsidian-slidev-media__asset',
].join(', ')

export const isVueManagedMediaFigure = (value: unknown): boolean => (
  value instanceof Element
  && (
    value.getAttribute('data-media-managed') === 'vue'
    || Boolean(value.querySelector(':scope > .obsidian-slidev-media__viewport'))
  )
)

export const isGeneratedImageFigure = (value: unknown): value is Element => (
  value instanceof Element
  && value.matches(GENERATED_IMAGE_FIGURE_SELECTOR)
  && !isVueManagedMediaFigure(value)
  && Boolean(value.querySelector(GENERATED_IMAGE_ASSET_SELECTOR))
)

type MediaRoot = Document | Element

export const generatedImageFiguresWithin = (root: MediaRoot): Element[] => {
  const figures = new Set<Element>()
  if (root instanceof Element && isGeneratedImageFigure(root)) figures.add(root)
  if (root instanceof Element) {
    const ancestor = root.closest(GENERATED_IMAGE_FIGURE_SELECTOR)
    if (ancestor && isGeneratedImageFigure(ancestor)) figures.add(ancestor)
  }
  for (const candidate of root.querySelectorAll(GENERATED_IMAGE_FIGURE_SELECTOR)) {
    if (isGeneratedImageFigure(candidate)) figures.add(candidate)
  }
  return [...figures]
}

const GENERATED_MEDIA_FALLBACK_CLASS = 'obsidian-slidev-media__fallback'
const GENERATED_MEDIA_FALLBACK_SELECTOR = (
  `:scope > .${GENERATED_MEDIA_FALLBACK_CLASS}`
)
const GENERATED_MANAGED_SELECTOR = '[data-media-managed="generated"]'

type GeneratedMediaBinding = {
  alternativeKey: string
  image: HTMLImageElement
  onError: () => void
  onLoad: () => void
  source: string
}

const generatedMediaBindings = new WeakMap<Element, GeneratedMediaBinding>()

const setMediaAttribute = (
  element: Element,
  name: string,
  value: string,
): void => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

const generatedManagedFiguresWithin = (root: MediaRoot): Element[] => {
  const figures = new Set<Element>()
  if (root instanceof Element) {
    const ancestor = root.closest(GENERATED_MANAGED_SELECTOR)
    if (ancestor) figures.add(ancestor)
    if (root.matches(GENERATED_MANAGED_SELECTOR)) figures.add(root)
  }
  for (const candidate of root.querySelectorAll(GENERATED_MANAGED_SELECTOR)) {
    figures.add(candidate)
  }
  return [...figures]
}

const removeGeneratedMediaFallback = (figure: Element): void => {
  figure.querySelector(GENERATED_MEDIA_FALLBACK_SELECTOR)?.remove()
}

const removeGeneratedMediaBinding = (figure: Element): void => {
  const binding = generatedMediaBindings.get(figure)
  if (!binding) return
  binding.image.removeEventListener('load', binding.onLoad)
  binding.image.removeEventListener('error', binding.onError)
  generatedMediaBindings.delete(figure)
}

const renderGeneratedMediaFallback = (
  figure: Element,
  alternative: MediaAlternative,
): void => {
  removeGeneratedMediaFallback(figure)
  if (!shouldRenderMediaFallback({
    decorative: alternative.decorative,
    state: 'failed',
  })) return

  const fallback = figure.ownerDocument.createElement('div')
  fallback.className = GENERATED_MEDIA_FALLBACK_CLASS
  fallback.setAttribute('aria-label', alternative.resolvedAlt)
  fallback.setAttribute('role', 'img')
  const caption = figure.querySelector(':scope > figcaption')
  figure.insertBefore(fallback, caption)
}

const settleGeneratedMediaReady = async (
  figure: Element,
  image: HTMLImageElement,
  source: string,
): Promise<void> => {
  const current = generatedMediaBindings.get(figure)
  if (!current || current.image !== image || current.source !== source) return

  if (typeof image.decode === 'function') {
    try {
      await image.decode()
    } catch {
      if (image.naturalWidth <= 0) return
    }
  }

  const latest = generatedMediaBindings.get(figure)
  if (!latest || latest.image !== image || latest.source !== source) return
  if (image.naturalWidth <= 0) return
  removeGeneratedMediaFallback(figure)
  setMediaAttribute(
    figure,
    'data-media-state',
    mediaStateAfterEvent('load'),
  )
}

const failGeneratedMedia = (
  figure: Element,
  image: HTMLImageElement,
  alternative: MediaAlternative,
): void => {
  const current = generatedMediaBindings.get(figure)
  if (current?.image === image) removeGeneratedMediaBinding(figure)
  setMediaAttribute(
    figure,
    'data-media-state',
    mediaStateAfterEvent('error'),
  )
  image.remove()
  renderGeneratedMediaFallback(figure, alternative)
}

const bindGeneratedMedia = (
  figure: Element,
  image: HTMLImageElement,
  alternative: MediaAlternative,
  source: string,
): boolean => {
  const existing = generatedMediaBindings.get(figure)
  const alternativeKey = [
    String(alternative.decorative),
    alternative.resolvedAlt,
  ].join(':')
  if (
    existing
    && existing.image === image
    && existing.source === source
    && existing.alternativeKey === alternativeKey
  ) return false

  removeGeneratedMediaBinding(figure)
  const onLoad = () => {
    void settleGeneratedMediaReady(figure, image, source)
  }
  const onError = () => failGeneratedMedia(figure, image, alternative)
  image.addEventListener('load', onLoad)
  image.addEventListener('error', onError)
  generatedMediaBindings.set(figure, {
    alternativeKey,
    image,
    onError,
    onLoad,
    source,
  })
  return true
}

export const normalizeGeneratedImageFigures = (root: MediaRoot): number => {
  let normalized = 0
  for (const figure of generatedImageFiguresWithin(root)) {
    const image = figure.querySelector<HTMLImageElement>(
      GENERATED_IMAGE_ASSET_SELECTOR,
    )
    if (!image) continue

    const alternative = resolveMediaAlternative({
      alt: image.getAttribute('alt'),
      fallback: 'Generated image unavailable',
    })
    const source = normalizeMediaSource(image.getAttribute('src'))
    const fit = normalizeMediaFit(figure.getAttribute('data-media-fit'))

    setMediaAttribute(figure, 'data-media-managed', 'generated')
    setMediaAttribute(
      figure,
      'data-media-decorative',
      String(alternative.decorative),
    )
    setMediaAttribute(figure, 'data-media-fit', fit)
    if (image.style.getPropertyValue('--presentation-media-fit') !== fit) {
      image.style.setProperty('--presentation-media-fit', fit)
    }
    if (alternative.decorative) {
      image.setAttribute('aria-hidden', 'true')
      removeGeneratedMediaFallback(figure)
    } else {
      image.removeAttribute('aria-hidden')
      if (!image.hasAttribute('alt')) {
        image.setAttribute('alt', alternative.resolvedAlt)
      }
    }

    const bindingChanged = bindGeneratedMedia(
      figure,
      image,
      alternative,
      source,
    )
    if (!bindingChanged) {
      normalized += 1
      continue
    }

    setMediaAttribute(
      figure,
      'data-media-state',
      mediaStateForSource(source),
    )
    if (!source) {
      failGeneratedMedia(figure, image, alternative)
    } else if (image.complete) {
      if (image.naturalWidth > 0) {
        void settleGeneratedMediaReady(figure, image, source)
      } else {
        failGeneratedMedia(figure, image, alternative)
      }
    }
    normalized += 1
  }
  return normalized
}

export const cleanupGeneratedImageFigures = (root: MediaRoot): number => {
  const figures = generatedManagedFiguresWithin(root)
  for (const figure of figures) removeGeneratedMediaBinding(figure)
  return figures.length
}
