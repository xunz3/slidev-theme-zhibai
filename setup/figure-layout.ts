export const FIGURE_VARIANTS = Object.freeze([
  'centered',
  'stage',
  'minimal',
  'editorial',
] as const)

export type FigureVariant = typeof FIGURE_VARIANTS[number]

const figureVariantSet = new Set<string>(FIGURE_VARIANTS)

export const normalizeFigureVariant = (
  value: unknown,
  fallback: FigureVariant = 'centered',
): FigureVariant => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  return figureVariantSet.has(normalized)
    ? normalized as FigureVariant
    : fallback
}
