<script setup lang="ts">
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import { cloneVNode, computed, h, isVNode, useSlots } from 'vue'
import type { CSSProperties, VNode } from 'vue'
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
  showFooter?: boolean | 'auto'
  variant?: FrameVariant
}>(), {
  chrome: undefined,
  showFooter: undefined,
  variant: 'default',
})

const { $slidev, $frontmatter, $renderContext, $page } = useSlideContext()
const isActive = useIsSlideActive()
const slots = useSlots()
// Only the live slide animates. Overview, next-slide previews and exports stay still.
const motionActive = computed(() => isActive.value
  && ['slide', 'presenter'].includes($renderContext.value)
  && !$slidev.nav.isPrintMode)

const configs = computed(() => (($slidev.configs ?? {}) as Record<string, any>))
// Slidev injects frontmatter as a reactive object, not a Ref.
const frontmatter = computed(() => ($frontmatter as Record<string, any>))
const presentationConfig = computed(() => configs.value.themeConfig?.presentation)

const resolved = computed(() => resolvePresentation({
  chrome: props.chrome,
  showFooter: props.showFooter,
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

const footerLabel = computed(() => {
  const slideFooter = frontmatter.value.footer
  if (slideFooter === false) return ''
  if (slideFooter != null) return String(slideFooter)

  const deckFooter = configs.value.footer
  if (deckFooter === false) return ''
  const value = deckFooter ?? configs.value.title ?? ''
  return typeof value === 'string' ? value.trim() : String(value)
})

const contentKicker = computed(() => {
  if (!['default', 'intro', 'toc', 'center', 'two-cols', 'figure', 'references', 'image-text', 'code'].includes(resolved.value.variant)) return ''
  const value = frontmatter.value.kicker
  return typeof value === 'string' ? value.trim() : ''
})

// Insert into the authored heading's own flow, preserving nested grids, slots,
// and interactive heading VNodes. Layouts without an H1 have no title kicker.
const FrameContent = () => {
  const nodes = slots.default?.({ presentation: resolved.value }) ?? []
  if (!contentKicker.value) return nodes
  let inserted = false
  const visit = (children: unknown[]): unknown[] => children.flatMap(child => {
    if (!isVNode(child)) return [child]
    if (!inserted && child.type === 'h1') {
      inserted = true
      return [h('div', { class: 'slide-frame__kicker' }, contentKicker.value), child]
    }
    if (!inserted && Array.isArray(child.children)) {
      const copy = cloneVNode(child)
      copy.children = visit(child.children) as typeof child.children
      copy.dynamicChildren = null
      copy.patchFlag = 0
      return [copy]
    }
    return [child]
  })
  return visit(nodes) as VNode[]
}

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
    :class="[resolved.variant, { 'slidev-layout--custom-background': canvasStyle?.background || canvasStyle?.backgroundImage }]"
    :data-presentation-preset="resolved.preset"
    :data-presentation-cover-align="resolved.variant === 'cover' ? resolved.coverAlign : undefined"
    :style="outerStyle"
  >
    <div
      class="slide-frame"
      :class="[
        `slide-frame--${resolved.variant}`,
        {
          'slide-frame--chrome': resolved.showFooter,
        },
      ]"
      :data-presentation-preset="resolved.preset"
      :data-presentation-cover-align="resolved.variant === 'cover' ? resolved.coverAlign : undefined"
      :data-presentation-motion="motionActive ? 'active' : undefined"
      :style="frameStyle"
    >
      <PresetBranding
        :preset="resolved.preset"
        :variant="resolved.variant"
      />

      <main
        class="slide-frame__content"
        :tabindex="isActive ? 0 : -1"
        @keydown="onContentKeydown"
      >
        <FrameContent />
      </main>

      <footer
        v-if="resolved.showFooter"
        class="slide-frame__footer"
        :class="{ 'slide-frame__footer--page-only': !footerLabel }"
      >
        <div v-if="footerLabel" class="slide-frame__footer-left">{{ footerLabel }}</div>
        <div v-if="resolved.pageNumber" class="slide-frame__page">
          <span class="slide-frame__page-current">{{ String($page).padStart(2, '0') }}</span>
          <span class="slide-frame__page-divider">/</span>
          <span class="slide-frame__page-total">{{ String($slidev.nav.total).padStart(2, '0') }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>
