import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'
import ts from 'typescript'

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const viewerSelector = '.presentation-image-viewer'
const imageSelector = '.presentation-image-viewer__image'
const closeSelector = '.presentation-image-viewer__close'
const triggerSelector = '[data-image-viewer-trigger]'
const svg = (width, height, color) => (
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${color}"/></svg>`
)

let browser
let moduleUrl
let componentCss

before(async () => {
  const [source, styles] = await Promise.all([
    readFile(resolve(repositoryRoot, 'setup/image-viewer.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/components.css'), 'utf8'),
  ])
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: 'image-viewer.ts',
  })
  moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  componentCss = styles
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
})

const createPage = async (t, content, { enabled = true } = {}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 800, width: 1100 },
  })
  t.after(() => context.close())
  const page = await context.newPage()
  await page.route('http://image-viewer.test/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname === '/') {
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><title>Image viewer interaction fixture</title></head><body></body></html>' })
    } else if (pathname.endsWith('/broken.svg')) {
      await route.fulfill({ contentType: 'image/svg+xml', status: 404, body: '' })
    } else {
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: pathname.endsWith('/portrait.svg')
          ? svg(300, 900, '#488675')
          : svg(1200, 600, '#7459a8'),
      })
    }
  })
  await page.goto('http://image-viewer.test/')
  await page.setContent(`
    <div class="slidev-layout" data-presentation-preset="default">
      <div class="slide-frame">
        <img id="branding" src="/images/landscape.svg" alt="Theme branding">
        <div class="slide-frame__content">${content}</div>
      </div>
    </div>
  `)
  await page.addStyleTag({ content: componentCss })
  await page.addStyleTag({ content: `
    body { margin: 0; }
    .slide-frame { padding: 24px; }
    #branding { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; }
    .slide-frame__content { display: flex; flex-wrap: wrap; align-items: start; gap: 20px; }
    .slide-frame__content figure { margin: 0; }
    .slide-frame__content img { width: 180px; height: 140px; object-fit: cover; }
    .obsidian-slidev-media__viewport { position: relative; width: 180px; height: 140px; }
    [data-media-rendering="background"] .obsidian-slidev-media__viewport {
      background: url('/images/landscape.svg') center / 70% no-repeat;
    }
    [data-media-rendering="background"] img { position: absolute; width: 1px; height: 1px; opacity: 0; clip-path: inset(50%); }
  ` })
  await page.waitForFunction(() => [...document.images].every(image => image.complete))
  await page.evaluate(async ({ moduleUrl: url, enabled: initiallyEnabled }) => {
    const { installImageViewer } = await import(url)
    window.viewerEnabled = initiallyEnabled
    window.installViewer = installImageViewer
    window.imageViewer = installImageViewer({ enabled: () => window.viewerEnabled })
    window.imageViewer.refresh()
  }, { moduleUrl, enabled })
  return page
}

