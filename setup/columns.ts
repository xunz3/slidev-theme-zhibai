export const normalizeColumnRatio = (value: unknown): number => {
  const ratio = typeof value === 'number' ? value
    : typeof value === 'string' && value.trim() ? Number(value) : NaN
  return Number.isFinite(ratio) && ratio >= 0.2 && ratio <= 0.8 ? ratio : 0.5
}

export const columnVariables = (value: unknown) => {
  const ratio = normalizeColumnRatio(value)
  return {
    '--presentation-two-cols-left': `minmax(0, ${ratio}fr)`,
    '--presentation-two-cols-right': `minmax(0, ${1 - ratio}fr)`,
  }
}
