<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { formatAuthorNames, resolveDeckAuthors } from '../setup/authors'
import {
  resolvePresentation,
} from '../setup/presentation-config'
import type {
  FrameVariant,
  PresentationChrome,
} from '../setup/presentation-config'
import PresetBranding from '../internals/PresetBranding.vue'

const props = withDefaults(defineProps<{
  canvasStyle?: CSSProperties
  chrome?: PresentationChrome | boolean
  subtitle?: string
  title?: string
  variant?: FrameVariant
}>(), {
  chrome: undefined,
  variant: 'default',
})

const { $slidev, $frontmatter } = useSlideContext()

const configs = computed(() => (($slidev.configs ?? {}) as Record<string, any>))
// Slidev injects frontmatter as a reactive object, not a Ref.
const frontmatter = computed(() => ($frontmatter as Record<string, any>))
const presentationConfig = computed(() => configs.value.themeConfig?.presentation)

const resolved = computed(() => resolvePresentation({
  chrome: props.chrome,
  deck: presentationConfig.value,
  slide: frontmatter.value,
  variant: props.variant,
}))

const outerStyle = computed<CSSProperties | undefined>(() => {
  const style: CSSProperties = { ...(props.canvasStyle ?? {}) }
  return Object.keys(style).length > 0 ? style : undefined
})

const frameStyle = computed<CSSProperties | undefined>(() => {
  const style: CSSProperties = {}
  if (resolved.value.accent) {
    style['--presentation-accent'] = resolved.value.accent
    style['--slidev-theme-primary'] = resolved.value.accent
  }
  return Object.keys(style).length > 0 ? style : undefined
})

const headerTitle = computed(() => {
  const value = frontmatter.value.title ?? props.title
  return typeof value === 'string' ? value.trim() : ''
})

const headerSubtitle = computed(() => {
  const value = frontmatter.value.subtitle ?? props.subtitle
  return typeof value === 'string' ? value.trim() : ''
})

const footerLeft = computed(() => {
  if (!resolved.value.footerAuthors) return ''

  return formatAuthorNames(resolveDeckAuthors(configs.value))
})

const footerMiddle = computed(() => {
  return frontmatter.value.footer
    ?? configs.value.footer
    ?? configs.value.title
    ?? ''
})

</script>

<template>
  <div
    class="slidev-layout"
    :class="resolved.variant"
    :data-presentation-preset="resolved.preset"
    :data-presentation-density="resolved.density"
    :style="outerStyle"
  >
    <div
      class="slide-frame"
      :class="[
        `slide-frame--${resolved.variant}`,
        {
          'slide-frame--chrome': resolved.showChrome,
          'slide-frame--header': resolved.showHeader,
        },
      ]"
      :data-presentation-preset="resolved.preset"
      :data-presentation-density="resolved.density"
      :style="frameStyle"
    >
      <PresetBranding
        :preset="resolved.preset"
        :show-header="resolved.showHeader"
        :variant="resolved.variant"
      />

      <header v-if="resolved.showHeader" class="slide-frame__header">
        <div class="slide-frame__header-main">
          <div v-if="headerTitle" class="slide-frame__title">{{ headerTitle }}</div>
          <div v-if="headerSubtitle" class="slide-frame__subtitle">{{ headerSubtitle }}</div>
        </div>
      </header>

      <main class="slide-frame__content">
        <slot />
      </main>

      <footer v-if="resolved.showChrome" class="slide-frame__footer">
        <div class="slide-frame__footer-left">{{ footerLeft }}</div>
        <div class="slide-frame__footer-middle">{{ footerMiddle }}</div>
        <div v-if="resolved.pageNumber" class="slide-frame__page">
          {{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}
        </div>
      </footer>
    </div>
  </div>
</template>
