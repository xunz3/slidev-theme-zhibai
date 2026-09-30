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
        for (const slide of [1, 2, 3]) {
          await waitForSlide(page, server.baseUrl, slide, mode)
          const layout = page.locator(`.slidev-page-${slide} .slidev-layout`)
          assert.equal(await layout.locator('.slide-frame').count(), 0, 'native layouts do not require the theme wrapper')
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
          assert.equal(state.padding === '0px', slide === 3, 'full retains its edge-to-edge canvas')
          if (mode === 'light') assert.equal(state.bg, 'rgb(250, 248, 243)')
          if (slide === 2) {
            for (const slot of ['header', 'left', 'right', 'bottom']) {
              assert.ok((await layout.locator(`.col-${slot}`).innerText()).trim())
            }
          }
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
