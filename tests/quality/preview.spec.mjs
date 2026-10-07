import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import axe from 'axe-core'
import { qualityArtifactRoot, repositoryRoot, runProcess, startStaticServer } from './helpers.mjs'

test('preview exposes working presets, page sources and complete scenario templates', { timeout: 600_000 }, async (t) => {
  await runProcess(process.execPath, ['scripts/build-preview.mjs'], {
    logPath: resolve(qualityArtifactRoot, 'logs/build-preview.log'), timeoutMs: 480_000,
  })
  const outDir = resolve(repositoryRoot, 'dist-preview')
  const output = resolve(qualityArtifactRoot, 'screenshots/preset-completion')
  await mkdir(output, { recursive: true })
  const manifest = JSON.parse(await readFile(resolve(outDir, 'manifest.json'), 'utf8'))
  assert.deepEqual(manifest.decks.map(deck => deck.pages.length), [30, 45, 8, 8, 8])
  assert.ok(manifest.decks.every(deck => deck.pages.every(page => page.source.trim())))
  assert.doesNotMatch(JSON.stringify(manifest), /\/home\/|__THEME_PATH__/)
  const server = await startStaticServer(outDir)
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    for (const width of [980, 720]) {
      for (const mode of ['light', 'dark']) {
        const page = await browser.newPage({ viewport: { width, height: Math.round(width * 9 / 16) }, reducedMotion: 'reduce' })
        // Headless browsers cannot keep a physical display awake.
        await page.addInitScript(() => localStorage.setItem('slidev-wake-lock', 'false'))
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('DOM.enable')
        await cdp.send('CSS.enable')
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        try {
          for (const deck of manifest.decks) {
            for (const slide of deck.pages) {
              await t.test(`${deck.id} / ${slide.no} / ${mode} / ${width}`, async () => {
                await page.goto(`${server.baseUrl}/decks/${deck.id}/index.html#/${slide.no}`, { waitUntil: 'domcontentloaded' })
                const layout = page.locator(`.slidev-page-${slide.no} .slidev-layout`).first()
                await layout.waitFor({ state: 'visible' })
                await page.evaluate(async dark => {
                  document.documentElement.classList.toggle('dark', dark)
                  await document.fonts.ready
                }, mode === 'dark')
                await page.waitForTimeout(60)
                const state = await layout.evaluate(el => {
                  const content = el.querySelector('.slide-frame__content') ?? el
                  const heading = el.querySelector('h1')
                  return {
                    preset: el.dataset.presentationPreset,
                    x: content.scrollWidth - content.clientWidth,
                    y: content.scrollHeight - content.clientHeight,
                    canvasX: el.scrollWidth - el.clientWidth,
                    canvasY: el.scrollHeight - el.clientHeight,
                    font: heading ? getComputedStyle(heading).fontFamily : null,
                    bodyFont: getComputedStyle(el).fontFamily,
                    lineHeight: getComputedStyle(el).lineHeight,
                    background: getComputedStyle(el).backgroundColor,
                    figureFallbacks: el.querySelectorAll('.presentation-media__fallback').length,
                  }
                })
                records.push({ deck: deck.id, slide: slide.no, layout: slide.layout, mode, width, ...state })
                if (deck.id === 'english' && width === 980 && mode === 'light') {
                  const { root } = await cdp.send('DOM.getDocument')
                  const fontsFor = async selector => {
                    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `.slidev-page-${slide.no} ${selector}` })
                    assert.ok(nodeId, selector)
                    return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts
                  }
                  const uses = (fonts, family) => fonts.some(font => font.isCustomFont && font.familyName.startsWith(family) && font.glyphCount > 0)
                  const serif = ['zhubai', 'qingdai', 'ucas'].includes(slide.preset)
                  const display = ['cover', 'section', 'end'].includes(slide.layout)
                  const fonts = {}
                  if (slide.layout === 'quote') {
                    fonts.quote = await fontsFor('.slide-layout-quote__content blockquote p')
                    assert.ok(uses(fonts.quote, serif ? 'Source Serif 4' : 'Source Sans 3'), JSON.stringify(fonts))
                  } else {
                    fonts.heading = await fontsFor('h1')
                    assert.ok(uses(fonts.heading, (display && serif) || (!display && ['zhubai', 'qingdai'].includes(slide.preset)) ? 'Source Serif 4' : 'Source Sans 3'), JSON.stringify(fonts))
                  }
                  if (slide.layout === 'default') {
                    fonts.prose = await fontsFor('.slide-frame__content > p')
                    fonts.emphasis = await fontsFor('em')
                    assert.ok(uses(fonts.prose, 'Source Sans 3') && uses(fonts.emphasis, 'Source Sans 3'), JSON.stringify(fonts))
                    assert.ok(fonts.emphasis.some(font => /italic/i.test(font.postScriptName)), 'English emphasis uses a loaded italic face')
                    const footnoteLeading = await layout.locator('.footnotes li').evaluate(el => parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize))
                    assert.ok(Math.abs(footnoteLeading - 1.3) < 0.01, 'footnotes use caption leading independently of prose')
                  }
                  if (slide.layout === 'code') {
                    fonts.code = await fontsFor('pre.shiki .line > span')
                    assert.ok(uses(fonts.code, 'JetBrains Mono'), JSON.stringify(fonts))
                  }
                  if (slide.layout === 'two-cols') assert.equal(await layout.locator('.katex-display').count(), 1)
                  records.at(-1).renderedFonts = fonts
                }
                assert.equal(state.preset, slide.preset)
                assert.equal(await layout.locator('.slide-frame__footer').count(), ['cover', 'section', 'end'].includes(slide.layout) ? 0 : 1)
                assert.ok(state.x <= 1 && state.y <= 1, JSON.stringify(records.at(-1)))
                assert.ok(state.canvasX <= 1 && state.canvasY <= 1, JSON.stringify(records.at(-1)))
                assert.equal(state.figureFallbacks, 0)
                if (deck.id === 'gallery' || deck.id === 'english') {
                  const prefix = deck.id === 'english' ? 'english-' : ''
                  await layout.screenshot({ path: resolve(output, `${prefix}${slide.preset}-${slide.layout}-${mode}-${width}.png`) })
                }
                if (width === 980 && ['default', 'two-cols-header', 'fact'].includes(slide.layout)) {
                  await page.evaluate(axe.source)
                  const result = await page.evaluate(selector => window.axe.run(selector, {
                    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
                  }), `.slidev-page-${slide.no} .slidev-layout`)
                  assert.deepEqual(result.violations, [], JSON.stringify(result.violations))
                }
              })
            }
          }
          assert.deepEqual(errors, [], 'no client errors in the built decks')
        } finally { await page.close() }
      }
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
    await page.addInitScript(() => localStorage.setItem('slidev-wake-lock', 'false'))
    await page.goto(server.baseUrl)
    const iframe = page.frameLocator('#slides')
    await iframe.locator('.slidev-layout[data-presentation-preset="zhubai"]').first().waitFor({ state: 'visible' })
    await page.getByRole('button', { name: '正文', exact: true }).click()
    await page.locator('[data-preset="qingdai"]').click()
    await iframe.locator('.slidev-page-9 .slidev-layout[data-presentation-preset="qingdai"]').waitFor({ state: 'visible' })
    await page.locator('#source-panel summary').click()
    assert.match(await page.locator('#source').innerText(), /preset: qingdai/)
    assert.match(await page.locator('#source').innerText(), /结果，需要怎样的上下文/)
    await page.getByRole('button', { name: '深色预览', exact: true }).click()
    await iframe.locator('html.dark').waitFor({ state: 'attached' })
    await page.screenshot({ path: resolve(output, 'preview-desktop-dark.png'), fullPage: true })
    await page.locator('#deck').selectOption('english')
    await iframe.locator('.slidev-page-10 .slidev-layout[data-presentation-preset="qingdai"]').waitFor({ state: 'visible' })
    assert.equal(await page.locator('#presets').isVisible(), true)
    assert.equal(await page.locator('#pages button').count(), 9)
    await page.locator('[data-preset="ucas"]').click()
    await iframe.locator('.slidev-page-28 .slidev-layout[data-presentation-preset="ucas"]').waitFor({ state: 'visible' })
    assert.equal(await iframe.locator('.slidev-page-28 .slide-cover__author').count(), 3)
    assert.equal(await iframe.locator('.slidev-page-28 .slide-cover__institution').count(), 2)
    assert.match(await page.locator('#source').innerText(), /Reliable Decisions under Distribution Shift/)
    assert.match(await page.locator('#source').innerText(), /preset.*ucas/)
    assert.equal(new URL(page.url()).searchParams.get('preset'), 'ucas')
    await page.screenshot({ path: resolve(output, 'preview-english-ucas-dark.png'), fullPage: true })
    await page.locator('#deck').selectOption('technical')
    await iframe.locator('.slidev-page-1 .slidev-layout[data-presentation-preset="ict"]').waitFor({ state: 'visible' })
    await page.locator('#pages button').nth(1).click()
    await iframe.getByRole('button', { name: /为什么慢/ }).click()
    await page.waitForFunction(() => document.querySelector('#source').textContent.includes('用户在等哪一步？'))
    await iframe.locator('body').press('ArrowRight')
    await page.waitForFunction(() => document.querySelector('#source').textContent.includes('方法：把独立工作并行执行'))
    assert.match(await page.locator('#counter').innerText(), /^04 \/ 08$/)
    await page.locator('#deck').selectOption('course')
    await iframe.locator('.slidev-page-1 .slidev-layout[data-presentation-preset="qingdai"]').waitFor({ state: 'visible' })
    assert.equal(new URL(page.url()).searchParams.get('preset'), 'qingdai')
    assert.equal(await page.locator('#presets').isVisible(), false)
    assert.equal(await page.locator('#pages button').count(), 8)
    const download = await page.locator('#download').getAttribute('href')
    const source = await (await page.request.get(`${server.baseUrl}/${download.replace(/^\.\//, '')}`)).text()
    assert.match(source, /^---\ntheme: zhibai/)
    assert.ok((await page.request.get(`${server.baseUrl}/sources/research-report.md`)).ok())
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: '浅色预览', exact: true }).click()
    await iframe.locator('html:not(.dark)').waitFor({ state: 'attached' })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: resolve(output, 'preview-mobile-light.png'), fullPage: true })
    await page.evaluate(axe.source)
    const accessibility = await page.evaluate(() => window.axe.run({ exclude: [['#slides']] }, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    }))
    assert.deepEqual(accessibility.violations, [])
    await page.close()
  } finally {
    await writeFile(resolve(output, 'review.json'), `${JSON.stringify(records, null, 2)}\n`)
    await browser.close()
    await server.close()
  }
})
