import { resolvePresentation } from './presentation-config'
import { columnVariables } from './columns'

type NativeContext = {
  deck: Record<string, any>
  frontmatter: (page: number) => Record<string, unknown>
  total: number
}

const setText = (element: Element, value: string) => {
  if (element.textContent !== value) element.textContent = value
}

const createFooter = (document: Document) => {
  const footer = document.createElement('footer')
  footer.className = 'slide-frame__footer presentation-native-footer'
  const label = document.createElement('div')
  label.className = 'slide-frame__footer-left'
  const page = document.createElement('div')
  page.className = 'slide-frame__page'
  for (const part of ['current', 'divider', 'total']) {
    const span = document.createElement('span')
    span.className = `slide-frame__page-${part}`
    page.append(span)
  }
  footer.append(label, page)
  return footer
}

// Keep the native layout's slots and full-bleed geometry. The same resolver is
// used for live slides, previews, overview and print copies through their page ID.
export const normalizeNativeLayouts = (root: Document | Element, context: NativeContext): void => {
  const layouts = new Set<HTMLElement>()
  if (root instanceof HTMLElement && root.matches('.slidev-layout')) layouts.add(root)
  if (root instanceof Element) {
    const ancestor = root.closest<HTMLElement>('.slidev-layout')
    if (ancestor) layouts.add(ancestor)
  }
  for (const layout of root.querySelectorAll<HTMLElement>('.slidev-layout')) layouts.add(layout)

  for (const layout of layouts) {
    if (layout.querySelector('.slide-frame')) continue
    const page = Number(layout.closest('[data-slidev-no]')?.getAttribute('data-slidev-no'))
    if (!page) continue
    const slide = context.frontmatter(page)
    if (slide.layout === 'none') continue
    const rawVariant = String(slide.layout ?? 'default')
    const fullBleed = ['full', 'image', 'iframe', 'iframe-left', 'iframe-right'].includes(rawVariant)
    const state = resolvePresentation({
      deck: context.deck.themeConfig?.presentation,
      slide,
      variant: fullBleed ? 'cover' : rawVariant === 'fact' ? 'center' : rawVariant === 'two-cols-header' ? 'two-cols' : 'default',
    })
    layout.dataset.presentationNative = rawVariant
    layout.dataset.presentationPreset = state.preset
    if (rawVariant === 'two-cols-header') {
      for (const [key, value] of Object.entries(columnVariables(slide.columnRatio))) {
        layout.style.setProperty(key, value)
      }
    }
    if (state.accent) {
      layout.style.setProperty('--presentation-accent', state.accent)
      layout.style.setProperty('--slidev-theme-primary', state.accent)
      layout.dataset.presentationAccent = state.accent
    } else if (layout.dataset.presentationAccent) {
      layout.style.removeProperty('--presentation-accent')
      layout.style.removeProperty('--slidev-theme-primary')
      delete layout.dataset.presentationAccent
    }

    let footer = layout.querySelector<HTMLElement>(':scope > .presentation-native-footer')
    if (!state.showFooter) {
      footer?.remove()
      delete layout.dataset.presentationFooter
      continue
    }
    if (!footer) {
      footer = createFooter(layout.ownerDocument)
      layout.append(footer)
    }
    layout.dataset.presentationFooter = 'visible'
    const label = footer.querySelector<HTMLElement>('.slide-frame__footer-left')!
    const text = slide.footer ?? context.deck.footer ?? context.deck.title ?? ''
    setText(label, text === false ? '' : String(text).trim())
    label.hidden = !label.textContent
    footer.classList.toggle('slide-frame__footer--page-only', !label.textContent)
    const numbering = footer.querySelector<HTMLElement>('.slide-frame__page')!
    numbering.hidden = !state.pageNumber
    setText(numbering.children[0], String(page).padStart(2, '0'))
    setText(numbering.children[1], '/')
    setText(numbering.children[2], String(context.total).padStart(2, '0'))
  }
}
