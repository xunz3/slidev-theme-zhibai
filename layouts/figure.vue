<script setup lang="ts">
import { computed } from 'vue'
import SlideFrame from '../components/SlideFrame.vue'
import { normalizeFigureVariant } from '../setup/figure-layout'
import type { FigureVariant } from '../setup/figure-layout'
import type { PresentationChrome } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  chrome?: PresentationChrome | boolean
  figureVariant?: FigureVariant
}>(), {
  chrome: undefined,
  figureVariant: 'centered',
})

const resolvedFigureVariant = computed(() => (
  normalizeFigureVariant(props.figureVariant)
))
</script>

<template>
  <SlideFrame variant="figure" :title="title" :subtitle="subtitle" :chrome="chrome">
    <div
      class="slide-layout-figure"
      :class="`slide-layout-figure--${resolvedFigureVariant}`"
      :data-figure-variant="resolvedFigureVariant"
    >
      <slot />
    </div>
  </SlideFrame>
</template>
