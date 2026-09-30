export const CALLOUT_TYPES = Object.freeze([
  'note',
  'info',
  'todo',
  'abstract',
  'summary',
  'tip',
  'success',
  'check',
  'warning',
  'caution',
  'attention',
  'danger',
  'error',
  'failure',
  'question',
  'help',
  'faq',
  'quote',
  'cite',
] as const)

export type CalloutType = typeof CALLOUT_TYPES[number]
export const SEMANTIC_FAMILIES = Object.freeze([
  'neutral',
  'info',
  'positive',
  'caution',
  'danger',
  'question',
  'quotation',
] as const)

export type SemanticFamily = typeof SEMANTIC_FAMILIES[number]
export type CalloutFamily = SemanticFamily

export const CALLOUT_DEFAULT_TITLES: Readonly<Record<CalloutType, string>> = Object.freeze({
  abstract: 'Abstract',
  attention: 'Attention',
  caution: 'Caution',
  check: 'Check',
  cite: 'Citation',
  danger: 'Danger',
  error: 'Error',
  failure: 'Failure',
  faq: 'FAQ',
  help: 'Help',
  info: 'Info',
  note: 'Note',
  question: 'Question',
  quote: 'Quote',
  success: 'Success',
  summary: 'Summary',
  tip: 'Tip',
  todo: 'To do',
  warning: 'Warning',
})

export const CALLOUT_SEMANTIC_FAMILIES: Readonly<Record<CalloutType, CalloutFamily>> = Object.freeze({
  abstract: 'info',
  attention: 'caution',
  caution: 'caution',
  check: 'positive',
  cite: 'quotation',
  danger: 'danger',
  error: 'danger',
  failure: 'danger',
  faq: 'question',
  help: 'question',
  info: 'info',
  note: 'info',
  question: 'question',
  quote: 'quotation',
  success: 'positive',
  summary: 'info',
  tip: 'positive',
  todo: 'info',
  warning: 'caution',
})

const supportedTypes = new Set<string>(CALLOUT_TYPES)
const supportedFamilies = new Set<string>(SEMANTIC_FAMILIES)

export const normalizeSemanticFamily = (
  value: unknown,
  fallback: SemanticFamily = 'neutral',
): SemanticFamily => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  return supportedFamilies.has(normalized)
    ? normalized as SemanticFamily
    : fallback
}

export const normalizeCalloutType = (value: unknown): CalloutType | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return supportedTypes.has(normalized) ? normalized as CalloutType : null
}

export const calloutFamily = (type: CalloutType | null): CalloutFamily => (
  type ? CALLOUT_SEMANTIC_FAMILIES[type] : 'neutral'
)

export const defaultCalloutTitle = (type: CalloutType | null): string => (
  type ? CALLOUT_DEFAULT_TITLES[type] : 'Callout'
)

export const resolveCallout = (
  rawType: unknown,
  rawTitle: unknown,
) => {
  const type = normalizeCalloutType(rawType)
  const authoredTitle = typeof rawTitle === 'string' ? rawTitle.trim() : ''
  return Object.freeze({
    family: calloutFamily(type),
    title: authoredTitle || defaultCalloutTitle(type),
    type,
  })
}
