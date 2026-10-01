// Slidev has already normalized these stacks and decided which fonts to load.
// The theme only maps them onto its typography roles.
export const presentationFontVariables = (fonts: Record<string, unknown> = {}) => {
  const variables: Record<string, string> = {}
  for (const role of ['sans', 'serif', 'mono']) {
    const value = fonts[role]
    const families = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
    const stack = families.filter((family): family is string => typeof family === 'string').join(', ')
    if (stack) variables[`--presentation-resolved-${role}`] = stack
  }
  return variables
}