const refresh = page => page.evaluate(() => window.imageViewer.refresh())
const assertOpen = async (page) => {
  await page.locator(viewerSelector).waitFor({ state: 'visible' })
  assert.equal(await page.locator(viewerSelector).count(), 1)
  const accessible = await page.locator(viewerSelector).evaluate(element => ({
    modal: element.matches('dialog:modal') || element.getAttribute('aria-modal') === 'true',
    named: Boolean(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')),
  }))
  assert.equal(accessible.modal, true, 'image viewer is modal')
  assert.equal(accessible.named, true, 'image viewer has an accessible name')
}
const assertClosed = page => page.locator(viewerSelector).waitFor({ state: 'hidden' })
const close = async (page) => {
  await page.locator(closeSelector).click()
  await assertClosed(page)
}

test('fullscreen viewing preserves plain, Figure, generated, and background-rendered image sources', async (t) => {
  const page = await createPage(t, `
    <p><img id="plain" src="/images/landscape.svg" alt="Markdown diagram"></p>
    <figure class="obsidian-slidev-media obsidian-slidev-media--image" data-media-managed="vue" data-media-state="ready">
      <div id="figure" class="obsidian-slidev-media__viewport"><img src="/images/portrait.svg" alt="Figure portrait"></div>
      <figcaption>Portrait <em>caption</em> &amp; detail</figcaption>
    </figure>
    <figure class="obsidian-slidev-media obsidian-slidev-media--image" data-media-managed="generated" data-media-state="ready">
      <img id="generated" class="obsidian-slidev-media__image obsidian-slidev-media__asset" src="/images/landscape.svg" alt="Generated chart">
      <figcaption>Generated caption</figcaption>
    </figure>
    <figure class="obsidian-slidev-media obsidian-slidev-media--image" data-media-managed="vue" data-media-state="ready" data-media-rendering="background">
      <div id="background" class="obsidian-slidev-media__viewport"><img src="/images/landscape.svg" alt="Custom background sizing"></div>
    </figure>
  `)

  for (const id of ['plain', 'figure', 'generated', 'background']) {
    const trigger = page.locator(`#${id}`)
    assert.equal(await trigger.locator('xpath=self::*[@data-image-viewer-trigger]').count(), 1, `${id}: focusable viewer trigger`)
    const original = await trigger.evaluate(element => {
      const image = element.matches('img') ? element : element.querySelector('img')
      return {
        alt: image.alt,
        caption: image.closest('figure')?.querySelector('figcaption')?.textContent.trim() ?? '',
        source: image.currentSrc || image.src,
      }
    })
    await trigger.click()
    await assertOpen(page)
    const rendered = await page.locator(imageSelector).evaluate(image => {
      const bounds = image.getBoundingClientRect()
      return {
        alt: image.alt,
        fit: getComputedStyle(image).objectFit,
        source: image.src,
        contained: bounds.left >= 0 && bounds.top >= 0
          && bounds.right <= innerWidth && bounds.bottom <= innerHeight,
      }
    })
    assert.equal(rendered.alt, original.alt, `${id}: retains authored alternative`)
    assert.equal(rendered.source, original.source, `${id}: uses original source`)
    assert.equal(rendered.fit, 'contain', `${id}: displays the complete image`)
    assert.equal(rendered.contained, true, `${id}: fits within the screen`)
    if (id === 'figure') {
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('.presentation-image-viewer__caption').evaluate(element => element === document.activeElement), true, 'caption can receive keyboard focus for scrolling')
      await page.keyboard.press('Shift+Tab')
      assert.equal(await page.locator(closeSelector).evaluate(element => element === document.activeElement), true, 'focus cycles back to the close button')
    }
    const caption = page.locator(`${viewerSelector} .presentation-image-viewer__caption`)
    if (original.caption) {
      assert.equal((await caption.textContent()).trim(), original.caption, `${id}: preserves caption text`)
    } else {
      assert.equal(await caption.count(), 0, `${id}: does not invent a caption`)
    }
    await close(page)
  }
})

test('responsive images open the resource the browser selected', async (t) => {
  const page = await createPage(t, '<img id="responsive" src="/images/landscape.svg" srcset="/images/landscape.svg 1x, /images/portrait.svg 2x" alt="Responsive chart">')
  const selected = await page.locator('#responsive').evaluate(image => image.currentSrc)
  assert.ok(selected.endsWith('/images/portrait.svg'), 'fixture selects the 2x resource')
  await page.locator('#responsive').click()
  await assertOpen(page)
  assert.equal(await page.locator(imageSelector).getAttribute('src'), selected)
})

