<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import {
  normalizeMediaFit,
  normalizeMediaPosition,
  useMediaLoadState,
} from '../setup/media'
import { normalizeFigureVariant } from '../setup/figure-layout'
import type { FigureVariant } from '../setup/figure-layout'
import type { MediaFit } from '../setup/media'

const props = defineProps<{
  alt?: string
  caption?: string
  fit?: MediaFit
  imagePosition?: string
  src?: string
  treatment?: 'plain' | 'framed' | 'bleed'
  variant?: FigureVariant
}>()

const attrs = useAttrs()
const caption = computed(() => (
  typeof props.caption === 'string' ? props.caption.trim() : ''
))
const hasCustomCaptionNumber = computed(() => {
  if (/^(?:fig(?:ure)?\.?\s*[a-z]?\d+|图\s*\d+)(?:[\s.:：—–-]|$)/iu.test(caption.value)) return true
  const value = attrs.class
  if (typeof value === 'string') return value.split(/\s+/).includes('presentation-media--caption-custom-number')
  if (Array.isArray(value)) return value.includes('presentation-media--caption-custom-number')
  if (value && typeof value === 'object') return Boolean((value as Record<string, unknown>)['presentation-media--caption-custom-number'])
  return false
})
const resolvedFit = computed<MediaFit>(() => (
  normalizeMediaFit(props.fit, props.treatment === 'bleed' ? 'cover' : 'contain')
))
const resolvedPosition = computed(() => (
  normalizeMediaPosition(props.imagePosition, 'center')
))
const resolvedVariant = computed<FigureVariant | undefined>(() => (
  props.variant === undefined
    ? undefined
    : normalizeFigureVariant(props.variant)
))
const resolvedTreatment = computed(() => (
  props.treatment === 'framed' || props.treatment === 'bleed'
    ? props.treatment
    : 'plain'
))
const {
  alternative,
  imageKey,
  loadState,
  onError,
  onLoad,
  retry,
  showFallback,
  showImage,
  source,
} = useMediaLoadState({
  alt: () => props.alt,
  fallback: () => caption.value || 'Figure',
  source: () => props.src,
})

defineExpose({ retry })
</script>

<template>
  <figure
    class="presentation-media presentation-media--image"
    :class="[
      `presentation-media--treatment-${resolvedTreatment}`,
      resolvedVariant ? `presentation-media--figure-${resolvedVariant}` : undefined,
    ]"
    :data-figure-variant="resolvedVariant"
    :data-media-treatment="resolvedTreatment"
    :data-caption-numbered="caption ? (hasCustomCaptionNumber ? 'custom' : 'auto') : undefined"
    data-media-managed="vue"
    :data-media-decorative="alternative.decorative ? 'true' : 'false'"
    :data-media-fit="resolvedFit"
    :data-media-position="resolvedPosition"
    :data-media-state="loadState"
    :style="{ '--presentation-media-position': resolvedPosition }"
  >
    <div
      class="presentation-media__viewport"
      :data-media-fit="resolvedFit"
      :data-media-position="resolvedPosition"
      data-stability-region="media-viewport"
    >
      <img
        v-if="showImage"
        :key="imageKey"
        class="presentation-media__image presentation-media__asset"
        :src="source"
        :alt="alternative.resolvedAlt"
        :aria-hidden="alternative.decorative ? 'true' : undefined"
        decoding="async"
        loading="eager"
        @load="onLoad"
        @error="onError"
      >
      <div
        v-else-if="showFallback"
        class="presentation-media__fallback"
        role="img"
        :aria-label="alternative.resolvedAlt"
      >
        {{ alternative.resolvedAlt }}
      </div>
    </div>
    <figcaption v-if="caption" class="presentation-media__caption">
      <span
        v-if="!hasCustomCaptionNumber"
        class="presentation-media__caption-prefix"
        aria-hidden="true"
      />
      <span class="presentation-media__caption-text">{{ caption }}</span>
    </figcaption>
  </figure>
</template>
