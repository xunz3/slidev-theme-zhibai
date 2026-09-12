<script setup lang="ts">
import { useIsSlideActive, useSlideContext } from '@slidev/client'
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
  artwork?: unknown
  canvasStyle?: CSSProperties
  chrome?: PresentationChrome | boolean
  subtitle?: string
  title?: string
  variant?: FrameVariant
}>(), {
  chrome: undefined,
  variant: 'default',
})

const { $slidev, $frontmatter, $renderContext, $page } = useSlideContext()
const isActive = useIsSlideActive()
// Only the live slide animates. Overview, next-slide previews and exports stay still.
const motionActive = computed(() => isActive.value
  && ['slide', 'presenter'].includes($renderContext.value)
  && !$slidev.nav.isPrintMode)

const configs = computed(() => (($slidev.configs ?? {}) as Record<string, any>))
// Slidev injects frontmatter as a reactive object, not a Ref.
const frontmatter = computed(() => ($frontmatter as Record<string, any>))
const presentationConfig = computed(() => configs.value.themeConfig?.presentation)

const resolved = computed(() => resolvePresentation({
  artwork: props.artwork,
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
  const slideFooter = frontmatter.value.footer
  if (slideFooter === false) return ''
  if (slideFooter != null) return slideFooter

  const deckFooter = configs.value.footer
  if (deckFooter === false) return ''
  return deckFooter ?? configs.value.title ?? ''
})

// Let keyboard readers scroll a focused content region without advancing the deck.
const onContentKeydown = (event: KeyboardEvent) => {
  if (event.target !== event.currentTarget) return
  const content = event.currentTarget as HTMLElement
  if (
    content.scrollHeight > content.clientHeight + 1
    && /auto|scroll/.test(getComputedStyle(content).overflowY)
    && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)
  ) event.stopPropagation()
}

</script>

<template>
  <div
    class="slidev-layout"
    :class="[resolved.variant, { 'slidev-layout--custom-background': canvasStyle?.background }]"
    :data-presentation-preset="resolved.preset"
    :data-presentation-artwork="resolved.artwork.type"
    :data-presentation-artwork-placement="resolved.artwork.placement"
    :data-presentation-cover-align="resolved.variant === 'cover' ? resolved.coverAlign : undefined"
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
      :data-presentation-artwork="resolved.artwork.type"
      :data-presentation-artwork-placement="resolved.artwork.placement"
      :data-presentation-cover-align="resolved.variant === 'cover' ? resolved.coverAlign : undefined"
      :data-presentation-motion="motionActive ? 'active' : undefined"
      :style="frameStyle"
    >
      <PresetBranding
        :artwork="resolved.artwork"
        :cover-align="resolved.coverAlign"
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

      <main
        class="slide-frame__content"
        :tabindex="isActive ? 0 : -1"
        @keydown="onContentKeydown"
      >
        <slot />
      </main>

      <footer v-if="resolved.showChrome" class="slide-frame__footer">
        <div class="slide-frame__footer-left">{{ footerLeft }}</div>
        <div class="slide-frame__footer-middle">{{ footerMiddle }}</div>
        <div v-if="resolved.pageNumber" class="slide-frame__page">
          <span class="slide-frame__page-current">{{ String($page).padStart(2, '0') }}</span>
          <span class="slide-frame__page-divider">/</span>
          <span class="slide-frame__page-total">{{ String($slidev.nav.total).padStart(2, '0') }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>
