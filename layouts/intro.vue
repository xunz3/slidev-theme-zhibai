<script setup lang="ts">
import SlideFrame from '../components/SlideFrame.vue'
import { computed } from 'vue'
import type { PresentationChrome } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  background?: string
  chrome?: PresentationChrome | boolean
}>(), {
  chrome: undefined,
})

const style = computed(() => {
  if (!props.background) return undefined

  return {
    backgroundImage: `url(${JSON.stringify(props.background)})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  }
})
</script>

<template>
  <SlideFrame
    variant="intro"
    :chrome="chrome"
    :canvas-style="style"
  >
    <slot />
  </SlideFrame>
</template>
