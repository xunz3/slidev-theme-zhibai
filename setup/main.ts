import { configs } from '@slidev/client'
import { slides } from '#slidev/slides'
import { defineAppSetup } from '@slidev/types'
import { watch } from 'vue'
import { resolveDeckPresentation } from './presentation-config'
import { observePresentationRendering } from './render-normalization'
import { normalizeNativeLayouts } from './native-layouts'
import { presentationFontVariables } from './fonts'

const getRawPresentationConfig = (): unknown => {
  return (configs as any)?.themeConfig?.presentation
}

export const applyPresentationConfig = (rawPresentation = getRawPresentationConfig()) => {
  if (typeof document === 'undefined') return

  const accent = resolveDeckPresentation(rawPresentation).accent
  const root = document.documentElement

  const variables = presentationFontVariables((configs as any)?.fonts)
  for (const role of ['sans', 'serif', 'mono']) {
    const key = `--presentation-resolved-${role}`
    if (variables[key]) root.style.setProperty(key, variables[key])
    else root.style.removeProperty(key)
  }

  if (accent) {
    root.style.setProperty('--slidev-theme-primary', accent)
  } else {
    root.style.removeProperty('--slidev-theme-primary')
  }
}

export default defineAppSetup(({ app }) => {
  applyPresentationConfig()
  const normalizeNative = (root: Document | Element) => normalizeNativeLayouts(root, {
    deck: configs as any,
    frontmatter: page => slides.value.find(slide => slide.no === page)?.meta.slide.frontmatter ?? {},
    total: slides.value.length,
  })
  const stopRenderNormalization = observePresentationRendering(undefined, [normalizeNative])
  const stopPresentationWatch = watch(
    () => [
      getRawPresentationConfig(),
      (configs as any).fonts,
      (configs as any).footer,
      (configs as any).title,
      slides.value.map(slide => slide.meta.slide.frontmatter),
    ],
    () => {
      applyPresentationConfig()
      normalizeNative(document)
    },
    { deep: true, flush: 'post' },
  )
  app.onUnmount(() => {
    stopPresentationWatch()
    stopRenderNormalization()
  })
})
