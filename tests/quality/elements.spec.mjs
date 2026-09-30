import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import axe from 'axe-core'
import { chromium } from 'playwright-chromium'
import {
  buildDeck, qualityArtifactRoot, readQualityBuildContext, repositoryRoot,
  startStaticServer, waitForSlide,
} from './helpers.mjs'

test('content elements remain readable and their layout options work across presets', {
  timeout: 300_000,
}, async (t) => {
  let server
  let browser
  let baseUrl = process.env.QUALITY_ELEMENTS_URL || readQualityBuildContext()?.['elements-gallery']?.baseUrl
  const output = resolve(qualityArtifactRoot, 'screenshots/elements')
  await mkdir(output, { recursive: true })
  if (!baseUrl) {
    const outDir = resolve(qualityArtifactRoot, 'build/elements')
    await buildDeck({ id: 'elements', outDir, source: resolve(repositoryRoot, 'fixtures/elements-gallery.md') })
    server = await startStaticServer(outDir)
    baseUrl = server.baseUrl
  }
  const report = []
  try {
    browser = await chromium.launch({ headless: true })
    for (const width of [980, 720]) {
      for (const mode of ['light', 'dark']) {
        await t.test(`${width}px ${mode}: content, code, citations and metadata`, async () => {
          const page = await browser.newPage({ viewport: { width, height: Math.round(width * 9 / 16) }, reducedMotion: 'reduce' })
          const errors = []
          page.on('pageerror', error => {
            if (!error.message.includes('Wake Lock permission request denied')) errors.push(error.message)
          })
          try {
            for (let slide = 1; slide <= 30; slide++) {
              const kind = (slide - 1) % 10 + 1
              // Wider screens cover every surface; narrow views focus on the changed containment.
              if (width === 720 && ![3, 4, 7, 10].includes(kind)) continue
              await waitForSlide(page, baseUrl, slide, mode)
              const frame = page.locator(`.slidev-page-${slide} .slide-frame`)
              await frame.waitFor({ state: 'visible' })
              const geometry = await frame.evaluate(el => {
                const content = el.querySelector('.slide-frame__content')
                return {
                  overflowX: content.scrollWidth - content.clientWidth,
                  overflowY: content.scrollHeight - content.clientHeight,
                  overflowMode: getComputedStyle(content).overflowY,
                  brokenImages: [...el.querySelectorAll('img')].filter(img => !img.complete || !img.naturalWidth).length,
                }
              })
              assert.ok(geometry.overflowX <= 1, JSON.stringify({ slide, geometry }))
              if (width === 980 || [4, 10].includes(kind)) {
                assert.ok(geometry.overflowY <= 1, JSON.stringify({ slide, geometry }))
              } else if (geometry.overflowY > 1) {
                assert.match(geometry.overflowMode, /auto|scroll/, 'narrow long content must remain reachable')
              }
              assert.equal(geometry.brokenImages, 0)
              if (width === 720 && kind === 3 && geometry.overflowY > 1) {
                const content = frame.locator('.slide-frame__content')
                await content.focus()
                await page.keyboard.press('End')
                await page.waitForFunction(el => el.scrollTop > 0, await content.elementHandle())
                assert.ok(await frame.isVisible(), 'scrolling content must not advance the deck')
                await content.evaluate(el => { el.scrollTop = 0; el.blur() })
              }
              if (kind === 4) {
                const code = await frame.locator('.slidev-code-wrapper').evaluate(el => {
                  const content = el.closest('.slide-frame__content')
                  return { height: el.clientHeight, available: content.clientHeight, scrollHeight: el.scrollHeight, text: el.textContent }
                })
                assert.match(code.text, /console\.log\(result\)/)
                assert.ok(code.height < code.available - 40, 'short code should not stretch into a blank full-height panel')
                assert.ok(code.scrollHeight <= code.height + 1, 'the short example remains fully visible')
              }
              if (kind === 10) {
                const geometry = await frame.locator('.presentation-closing').evaluate(el => {
                  const message = el.querySelector('.presentation-closing__message')
                  return { width: el.clientWidth, messageWidth: message.clientWidth }
                })
                assert.ok(Math.abs(geometry.width - geometry.messageWidth) <= 1, 'an omitted logo must not reserve a column')
                assert.equal(await frame.locator('.presentation-author').count(), 2)
              }
              if ([1, 2, 3, 4, 5, 6, 7, 8, 10].includes(kind)) {
                await page.evaluate(axe.source)
                const result = await page.evaluate(async selector => window.axe.run(selector, {
                  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
                }), `.slidev-page-${slide} .slidev-layout`)
                assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `slide ${slide}: accessibility`)
              }
              await frame.screenshot({ path: resolve(output, `${width}-${mode}-${slide}.png`) })
              report.push({ width, mode, slide, ...geometry })
            }
            assert.deepEqual(errors, [])
          } finally { await page.close() }
        })
      }
    }
    await t.test('unnumbered outlines retain full-width titles and keyboard destinations', async () => {
      const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'reduce' })
      try {
        for (const slide of [31, 32, 33]) {
          for (const width of [980, 720]) {
            await page.setViewportSize({ width, height: Math.round(width * 9 / 16) })
            await waitForSlide(page, baseUrl, slide)
            const frame = page.locator(`.slidev-page-${slide} .slide-frame`)
            assert.equal(await frame.locator('.slide-layout-toc__number').count(), 0)
            const items = frame.locator('.slide-layout-toc__button')
            const geometry = await items.evaluateAll(items => items.map(item => ({ width: item.clientWidth, textWidth: item.querySelector('.slide-layout-toc__text').clientWidth })))
            assert.ok(geometry.every(item => item.textWidth >= item.width * 0.95), JSON.stringify(geometry))
            const button = frame.locator('button.slide-layout-toc__button')
            await button.focus()
            assert.ok(await button.evaluate(el => document.activeElement === el))
            await page.keyboard.press('Enter')
            await page.locator(`.slidev-page-${(slide - 31) * 10 + 2} .slide-frame`).waitFor({ state: 'visible' })
          }
        }
      } finally { await page.close() }
    })
    await t.test('reversed columns honor authored gaps and equal widths on the scaled canvas', async () => {
      const page = await browser.newPage({ reducedMotion: 'reduce' })
      try {
        for (const slide of [34, 35, 36]) {
          for (const width of [980, 720]) {
            await page.setViewportSize({ width, height: Math.round(width * 9 / 16) })
            await waitForSlide(page, baseUrl, slide)
            const geometry = await page.locator(`.slidev-page-${slide} .slide-layout-two-cols`).evaluate(root => {
              const panes = [...root.querySelectorAll('.slide-layout-two-cols__pane')]
              return {
                panes: panes.map(pane => ({ width: pane.clientWidth, rect: pane.getBoundingClientRect().toJSON(), paddingLeft: parseFloat(getComputedStyle(pane).paddingLeft), paddingRight: parseFloat(getComputedStyle(pane).paddingRight) })),
                gap: parseFloat(getComputedStyle(root).columnGap),
                rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
                divider: getComputedStyle(root, '::before').content,
              }
            })
            const [first, second] = geometry.panes
            assert.ok(Math.abs(first.width - second.width) <= 1, JSON.stringify(geometry))
            assert.equal(first.paddingLeft + first.paddingRight, second.paddingLeft + second.paddingRight, 'the gutter must not eat into one pane')
            assert.equal(geometry.gap, 4 * geometry.rem)
            assert.ok(first.rect.x > second.rect.x, 'reverse changes visual order on the fixed Slidev canvas')
            assert.ok(Math.abs(first.rect.y - second.rect.y) <= 1, 'scaled columns retain their shared top axis')
            assert.equal(geometry.divider, 'none', 'the gutter has no decorative divider')
          }
        }
      } finally { await page.close() }
    })
  } finally {
    await writeFile(resolve(output, 'review.json'), JSON.stringify(report, null, 2))
    await browser?.close()
    await server?.close()
  }
})
