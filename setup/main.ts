import { configs } from '@slidev/client'
import { defineAppSetup } from '@slidev/types'
import { watch } from 'vue'
import { resolveDeckPresentation } from './presentation-config'
import { observePresentationRendering } from './render-normalization'

const getRawPresentationConfig = (): unknown => {
  return (configs as any)?.themeConfig?.presentation
}

export const applyPresentationConfig = (rawPresentation = getRawPresentationConfig()) => {
  if (typeof document === 'undefined') return

  const accent = resolveDeckPresentation(rawPresentation).accent
  const root = document.documentElement

  if (accent) {
    root.style.setProperty('--slidev-theme-primary', accent)
  } else {
    root.style.removeProperty('--slidev-theme-primary')
  }
}

export default defineAppSetup(({ app }) => {
  applyPresentationConfig()
  const stopRenderNormalization = observePresentationRendering()
  const stopPresentationWatch = watch(
    () => resolveDeckPresentation(getRawPresentationConfig()).accent,
    () => applyPresentationConfig(),
  )
  app.onUnmount(() => {
    stopPresentationWatch()
    stopRenderNormalization()
  })
})