test('keyboard activation, modal focus, and dismissal do not reach slide navigation', async (t) => {
  const page = await createPage(t, '<img id="keyboard" src="/images/landscape.svg" alt="Keyboard accessible chart">')
  await page.evaluate(() => {
    window.hostKeys = []
    for (const type of ['keydown', 'keyup']) {
      document.addEventListener(type, event => {
        if (['ArrowRight', 'ArrowLeft', 'Enter', 'Space', 'Escape'].includes(event.code)) {
          window.hostKeys.push(`${event.type}:${event.code}`)
        }
      })
    }
  })
  const opener = page.locator('#keyboard')
  await opener.focus()
  await page.keyboard.press('Enter')
  await assertOpen(page)
  for (const key of ['Tab', 'Shift+Tab', 'Tab']) {
    await page.keyboard.press(key)
    assert.equal(await page.locator(viewerSelector).evaluate(dialog => dialog.contains(document.activeElement)), true, `${key}: focus stays in the viewer`)
  }
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Escape')
  await assertClosed(page)
  assert.equal(await opener.evaluate(element => element === document.activeElement), true, 'Escape returns focus to the opener')
  assert.deepEqual(await page.evaluate(() => window.hostKeys), [], 'opening, viewing, and closing keys are isolated from navigation')

  await page.keyboard.press('Space')
  await assertOpen(page)
  await page.keyboard.press('Escape')
  await assertClosed(page)
  assert.deepEqual(await page.evaluate(() => window.hostKeys), [], 'Space activation and its keyup stay isolated')
  for (const key of ['Enter', 'Space']) {
    await page.keyboard.press('Enter')
    await assertOpen(page)
    await page.locator(closeSelector).focus()
    await page.keyboard.press(key)
    await assertClosed(page)
    assert.equal(await opener.evaluate(element => element === document.activeElement), true, `${key}: close button returns focus to the opener`)
    assert.deepEqual(await page.evaluate(() => window.hostKeys), [], `${key}: native close-button activation and its keyup stay isolated`)
  }
  await page.keyboard.press('ArrowRight')
  assert.deepEqual(await page.evaluate(() => window.hostKeys), ['keydown:ArrowRight', 'keyup:ArrowRight'], 'ordinary navigation keys resume after closing')
})

test('clicking the backdrop closes the viewer and restores focus', async (t) => {
  const page = await createPage(t, '<img id="backdrop" src="/images/landscape.svg" alt="Backdrop chart">')
  await page.locator('#backdrop').click()
  await assertOpen(page)
  await page.mouse.click(2, 798)
  await assertClosed(page)
  assert.equal(await page.locator('#backdrop').evaluate(element => element === document.activeElement), true)

  await page.locator('#backdrop').evaluate(image => { image.src = '/images/portrait.svg' })
  await page.waitForFunction(() => document.querySelector('#backdrop').naturalHeight === 900)
  await refresh(page)
  await page.locator('#backdrop').click()
  await assertOpen(page)
  await page.locator(imageSelector).evaluate(image => image.decode())
  await page.mouse.click(550, 400)
  await assertOpen(page)
  assert.equal(await page.locator(imageSelector).evaluate(image => document.elementFromPoint(50, 200) === image), true, 'portrait letterboxing is inside the image element')
  await page.mouse.click(50, 200)
  await assertClosed(page)
  assert.equal(await page.locator('#backdrop').evaluate(element => element === document.activeElement), true, 'letterboxing dismissal returns focus to the opener')
})

test('decorative, broken, linked, and control images keep their original behavior', async (t) => {
  const page = await createPage(t, `
    <img id="decorative" src="/images/landscape.svg" alt="">
    <img id="hidden" src="/images/landscape.svg" alt="Hidden decoration" aria-hidden="true">
    <img id="broken" src="/images/broken.svg" alt="Unavailable chart">
    <img id="opt-out-image" src="/images/landscape.svg" alt="Image without zoom" data-image-zoom="false">
    <div data-image-zoom="false"><img id="opt-out-container-image" src="/images/landscape.svg" alt="Container without zoom"></div>
    <a id="image-link" href="#linked-target"><img id="linked" src="/images/landscape.svg" alt="Linked chart"></a>
    <button id="image-button" type="button"><img id="button-image" src="/images/landscape.svg" alt="Button image"></button>
    <figure class="obsidian-slidev-media obsidian-slidev-media--image" data-media-state="failed"><div class="obsidian-slidev-media__fallback" role="img" aria-label="Unavailable Figure"></div></figure>
  `)
  assert.equal(await page.locator(triggerSelector).count(), 0, 'excluded images and theme branding are not viewer controls')
  await page.locator('#image-link').click()
  assert.equal(new URL(page.url()).hash, '#linked-target')
  await assertClosed(page)
  await page.locator('#image-button').click()
  await assertClosed(page)
  for (const id of ['opt-out-image', 'opt-out-container-image']) {
    await page.locator(`#${id}`).click()
    await assertClosed(page)
  }
})

