<script setup lang="ts">
import { slides } from '#slidev/slides'
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import SlideFrame from '../components/SlideFrame.vue'
import type { PresentationChrome } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  kicker?: string | false
  chrome?: PresentationChrome | boolean
}>(), {
  chrome: undefined,
  kicker: undefined,
})

const { $page, $frontmatter } = useSlideContext()

const frontmatter = computed(() => ($frontmatter as Record<string, unknown>))

// Section dividers are numbered in deck order, matching the toc layout's index.
const sectionIndex = computed(() => {
  const all = slides.value ?? []
  const currentPage = $page.value
  let index = 0
  for (let page = 1; page <= Math.min(currentPage, all.length); page++) {
    const slide = all[page - 1]?.meta?.slide?.frontmatter as Record<string, unknown> | undefined
    if (slide?.layout === 'section') index++
  }
  return index
})

const kickerText = computed(() => {
  const value = frontmatter.value.kicker ?? props.kicker
  if (value === false) return ''
  if (typeof value === 'string' && value.trim()) return value.trim()
  return sectionIndex.value > 0 ? `Section ${String(sectionIndex.value).padStart(2, '0')}` : ''
})
</script>

<template>
  <SlideFrame variant="section" :title="title" :subtitle="subtitle" :chrome="chrome">
    <div class="slide-layout-section">
      <div v-if="kickerText" class="slide-layout-section__kicker">{{ kickerText }}</div>
      <slot />
    </div>
  </SlideFrame>
</template>
