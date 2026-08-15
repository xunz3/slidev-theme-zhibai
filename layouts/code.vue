<script setup lang="ts">
import { useAttrs } from 'vue'
import SlideFrame from '../components/SlideFrame.vue'
import type { PresentationChrome } from '../setup/presentation-config'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  chrome?: PresentationChrome | boolean
  subtitle?: string
  title?: string
}>(), {
  chrome: undefined,
})

const attrs = useAttrs()
</script>

<template>
  <SlideFrame
    v-bind="attrs"
    :chrome="props.chrome"
    :subtitle="props.subtitle"
    :title="props.title"
    variant="code"
  >
    <div class="presentation-code-layout">
      <div class="presentation-code-layout__content">
        <slot />
      </div>
    </div>
  </SlideFrame>
</template>