test('refresh handles new images, source changes, failures, and detached openers', async (t) => {
  const page = await createPage(t, '<div id="dynamic-container"></div>')
  await page.evaluate(() => {
    const image = document.createElement('img')
    image.id = 'dynamic'
    image.alt = 'First dynamic source'
    image.src = '/images/landscape.svg'
    document.querySelector('#dynamic-container').append(image)
  })
  await page.waitForFunction(() => document.querySelector('#dynamic').naturalWidth > 0)
  await refresh(page)
  await refresh(page)
  assert.equal(await page.locator(triggerSelector).count(), 1, 'refresh is idempotent')
  await page.locator('#dynamic').click()
  await assertOpen(page)
  await close(page)

  await page.locator('#dynamic').evaluate(image => {
    image.src = '/images/portrait.svg'
    image.alt = 'Updated dynamic source'
  })
  await page.waitForFunction(() => document.querySelector('#dynamic').naturalHeight === 900)
  await refresh(page)
  await page.locator('#dynamic').click()
  await assertOpen(page)
  assert.ok((await page.locator(imageSelector).getAttribute('src')).endsWith('/images/portrait.svg'))
  assert.equal(await page.locator(imageSelector).getAttribute('alt'), 'Updated dynamic source')
  await page.locator('#dynamic').evaluate(image => image.remove())
  await refresh(page)
  await assertClosed(page)

  await page.evaluate(() => {
    document.querySelector('#dynamic-container').innerHTML = '<img id="failure" src="/images/landscape.svg" alt="Later failure">'
  })
  await page.waitForFunction(() => document.querySelector('#failure').naturalWidth > 0)
  await refresh(page)
  assert.equal(await page.locator(triggerSelector).count(), 1)
  await page.locator('#failure').evaluate(image => { image.src = '/images/broken.svg' })
  await page.waitForFunction(() => document.querySelector('#failure').complete && !document.querySelector('#failure').naturalWidth)
  await refresh(page)
  assert.equal(await page.locator(triggerSelector).count(), 0, 'failed source loses its fullscreen affordance')
})

test('stop closes the viewer, removes listeners, and restores authored attributes', async (t) => {
  const page = await createPage(t, '<img id="cleanup" src="/images/landscape.svg" alt="Cleanup chart" title="Authored title" tabindex="4" role="img">')
  await page.locator('#cleanup').click()
  await assertOpen(page)
  await page.evaluate(() => window.imageViewer.stop())
  await assertClosed(page)
  assert.equal(await page.locator(triggerSelector).count(), 0)
  assert.deepEqual(await page.locator('#cleanup').evaluate(image => ({
    role: image.getAttribute('role'),
    tabindex: image.getAttribute('tabindex'),
    title: image.getAttribute('title'),
  })), { role: 'img', tabindex: '4', title: 'Authored title' })
  await page.locator('#cleanup').click()
  await assertClosed(page)
  await page.evaluate(() => {
    window.imageViewer.stop()
    window.imageViewer = window.installViewer()
    window.imageViewer.refresh()
  })
  await page.locator('#cleanup').click()
  await assertOpen(page)
})

test('disabled presentation modes do not expose image interactions', async (t) => {
  const page = await createPage(t, '<img id="print" src="/images/landscape.svg" alt="Print chart">', { enabled: false })
  assert.equal(await page.locator(triggerSelector).count(), 0)
  await page.locator('#print').click()
  await assertClosed(page)
  await page.evaluate(() => { window.viewerEnabled = true })
  await refresh(page)
  await page.locator('#print').click()
  await assertOpen(page)
  await page.evaluate(() => { window.viewerEnabled = false })
  await refresh(page)
  await assertClosed(page)
  assert.equal(await page.locator(triggerSelector).count(), 0, 'switching into print/export mode restores normal image markup')
})
