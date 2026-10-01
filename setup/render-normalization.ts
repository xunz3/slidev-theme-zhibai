import { normalizePresentationTaskLists } from './task-lists'

export type PresentationRenderRoot = Document | Element
export type PresentationNormalizer = (
  root: PresentationRenderRoot,
) => number | void

const normalizers: readonly PresentationNormalizer[] = Object.freeze([
  normalizePresentationTaskLists,
  normalizeBilingualHeadings,
])

const BILINGUAL_HEADING_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
].map(selector => `.slidev-layout ${selector}`).join(', ')

const textNodesWithin = (element: Element): Text[] => {
  const nodes: Text[] = []
  const walker = element.ownerDocument.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
  )
  let node = walker.nextNode()
  while (node) {
    if (node instanceof Text) nodes.push(node)
    node = walker.nextNode()
  }
  return nodes
}

const normalizeBilingualHeading = (heading: Element): number => {
  const textNodes = textNodesWithin(heading)
  let normalized = 0
  let previous: Text | undefined

  for (const node of textNodes) {
    const original = node.data
    let value = original.replace(/ \u00b7(?= )/g, '\u00a0\u00b7')
    if (
      value.startsWith('\u00b7 ')
      && previous?.data.endsWith(' ')
    ) {
      previous.data = `${previous.data.slice(0, -1)}\u00a0`
      normalized += 1
    }
    if (value !== original) {
      node.data = value
      normalized += 1
    }
    previous = node
  }
  return normalized
}

export function normalizeBilingualHeadings(
  root: PresentationRenderRoot,
): number {
  const headings = new Set<Element>()
  if (root instanceof Element && root.matches(BILINGUAL_HEADING_SELECTOR)) {
    headings.add(root)
  }
  if (root instanceof Element) {
    const ancestor = root.closest(BILINGUAL_HEADING_SELECTOR)
    if (ancestor) headings.add(ancestor)
  }
  for (const heading of root.querySelectorAll(BILINGUAL_HEADING_SELECTOR)) {
    headings.add(heading)
  }

  let normalized = 0
  for (const heading of headings) {
    normalized += normalizeBilingualHeading(heading)
  }
  return normalized
}

export const normalizePresentationSubtree = (
  root?: PresentationRenderRoot,
  additional: readonly PresentationNormalizer[] = [],
): number => {
  if (typeof document === 'undefined') return 0
  const scope = root ?? document
  let normalized = 0
  for (const normalizer of [...normalizers, ...additional]) {
    const result = normalizer(scope)
    if (typeof result === 'number') normalized += result
  }
  return normalized
}

export const observePresentationRendering = (
  root?: PresentationRenderRoot,
  additional: readonly PresentationNormalizer[] = [],
): (() => void) => {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }

  const scope = root ?? document
  normalizePresentationSubtree(scope, additional)
  const target = scope instanceof Document ? scope.documentElement : scope
  if (!target) return () => {}

  const observer = new MutationObserver((records) => {
    const roots = new Set<Element>()
    for (const record of records) {
      if (record.type === 'attributes' && record.target instanceof Element) {
        roots.add(record.target)
      }
      if (record.type === 'characterData') {
        const parent = record.target.parentElement
        if (parent) roots.add(parent)
      }
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          roots.add(node)
        } else if (node instanceof Text && node.parentElement) {
          roots.add(node.parentElement)
        }
      }
    }
    for (const addedRoot of roots) normalizePresentationSubtree(addedRoot, additional)
  })
  observer.observe(target, {
    attributeFilter: ['class'],
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  })
  return () => {
    observer.disconnect()
  }
}
