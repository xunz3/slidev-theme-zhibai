import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import {
  buildDeck, qualityArtifactRoot, repositoryRoot, startStaticServer, waitForSlide,
} from './helpers.mjs'

// Covers, chapters, content, closings, centered covers, and statements must all
// respect the preset paper canvas, even in a deck mixing all three presets.
test('Zhubai keeps preset paper canvases and readable dark canvases across presets', {
  timeout: 240_000,
}, async (t) => {
  const output = resolve(qualityArtifactRoot, 'screenshots/veil-design')
  const outDir = resolve(qualityArtifactRoot, 'build/veil-design')
  await mkdir(output, { recursive: true })
  let browser
  let server
  const report = []
  try {
    let baseUrl = process.env.QUALITY_VEIL_DESIGN_URL
    if (!baseUrl) {
      await buildDeck({
        id: 'veil-design', outDir,
        source: resolve(repositoryRoot, 'fixtures/preset-design.md'),
      })
      server = await startStaticServer(outDir)
      baseUrl = server.baseUrl
    }
    browser = await chromium.launch({ headless: true })
    for (const mode of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width: 980, height: 552 }, reducedMotion: 'reduce',
      })
      try {
        for (let slide = 1; slide <= 18; slide += 1) {
          await t.test(`${mode} slide ${slide}`, async () => {
            await waitForSlide(page, baseUrl, slide, mode)
            const frame = page.locator(`.slidev-page-${slide} .slide-frame`)
            for (let click = 0; click < 10 && await frame.locator('.slidev-vclick-hidden').count(); click += 1) {
              await page.keyboard.press('ArrowRight')
              await page.waitForTimeout(40)
            }
            await frame.screenshot({ path: resolve(output, `${mode}-${String(slide).padStart(2, '0')}.png`) })
            const state = await frame.evaluate(frame => {
              const style = getComputedStyle(frame)
              const content = frame.querySelector('.slide-frame__content')
              return {
                preset: frame.dataset.presentationPreset,
                background: style.backgroundColor,
                outerBackground: getComputedStyle(frame.closest('.slidev-layout')).backgroundColor,
                text: style.color,
                overflowX: content.scrollWidth - content.clientWidth,
                overflowY: content.scrollHeight - content.clientHeight,
                failedImages: [...frame.querySelectorAll('img')]
                  .filter(image => getComputedStyle(image).display !== 'none' && !image.naturalWidth)
                  .map(image => image.getAttribute('src')),
              }
            })
            report.push({ mode, slide, ...state })
            assert.equal(state.overflowX, 0, 'content must fit horizontally')
            assert.ok(state.overflowY <= 1, 'design examples must fit vertically')
            assert.deepEqual(state.failedImages, [], 'institutional and example assets must load')
            if (mode === 'light') {
              const paper = { zhubai: 'rgb(250, 248, 243)', ucas: 'rgb(249, 250, 252)', ict: 'rgb(247, 249, 251)' }[state.preset]
              assert.equal(state.outerBackground, paper, 'the selected preset owns its paper tint')
              assert.ok([paper, 'rgba(0, 0, 0, 0)'].includes(state.background),
                `light frame must preserve its paper canvas, got ${state.background}`)
            } else {
              assert.notEqual(state.outerBackground, 'rgb(255, 255, 255)', 'dark slides must retain their dark palette')
              assert.notEqual(state.text, state.outerBackground, 'dark text must differ from its canvas')
            }
          })
        }
      } finally {
        await page.close()
      }
    }
  } finally {
    await writeFile(resolve(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
    await browser?.close()
    await server?.close()
  }
})
