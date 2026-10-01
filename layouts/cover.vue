<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import { cloneVNode, computed, h, isVNode, useSlots } from 'vue'
import type { VNode } from 'vue'
import Authors from '../components/Authors.vue'
import Figure from '../components/Figure.vue'
import SlideFrame from '../components/SlideFrame.vue'
import Seal from '../components/Seal.vue'
import {
  normalizeMediaFit,
  normalizeMediaPosition,
  normalizeMediaSource,
} from '../setup/media'
import { resolveDeckAuthors } from '../setup/authors'
import type { MediaFit } from '../setup/media'
import type { PresentationChrome } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  background?: string
  chrome?: PresentationChrome | boolean
  date?: string
  eyebrow?: string
  image?: string
  imageAlt?: string
  imageFit?: MediaFit
  imagePosition?: string
}>(), {
  chrome: undefined,
  imageFit: 'contain',
})

const { $slidev, $frontmatter } = useSlideContext()
const slots = useSlots()

const configs = computed(() => (($slidev.configs ?? {}) as Record<string, unknown>))
// Slidev injects frontmatter as a reactive object, not a Ref.
const frontmatter = computed(() => ($frontmatter as Record<string, unknown>))
const title = computed(() => {
  const value = frontmatter.value.title ?? configs.value.title
  return typeof value === 'string' ? value.trim() : ''
})

const vnodeText = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(vnodeText).join('')
  if (!isVNode(value)) return ''
  return vnodeText(value.children)
}

const firstSlotHeading = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const heading = firstSlotHeading(child)
      if (heading !== undefined) return heading
    }
    return undefined
  }
  if (!isVNode(value)) return undefined
  if (value.type === 'h1') return vnodeText(value.children).trim()
  return firstSlotHeading(value.children)
}


const subtitle = computed(() => {
  const value = frontmatter.value.subtitle ?? configs.value.subtitle
  return typeof value === 'string' ? value.trim() : ''
})
const eyebrow = computed(() => {
  const value = frontmatter.value.eyebrow ?? props.eyebrow
  return typeof value === 'string' ? value.trim() : ''
})
const date = computed(() => {
  const value = frontmatter.value.date ?? props.date
  return typeof value === 'string' ? value.trim() : ''
})
const image = computed(() => normalizeMediaSource(props.image))
const imageAlt = computed(() => (
  props.imageAlt === undefined ? 'Cover image' : props.imageAlt
))
const imageFit = computed(() => normalizeMediaFit(props.imageFit, 'contain'))
const imagePosition = computed(() => (
  normalizeMediaPosition(props.imagePosition, 'center')
))
const hasVisualSlot = computed(() => Boolean(slots.visual))
const hasVisual = computed(() => hasVisualSlot.value || Boolean(image.value))
const authors = computed(() => resolveDeckAuthors(configs.value))
const hasAuthors = computed(() => authors.value.length > 0)

const escapeCssString = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\0/g, '\ufffd')
  .replace(/[\n\r\f]/g, character => `\\${character.charCodeAt(0).toString(16)} `)

const background = computed(() => normalizeMediaSource(props.background))
const style = computed(() => {
  if (!background.value) return undefined
  return {
    backgroundImage: `url("${escapeCssString(background.value)}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  }
})
// Invoke the authored slot once inside render so reactive Markdown/components
// stay tracked. Keep the original H1 VNode (including emphasis and v-click),
// and insert its subtitle after it in both visual and accessible reading order.
const withHeadingSubtitle = (nodes: VNode[], subtitleNode: VNode): VNode[] => {
  let inserted = false
  const visit = (children: unknown[]): unknown[] => children.flatMap(child => {
    if (!isVNode(child)) return [child]
    if (!inserted && child.type === 'h1') {
      inserted = true
      return [child, subtitleNode]
    }
    if (!inserted && Array.isArray(child.children)) {
      const copy = cloneVNode(child)
      copy.children = visit(child.children) as typeof child.children
      // Its child list changed, so compiler block hints no longer describe it.
      copy.dynamicChildren = null
      copy.patchFlag = 0
      return [copy]
    }
    return [child]
  })
  return visit(nodes) as VNode[]
}

const CoverComposition = ({ seal }: { seal: string | false | null }) => {
  const authored = slots.default?.() ?? []
  const markdownHeading = firstSlotHeading(authored)
  const displayTitle = markdownHeading ? '' : title.value
  // CJK glyphs occupy roughly twice the horizontal space of Latin characters.
  const titleLength = [...(markdownHeading || title.value)].reduce((length, char) => (
    length + (/[⺀-鿿가-힯豈-﫿]/u.test(char) ? 2 : 1)
  ), 0)
  const subtitleNode = subtitle.value
    ? h('div', { class: 'slide-cover__subtitle' }, subtitle.value)
    : null
  const body = markdownHeading && subtitleNode
    ? withHeadingSubtitle(authored, subtitleNode)
    : authored

  return h('div', {
    class: ['slide-cover', {
      'slide-cover--has-title': Boolean(displayTitle),
      'slide-cover--has-visual': hasVisual.value,
      'slide-cover--long-title': titleLength > 30,
      'slide-cover--dense-title': titleLength > 72,
      'slide-cover--collaboration': authors.value.length > 1,
      'slide-cover--many-authors': authors.value.length > 3,
    }],
  }, [
    h('div', { class: 'slide-cover__main' }, [
      eyebrow.value ? h('div', { class: 'slide-cover__eyebrow' }, eyebrow.value) : null,
      displayTitle ? h('h1', { class: 'slide-cover__title' }, displayTitle) : null,
      markdownHeading ? null : subtitleNode,
      h('div', { class: 'slide-cover__body' }, body),
    ]),
    hasVisual.value ? h('div', { class: 'slide-cover__visual' },
      hasVisualSlot.value ? slots.visual?.() : [h(Figure, {
        src: image.value,
        alt: imageAlt.value,
        fit: imageFit.value,
        imagePosition: imagePosition.value,
      })],
    ) : null,
    (date.value || hasAuthors.value || seal) ? h('div', {
      class: ['slide-cover__meta', { 'slide-cover__meta--collaboration': authors.value.length > 1 }],
    }, [
      hasAuthors.value ? h(Authors, { variant: 'cover' }) : null,
      date.value ? h('span', { class: 'slide-cover__date' }, date.value) : null,
      seal ? h(Seal, { text: seal }) : null,
    ]) : null,
  ])
}
</script>

<template>
  <SlideFrame v-slot="{ presentation }" variant="cover" :chrome="chrome" :canvas-style="style">
    <CoverComposition :seal="presentation.seal" />
  </SlideFrame>
</template>
