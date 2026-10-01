<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { CSSProperties } from 'vue'
import Figure from '../components/Figure.vue'
import SlideFrame from '../components/SlideFrame.vue'
import {
  isMediaFit,
  normalizeImageTextMediaRatio,
  normalizeMediaBackgroundSize,
  normalizeMediaFit,
  normalizeMediaPosition,
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
  imagePosition?: string
  mediaRatio?: number | string
  orientation: 'left' | 'right'
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
const imagePosition = computed(() => (
  normalizeMediaPosition(props.imagePosition, 'center')
))
const mediaRatio = computed(() => normalizeImageTextMediaRatio(props.mediaRatio))
const customBackgroundSize = computed(() => (
  isMediaFit(backgroundSize.value) ? undefined : backgroundSize.value
))
const mediaStyle = computed<CSSProperties | undefined>(() => {
  const style: CSSProperties = {
    '--presentation-media-position': imagePosition.value,
  }
  if (!customBackgroundSize.value || !image.value) return style
  return {
    ...style,
    '--presentation-media-background-image': `url(${JSON.stringify(image.value)})`,
    '--presentation-media-background-size': customBackgroundSize.value,
  }
})
const layoutStyle = computed<CSSProperties>(() => ({
  '--presentation-image-text-media-track': `minmax(0, ${mediaRatio.value}fr)`,
  '--presentation-image-text-narrative-track': `minmax(0, ${100 - mediaRatio.value}fr)`,
}))
</script>

<template>
  <SlideFrame
    v-bind="attrs"
    :chrome="props.chrome"
    variant="image-text"
  >
    <div
      class="presentation-image-text"
      :class="[
        `presentation-image-text--${props.orientation}`,
        { 'presentation-image-text--narrative-only': !image },
      ]"
      :data-background-size="backgroundSize"
      :data-media-position="imagePosition"
      :data-media-ratio="mediaRatio"
      :data-orientation="props.orientation"
      :style="layoutStyle"
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
        :image-position="imagePosition"
        :data-media-rendering="customBackgroundSize ? 'background' : 'image'"
        :style="mediaStyle"
      />
    </div>
  </SlideFrame>
</template>
