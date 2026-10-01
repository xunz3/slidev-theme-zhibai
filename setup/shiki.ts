import type { ShikiSetupReturn } from '@slidev/types'
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup((): ShikiSetupReturn => {
  return {
    themes: {
      dark: 'github-dark-high-contrast',
      light: 'github-light-high-contrast',
    },
    transformers: [{
      name: 'zhubai-code-language-label',
      pre(hast) {
        const sourceLanguage = this.options.lang?.trim()
        if (!sourceLanguage || ['plain', 'text', 'txt', 'plaintext'].includes(sourceLanguage.toLowerCase())) return
        hast.properties ??= {}
        hast.properties['data-language'] = sourceLanguage
      },
    }],
  }
})
