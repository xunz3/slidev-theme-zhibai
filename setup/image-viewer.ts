const TRIGGER = 'data-image-viewer-trigger'
const EXCLUDED = [
  'a',
  'button',
  '[role="button"]:not([data-image-viewer-trigger])',
  '[role="link"]',
  '[contenteditable]:not([contenteditable="false"])',
  '[aria-hidden="true"]',
  '[data-media-decorative="true"]',
  '[data-image-zoom="false"]',
  '.presentation-closing-logo',
  '.disable-view-transition',
].join(', ')

type TriggerBinding = {
  image: HTMLImageElement
  attributes: Map<string, string | null>
}

/** Enhance rendered images without changing the slide's media structure. */
export const installImageViewer = ({
  enabled = () => true,
}: {
  enabled?: () => boolean
} = {}) => {
  if (typeof document === 'undefined') {
    return { refresh() {}, close() {}, stop() {} }
  }

  const bindings = new Map<HTMLElement, TriggerBinding>()
  let dialog: HTMLDialogElement | undefined
  let opener: HTMLElement | undefined
  let previousFocus: HTMLElement | undefined
  let viewedSource = ''
  const handledKeys = new Map<string, boolean>()

  const canView = (image: HTMLImageElement) => (
    enabled()
    && image.isConnected
    && image.complete
    && image.naturalWidth > 0
    && Boolean(image.closest('.slide-frame__content'))
    && !image.closest(EXCLUDED)
    && !(image.hasAttribute('alt') && !image.alt.trim())
  )

  const close = () => {
    if (!dialog) return
    const current = dialog
    dialog = undefined
    current.close()
    current.remove()
    document.body.classList.remove('presentation-image-viewer-open')
    const focusTarget = previousFocus?.isConnected ? previousFocus : opener
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true })
    opener = undefined
    previousFocus = undefined
    viewedSource = ''
  }

  const restore = (target: HTMLElement, binding: TriggerBinding) => {
    for (const [name, value] of binding.attributes) {
      if (value === null) target.removeAttribute(name)
      else target.setAttribute(name, value)
    }
    target.removeAttribute(TRIGGER)
    bindings.delete(target)
  }

  const refresh = () => {
    const candidates = new Map<HTMLElement, HTMLImageElement>()
    for (const image of document.querySelectorAll<HTMLImageElement>('.slidev-layout img')) {
      if (!canView(image)) continue
      const target = image.closest<HTMLElement>('.obsidian-slidev-media__viewport') ?? image
      candidates.set(target, image)
    }
    for (const [target, binding] of bindings) {
      if (candidates.get(target) !== binding.image) restore(target, binding)
    }
    for (const [target, image] of candidates) {
      let binding = bindings.get(target)
      const label = `View image fullscreen: ${image.alt.trim() || 'Image'}`
      const attributes = { role: 'button', tabindex: '0', 'aria-haspopup': 'dialog', 'aria-label': label, title: label }
      if (!binding) {
        binding = {
          image,
          attributes: new Map(Object.keys(attributes).map(name => [name, target.getAttribute(name)])),
        }
        bindings.set(target, binding)
      }
      target.setAttribute(TRIGGER, '')
      for (const [name, value] of Object.entries(attributes)) {
        if (target.getAttribute(name) !== value) target.setAttribute(name, value)
      }
    }
    const activeImage = opener && bindings.get(opener)?.image
    if (dialog && (!activeImage || (activeImage.currentSrc || activeImage.src) !== viewedSource)) close()
  }

  const open = (target: HTMLElement) => {
    const image = bindings.get(target)?.image
    if (!image || !canView(image)) return
    close()
    opener = target
    // Pointer activation should return focus to the image, too.
    previousFocus = document.activeElement instanceof HTMLElement
      && target.contains(document.activeElement)
      ? document.activeElement
      : target
    viewedSource = image.currentSrc || image.src

    const viewer = document.createElement('dialog')
    viewer.className = 'presentation-image-viewer'
    viewer.setAttribute('aria-label', 'Fullscreen image viewer')
    const enlarged = document.createElement('img')
    enlarged.className = 'presentation-image-viewer__image'
    enlarged.src = viewedSource
    enlarged.alt = image.alt
    enlarged.draggable = false

    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.className = 'presentation-image-viewer__close'
    closeButton.setAttribute('aria-label', 'Close image viewer')
    closeButton.title = 'Close (Esc)'
    closeButton.textContent = '×'
    closeButton.addEventListener('click', close)
    viewer.append(enlarged, closeButton)

    const caption = image.closest('figure')?.querySelector('figcaption')?.textContent?.trim()
    if (caption) {
      const text = document.createElement('p')
      text.className = 'presentation-image-viewer__caption'
      text.textContent = caption
      text.tabIndex = 0
      viewer.append(text)
    }
    viewer.addEventListener('cancel', (event) => {
      event.preventDefault()
      close()
    })
    viewer.addEventListener('click', (event) => {
      event.stopPropagation()
      if (event.target === viewer) {
        close()
      } else if (event.target === enlarged && enlarged.naturalWidth > 0) {
        // object-fit leaves letterboxing inside the img box; it is backdrop too.
        const bounds = enlarged.getBoundingClientRect()
        const scale = Math.min(bounds.width / enlarged.naturalWidth, bounds.height / enlarged.naturalHeight)
        const width = enlarged.naturalWidth * scale
        const height = enlarged.naturalHeight * scale
        const left = bounds.left + (bounds.width - width) / 2
        const top = bounds.top + (bounds.height - height) / 2
        if (event.clientX < left || event.clientX > left + width
          || event.clientY < top || event.clientY > top + height) close()
      }
    })
    // Keep gestures within the viewer, including touch swipe navigation.
    for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'dblclick']) {
      viewer.addEventListener(type, event => event.stopPropagation())
    }
    viewer.addEventListener('wheel', event => event.stopPropagation())
    document.body.append(viewer)
    dialog = viewer
    document.body.classList.add('presentation-image-viewer-open')
    // The modal top layer escapes Slidev's transformed/clipped slide containers.
    viewer.showModal()
    closeButton.focus({ preventScroll: true })
  }

  const triggerFor = (target: EventTarget | null) => (
    target instanceof Element ? target.closest<HTMLElement>(`[${TRIGGER}]`) : null
  )
  const onClick = (event: MouseEvent) => {
    if (dialog || event.defaultPrevented || event.button !== 0
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const target = triggerFor(event.target)
    if (!target || !bindings.has(target)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    open(target)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.type === 'keyup' && handledKeys.has(event.key)) {
      if (handledKeys.get(event.key)) event.preventDefault()
      handledKeys.delete(event.key)
      event.stopImmediatePropagation()
      return
    }
    if (dialog) {
      // Slidev also listens to keyup; block both phases before its shortcuts.
      if (event.type === 'keydown') handledKeys.set(event.key, ['Escape', 'Tab'].includes(event.key))
      event.stopImmediatePropagation()
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault()
        if (event.type === 'keydown' && event.key === 'Escape') close()
        if (event.key === 'Tab' && dialog) {
          const controls = [...dialog.querySelectorAll<HTMLElement>('button, [tabindex="0"]')]
          const index = controls.indexOf(document.activeElement as HTMLElement)
          const next = (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
          controls[next]?.focus()
        }
      }
      return
    }
    const target = triggerFor(event.target)
    if (!target || !bindings.has(target)
      || !['Enter', ' '].includes(event.key)
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (event.type === 'keydown') {
      handledKeys.set(event.key, true)
      if (!event.repeat) open(target)
    }
  }

  const observer = new MutationObserver(refresh)
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'alt', 'class', 'aria-hidden', 'href', 'data-media-decorative', 'data-image-zoom'],
  })
  document.addEventListener('load', refresh, true)
  document.addEventListener('error', refresh, true)
  document.addEventListener('click', onClick, true)
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('keyup', onKey, true)
  window.addEventListener('beforeprint', close)
  refresh()

  return {
    close,
    refresh,
    stop() {
      observer.disconnect()
      document.removeEventListener('load', refresh, true)
      document.removeEventListener('error', refresh, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKey, true)
      window.removeEventListener('beforeprint', close)
      handledKeys.clear()
      close()
      for (const [target, binding] of bindings) restore(target, binding)
    },
  }
}
