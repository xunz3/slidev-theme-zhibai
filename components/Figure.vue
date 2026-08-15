<script setup lang="ts">
import { computed } from 'vue'
import {
  normalizeMediaFit,
  useMediaLoadState,
} from '../setup/media'
import type { MediaFit } from '../setup/media'

const props = defineProps<{
  alt?: string
  caption?: string
  fit?: MediaFit
  src?: string
}>()

const caption = computed(() => (
  typeof props.caption === 'string' ? props.caption.trim() : ''
))
const resolvedFit = computed<MediaFit>(() => (
  normalizeMediaFit(props.fit, 'contain')
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
    class="obsidian-slidev-media obsidian-slidev-media--image"
    data-media-managed="vue"
    :data-media-decorative="alternative.decorative ? 'true' : 'false'"
    :data-media-fit="resolvedFit"
    :data-media-state="loadState"
    :style="{ '--presentation-media-fit': resolvedFit }"
  >
    <div
      class="obsidian-slidev-media__viewport"
      :data-media-fit="resolvedFit"
      data-stability-region="media-viewport"
    >
      <img
        v-if="showImage"
        :key="imageKey"
        class="obsidian-slidev-media__image obsidian-slidev-media__asset"
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
        class="obsidian-slidev-media__fallback"
        role="img"
        :aria-label="alternative.resolvedAlt"
      >
        {{ alternative.resolvedAlt }}
      </div>
    </div>
    <figcaption v-if="caption" class="obsidian-slidev-media__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>
