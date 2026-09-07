<script setup lang="ts">
import { slides } from '#slidev/slides'
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import type { SlideRoute } from '@slidev/types'
import SlideFrame from '../components/SlideFrame.vue'
import type { PresentationChrome } from '../setup/presentation-config'

type TocSectionInput = string | { title?: string; subtitle?: string; slideNo?: number }

const props = withDefaults(defineProps<{
  title?: string | false
  subtitle?: string
  sections?: TocSectionInput[]
  showNumbers?: boolean
  chrome?: PresentationChrome | boolean
}>(), {
  chrome: undefined,
  showNumbers: true,
})

const { $slidev, $frontmatter } = useSlideContext()

const frontmatter = computed(() => (
  $frontmatter as Record<string, unknown>
))

const getFrontmatter = (slide: SlideRoute): Record<string, unknown> => {
  return slide.meta.slide.frontmatter
}

const getContent = (slide: SlideRoute): string => {
  return slide.meta.slide.content
}

const getTitle = (slide: SlideRoute, fallback: string): string => {
  const frontmatter = getFrontmatter(slide)
  const title = slide.meta.slide.title ?? frontmatter.title
  if (typeof title === 'string' && title.trim()) return title.trim()

  const match = getContent(slide).match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() || fallback
}

const tocTitle = computed(() => {
  const value = frontmatter.value.title
  if (value === false) return ''
  if (typeof value === 'string' && value.trim()) return value.trim()
  return typeof props.title === 'string' && props.title.trim() ? props.title.trim() : 'Outline'
})

const tocSections = computed(() => {
  if (props.sections?.length) {
    return props.sections.map((section, index) => {
      if (typeof section === 'string') return { title: section, subtitle: '', slideNo: undefined, index: index + 1 }

      return {
        title: section.title || `Section ${index + 1}`,
        subtitle: section.subtitle || '',
        slideNo: section.slideNo,
        index: index + 1,
      }
    })
  }

  return slides.value
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => getFrontmatter(slide).layout === 'section')
    .map(({ slide, index }, sectionIndex) => {
      const frontmatter = getFrontmatter(slide)

      return {
        title: getTitle(slide, `Section ${sectionIndex + 1}`),
        subtitle: typeof frontmatter.subtitle === 'string' ? frontmatter.subtitle : '',
        slideNo: index + 1,
        index: sectionIndex + 1,
      }
    })
})

const goToSection = (slideNo?: number) => {
  if (slideNo) $slidev.nav.go(slideNo)
}
</script>

<template>
  <SlideFrame variant="toc" :title="typeof title === 'string' ? title : undefined" :subtitle="subtitle" :chrome="chrome">
    <div class="slide-layout-toc">
      <h1 v-if="tocTitle">{{ tocTitle }}</h1>

      <div class="slide-layout-toc__list" role="list">
        <div v-for="section in tocSections" :key="`${section.index}-${section.title}`" class="slide-layout-toc__item" role="listitem">
          <component
            :is="section.slideNo ? 'button' : 'div'"
            class="slide-layout-toc__button"
            :class="{
              'slide-layout-toc__button--static': !section.slideNo,
              'slide-layout-toc__button--unnumbered': !showNumbers,
            }"
            :type="section.slideNo ? 'button' : undefined"
            @click="section.slideNo && goToSection(section.slideNo)"
          >
            <span v-if="showNumbers" class="slide-layout-toc__number">{{ String(section.index).padStart(2, '0') }}</span>
            <span class="slide-layout-toc__text">
              <span class="slide-layout-toc__title">{{ section.title }}</span>
              <span v-if="section.subtitle" class="slide-layout-toc__subtitle">{{ section.subtitle }}</span>
            </span>
          </component>
        </div>
      </div>

      <div class="slide-layout-toc__extra">
        <slot />
      </div>
    </div>
  </SlideFrame>
</template>
