<script setup lang="ts">
import SlideFrame from '../components/SlideFrame.vue'
import { columnVariables } from '../setup/columns'
import type { PresentationChrome } from '../setup/presentation-config'

withDefaults(defineProps<{
  chrome?: PresentationChrome | boolean
  columnRatio?: number | string
  gap?: string
  reverse?: boolean
}>(), {
  chrome: undefined,
  reverse: false,
})
</script>

<template>
  <SlideFrame variant="two-cols" :chrome="chrome">
    <div
      class="slide-layout-two-cols"
      :class="{ 'slide-layout-two-cols--reverse': reverse }"
      :style="{ ...columnVariables(columnRatio), '--presentation-two-cols-gap': gap }"
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
