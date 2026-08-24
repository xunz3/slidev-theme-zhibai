<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { CSSProperties } from 'vue'
import Figure from '../components/Figure.vue'
import SlideFrame from '../components/SlideFrame.vue'
import {
  isMediaFit,
  normalizeMediaBackgroundSize,
  normalizeMediaFit,
  normalizeMediaSource,
} from '../setup/media'
import type { PresentationChrome } from '../setup/presentation-config'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  backgroundSize?: string
  caption?: string
  chrome?: PresentationChrome | boolean
  image?: string
  imageAlt?: string
  orientation: 'left' | 'right'
  subtitle?: string
  title?: string
}>(), {
  backgroundSize: 'contain',
  chrome: undefined,
})

const attrs = useAttrs()
const image = computed(() => normalizeMediaSource(props.image))
const backgroundSize = computed(() => (
  normalizeMediaBackgroundSize(props.backgroundSize, 'contain')
))
const fit = computed(() => normalizeMediaFit(backgroundSize.value, 'contain'))
const customBackgroundSize = computed(() => (
  isMediaFit(backgroundSize.value) ? undefined : backgroundSize.value
))
const mediaStyle = computed<CSSProperties | undefined>(() => {
  if (!customBackgroundSize.value || !image.value) return undefined
  return {
    '--presentation-media-background-image': `url(${JSON.stringify(image.value)})`,
    '--presentation-media-background-size': customBackgroundSize.value,
  }
})
</script>

<template>
  <SlideFrame
    v-bind="attrs"
    :chrome="props.chrome"
    :subtitle="props.subtitle"
    :title="props.title"
    variant="image-text"
  >
    <div
      class="presentation-image-text"
      :class="[
        `presentation-image-text--${props.orientation}`,
        { 'presentation-image-text--narrative-only': !image },
      ]"
      :data-background-size="backgroundSize"
      :data-orientation="props.orientation"
    >
      <div class="presentation-image-text__narrative">
        <slot />
      </div>
      <Figure
        v-if="image"
        class="presentation-image-text__figure"
        :src="image"
        :alt="props.imageAlt"
        :caption="props.caption"
        :fit="fit"
        :data-media-rendering="customBackgroundSize ? 'background' : 'image'"
        :style="mediaStyle"
      />
    </div>
  </SlideFrame>
</template>
