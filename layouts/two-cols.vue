<script setup lang="ts">
import SlideFrame from '../components/SlideFrame.vue'
import type { PresentationChrome } from '../setup/presentation-config'

withDefaults(defineProps<{
  title?: string
  subtitle?: string
  chrome?: PresentationChrome | boolean
  gap?: string
  reverse?: boolean
}>(), {
  chrome: undefined,
  reverse: false,
})
</script>

<template>
  <SlideFrame variant="two-cols" :title="title" :subtitle="subtitle" :chrome="chrome">
    <div
      class="slide-layout-two-cols"
      :class="{ 'slide-layout-two-cols--reverse': reverse }"
      :style="{ '--presentation-two-cols-gap': gap }"
    >
      <div class="slide-layout-two-cols__pane">
        <slot />
      </div>
      <div class="slide-layout-two-cols__pane">
        <slot name="right" />
      </div>
    </div>
  </SlideFrame>
</template>
