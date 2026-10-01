import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import axe from 'axe-core'
import { buildDeck, qualityArtifactRoot, repositoryRoot, startStaticServer, waitForSlide } from './helpers.mjs'

test('unmodified Slidev layouts inherit a usable palette and retain native slots', { timeout: 120_000 }, async () => {
  const outDir = resolve(qualityArtifactRoot, 'build/native-layouts')
  await buildDeck({ id: 'native-layouts', outDir, source: resolve(repositoryRoot, 'fixtures/native-layouts.md') })
  const server = await startStaticServer(outDir)
  const browser = await chromium.launch({ headless: true })
  try {
    for (const mode of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'reduce' })
      try {
        for (const slide of [1, 2, 3, 5, 6, 7, 8, 9]) {
          await waitForSlide(page, server.baseUrl, slide, mode)
          const layout = page.locator(`.slidev-page-${slide} .slidev-layout`)
          await layout.waitFor({ state: 'visible' })
          assert.equal(await layout.locator('.slide-frame').count(), slide === 9 ? 1 : 0, 'native layouts do not require the theme wrapper')
          const state = await layout.evaluate(el => {
            const style = getComputedStyle(el)
            return { bg: style.backgroundColor, fg: style.color, padding: style.paddingLeft,
              bodySize: Number.parseFloat(style.fontSize),
              overflowX: el.scrollWidth - el.clientWidth, overflowY: el.scrollHeight - el.clientHeight }
          })
          assert.notEqual(state.bg, 'rgba(0, 0, 0, 0)', 'native canvas has a palette')
          assert.notEqual(state.fg, state.bg)
          assert.ok(state.bodySize >= 16)
          assert.ok(state.overflowX <= 1 && state.overflowY <= 1, JSON.stringify(state))
          assert.equal(state.padding === '0px', [3, 9].includes(slide), 'full and the theme outer canvas have no padding')
          if (slide === 9) assert.notEqual(await layout.locator('.slide-frame').evaluate(el => getComputedStyle(el).paddingLeft), '0px',
            'theme reading padding belongs to its frame')
          const expectedPresets = { 1: 'qingdai', 2: 'qingdai', 3: 'qingdai', 5: 'zhubai', 6: 'songmo', 7: 'ucas', 8: 'ict', 9: 'qingdai' }
          assert.equal(await layout.getAttribute('data-presentation-preset'), expectedPresets[slide])
          if (mode === 'light' && [1, 2, 3].includes(slide)) assert.equal(state.bg, 'rgb(244, 246, 247)')
          assert.equal(await layout.locator('.slide-frame__footer').count(), [3, 6].includes(slide) ? 0 : 1)
          const families = await layout.evaluate(el => ({
            body: getComputedStyle(el).fontFamily,
            heading: getComputedStyle(el.querySelector('h1')).fontFamily,
          }))
          assert.match(families.body, /^Arial/)
          if (slide === 1) assert.match(families.heading, /^Georgia/)
          if (slide === 7) assert.equal(await layout.locator('.slide-frame__page').isVisible(), false)
          if ([7, 9].includes(slide)) {
            const panes = slide === 7 ? ['.col-left', '.col-right'] : ['.slide-layout-two-cols__pane:first-child', '.slide-layout-two-cols__pane:last-child']
            const widths = await Promise.all(panes.map(selector => layout.locator(selector).evaluate(el => el.getBoundingClientRect().width)))
            assert.ok(Math.abs(widths[0] / (widths[0] + widths[1]) - 0.65) < 0.01, `slide ${slide}: widths ${widths}`)
          }
          if (slide === 8) assert.equal(await layout.locator('.slide-frame__footer-left').innerText(), 'A slide-specific label')
          if (slide === 2) {
            for (const slot of ['header', 'left', 'right', 'bottom']) {
              assert.ok((await layout.locator(`.col-${slot}`).innerText()).trim())
            }
          }
          if (slide !== 9) assert.ok(await layout.getAttribute('data-presentation-native'))
          assert.equal(await page.locator('link[href*="fonts.googleapis"], link[href*="fonts.coollabs"]').count(), 0,
            'provider none disables all theme font imports')
          await page.evaluate(axe.source)
          const result = await page.evaluate(selector => window.axe.run(selector, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          }), `.slidev-page-${slide} .slidev-layout`)
          assert.deepEqual(result.violations, [])
        }
        await page.goto(`${server.baseUrl}/4`, { waitUntil: 'domcontentloaded' })
        const unstyled = page.locator('.slidev-page-4')
        await unstyled.getByRole('heading', { name: 'An authored canvas.' }).waitFor({ state: 'visible' })
        assert.equal(await unstyled.locator('.slidev-layout, .slide-frame').count(), 0,
          'native none layout remains entirely author-controlled')
      } finally { await page.close() }
    }
  } finally { await browser.close(); await server.close() }
})
