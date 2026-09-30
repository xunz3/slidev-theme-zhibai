<script setup lang="ts">
import { defineComponent, h, isVNode } from 'vue'
import type { VNode } from 'vue'
import SlideFrame from '../components/SlideFrame.vue'
import type { PresentationChrome } from '../setup/presentation-config'

withDefaults(defineProps<{
  title?: string
  subtitle?: string
  chrome?: PresentationChrome | boolean
}>(), {
  chrome: undefined,
})

const vnodeText = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(vnodeText).join('')
  if (!isVNode(value)) return ''
  return vnodeText(value.children)
}

const firstHeadingText = (nodes: VNode[]): string => {
  for (const node of nodes) {
    if (!isVNode(node)) continue
    if (node.type === 'h1') return vnodeText(node.children).trim()
    if (Array.isArray(node.children)) {
      const nested = firstHeadingText(node.children as VNode[])
      if (nested) return nested
    }
  }
  return ''
}

// Read slot VNodes during render so reactive Markdown content updates sizing.
const StatementComposition = defineComponent({
  name: 'StatementComposition',
  setup(_, { slots }) {
    return () => {
      const nodes = slots.default?.() ?? []
      const text = firstHeadingText(nodes)
        || nodes.map(vnodeText).join('').trim()
      const length = [...text].reduce((count, character) => (
        count + (/[⺀-鿿가-힯豈-﫿]/u.test(character) ? 2 : 1)
      ), 0)

      return h('div', {
        class: ['slide-layout-statement', {
          'slide-layout-statement--long': length > 28,
          'slide-layout-statement--dense': length > 60,
        }],
      }, nodes)
    }
  },
})
</script>

<template>
  <SlideFrame variant="statement" :title="title" :subtitle="subtitle" :chrome="chrome">
    <StatementComposition>
      <slot />
    </StatementComposition>
  </SlideFrame>
</template>
