import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import { buildDeck, qualityArtifactRoot, repositoryRoot, startStaticServer, waitForSlide } from './helpers.mjs'

test('Latin and Chinese typography uses the intended rendered faces', { timeout: 240_000 }, async () => {
  const output = resolve(qualityArtifactRoot, 'screenshots/typography')
  const outDir = resolve(qualityArtifactRoot, 'build/typography')
  await mkdir(output, { recursive: true })
  await buildDeck({ id: 'typography', outDir, source: resolve(repositoryRoot, 'fixtures/typography.md') })
  const server = await startStaticServer(outDir)
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'reduce' })
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    for (let slide = 1; slide <= 6; slide += 1) {
      await waitForSlide(page, server.baseUrl, slide, 'light')
      const prefix = `.slidev-page-${slide}`
      const { root } = await cdp.send('DOM.getDocument')
      const fontsFor = async selector => {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `${prefix} ${selector}` })
        assert.ok(nodeId, selector)
        return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts
      }
      const heading = await fontsFor('h1')
      const latin = await fontsFor('[data-font-prose="latin"]')
      const cjk = await fontsFor('[data-font-prose="cjk"]')
      const frame = page.locator(`${prefix} .slide-frame`)
      const geometry = await frame.evaluate(frame => {
        const content = frame.querySelector('.slide-frame__content')
        return { x: content.scrollWidth - content.clientWidth, y: content.scrollHeight - content.clientHeight,
          headingWeight: getComputedStyle(frame.querySelector('h1')).fontWeight,
          cjkHeadingWeight: getComputedStyle(frame.querySelector('h1 [lang]') ?? frame.querySelector('h1')).fontWeight,
          headingSize: getComputedStyle(frame.querySelector('h1')).fontSize }
      })
      records.push({ slide, heading, latin, cjk, geometry })
      await frame.screenshot({ path: resolve(output, `slide-${slide}.png`) })
      // CDP exposes Noto variable base-face names and Libertinus static weight names.
      const uses = (fonts, family) => fonts.some(font => font.isCustomFont
        && (font.familyName === family || ((family.startsWith('Noto ') || family === 'Libertinus Serif') && font.familyName.startsWith(`${family} `)))
        && font.glyphCount > 0)
      assert.ok(uses(heading, slide <= 2 ? 'Libertinus Serif' : 'Inter'), `slide ${slide}: use the preset's display or reading face`)
      assert.ok(uses(heading, slide <= 2 ? 'Noto Serif SC' : 'Noto Sans SC'), `slide ${slide}: Chinese headings need the matching loaded face`)
      assert.equal(geometry.headingWeight, slide === 1 ? '700' : '600', 'headlines use an explicitly loaded weight')
      assert.equal(geometry.cjkHeadingWeight, slide <= 3 ? '700' : '600', 'CJK display receives the projection weight')
      if (slide > 3) assert.equal(geometry.headingSize, '40px')
      assert.ok(uses(latin, 'Inter'), JSON.stringify(records.at(-1)))
      assert.ok(uses(cjk, 'Noto Sans SC'), JSON.stringify(records.at(-1)))
      assert.ok(geometry.x <= 1 && geometry.y <= 1, `slide ${slide}: typography fits the canvas`)
    }
  } finally {
    await writeFile(resolve(output, 'fonts.json'), `${JSON.stringify(records, null, 2)}\n`)
    await browser.close()
    await server.close()
  }
})
