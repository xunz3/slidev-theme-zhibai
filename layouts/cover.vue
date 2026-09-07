<script setup lang="ts">
import Authors from '../components/Authors.vue'
import Figure from '../components/Figure.vue'
import SlideFrame from '../components/SlideFrame.vue'
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import {
  normalizeMediaFit,
  normalizeMediaPosition,
  normalizeMediaSource,
} from '../setup/media'
import type { MediaFit } from '../setup/media'
import type { PresentationChrome } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  background?: string
  chrome?: PresentationChrome | boolean
  image?: string
  imageAlt?: string
  imageFit?: MediaFit
  imagePosition?: string
}>(), {
  chrome: undefined,
  imageFit: 'contain',
})

const { $slidev, $frontmatter } = useSlideContext()

const configs = computed(() => (($slidev.configs ?? {}) as Record<string, unknown>))
// Slidev injects frontmatter as a reactive object, not a Ref.
const frontmatter = computed(() => ($frontmatter as Record<string, unknown>))
const title = computed(() => {
  const value = frontmatter.value.title ?? configs.value.title
  return typeof value === 'string' ? value.trim() : ''
})
// CJK glyphs occupy roughly twice the horizontal space of Latin characters.
const titleLength = computed(() => [...title.value].reduce((length, char) => (
  length + (/[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff]/u.test(char) ? 2 : 1)
), 0))
const subtitle = computed(() => {
  const value = frontmatter.value.subtitle ?? configs.value.subtitle
  return typeof value === 'string' ? value.trim() : ''
})
const image = computed(() => normalizeMediaSource(props.image))
const imageAlt = computed(() => (
  props.imageAlt === undefined ? 'Cover image' : props.imageAlt
))
const imageFit = computed(() => normalizeMediaFit(props.imageFit, 'contain'))
const imagePosition = computed(() => (
  normalizeMediaPosition(props.imagePosition, 'center')
))

const style = computed(() => {
  if (!props.background) return undefined

  return {
    background: `center / cover no-repeat url("${props.background}")`,
  }
})
</script>

<template>
  <SlideFrame
    variant="cover"
    :chrome="chrome"
    :canvas-style="style"
    :artwork="image || background ? 'none' : undefined"
  >
    <div
      class="slide-cover"
      :class="{
        'slide-cover--has-title': title,
        'slide-cover--has-visual': image,
        'slide-cover--long-title': titleLength > 30,
        'slide-cover--dense-title': titleLength > 72,
      }"
    >
      <div class="slide-cover__main">
        <h1 v-if="title" class="slide-cover__title">{{ title }}</h1>
        <div v-if="subtitle" class="slide-cover__subtitle">{{ subtitle }}</div>

        <div class="slide-cover__body">
          <slot />
        </div>
      </div>

      <Figure
        v-if="image"
        class="slide-cover__visual"
        :src="image"
        :alt="imageAlt"
        :fit="imageFit"
        :image-position="imagePosition"
      />

      <Authors variant="cover" />
    </div>
  </SlideFrame>
</template>
