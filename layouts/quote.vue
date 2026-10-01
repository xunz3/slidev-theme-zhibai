<script setup lang="ts">
import SlideFrame from '../components/SlideFrame.vue'
import type { PresentationChrome } from '../setup/presentation-config'

withDefaults(defineProps<{
  author?: string
  source?: string
  chrome?: PresentationChrome | boolean
}>(), {
  chrome: undefined,
})
</script>

<template>
  <SlideFrame variant="quote" :chrome="chrome">
    <figure class="slide-layout-quote">
      <div class="slide-layout-quote__content">
        <slot />
      </div>
      <figcaption v-if="author || source" class="slide-layout-quote__meta">
        <cite v-if="author" class="slide-layout-quote__author">{{ author }}</cite>
        <span v-if="source" class="slide-layout-quote__source">{{ source }}</span>
      </figcaption>
    </figure>
  </SlideFrame>
</template>
