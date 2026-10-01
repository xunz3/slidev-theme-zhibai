import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import { buildDeck, qualityArtifactRoot, repositoryRoot, startStaticServer, waitForSlide } from './helpers.mjs'

test('code language and media treatments preserve authored meaning', { timeout: 240_000 }, async () => {
  const outDir = resolve(qualityArtifactRoot, 'build/media-treatments')
  const output = resolve(qualityArtifactRoot, 'screenshots/media-treatments')
  await mkdir(output, { recursive: true })
  await buildDeck({ id: 'media-treatments', outDir, source: resolve(repositoryRoot, 'fixtures/media-treatments.md') })
  const server = await startStaticServer(outDir)
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'reduce' })
    for (const mode of ['light', 'dark']) {
      for (let slide = 1; slide <= 5; slide++) {
        await waitForSlide(page, server.baseUrl, slide, mode)
        const frame = page.locator(`.slidev-page-${slide} .slide-frame`)
        await frame.screenshot({ path: resolve(output, `${mode}-${slide}.png`) })
        const state = await frame.evaluate(frame => {
          const content = frame.querySelector('.slide-frame__content')
          return { x: content.scrollWidth - content.clientWidth, y: content.scrollHeight - content.clientHeight }
        })
        assert.ok(state.x <= 1 && state.y <= 1, `${mode} slide ${slide}: material examples fit`)
        if (slide === 1) {
          const codes = await frame.locator('pre').evaluateAll(elements => elements.map(el => ({
            language: el.dataset.language,
            label: getComputedStyle(el, '::before').content,
            text: el.textContent,
          })))
          assert.equal(codes.length, 4)
          assert.deepEqual(codes.slice(0, 3).map(code => code.language), ['javascript', 'typescript', 'python'])
          for (const code of codes.slice(0, 3)) assert.ok(code.label.includes(code.language))
          assert.ok(!codes[3].language, 'untyped fences must not invent a language')
          assert.ok(codes[0].text.includes('samples.map(read)'), 'labels leave code content intact')
        } else {
          assert.equal(await frame.locator('img').evaluateAll(images => images.every(img => img.naturalWidth > 0)), true)
          if (slide === 2) {
            assert.deepEqual(await frame.locator('.presentation-media').evaluateAll(figures => figures.map(fig => fig.dataset.mediaTreatment)), ['plain', 'framed'])
            assert.equal(await frame.locator('figcaption').first().innerText(), 'A plain research figure.')
            assert.equal(await frame.locator('figcaption [aria-hidden="true"]').count(), 2, 'decorative numbering does not rewrite caption text')
          }
          if (slide === 3 || slide === 5) {
            const bleed = await frame.locator('[data-media-treatment="bleed"]').evaluate(fig => {
              const bounds = fig.getBoundingClientRect()
              const canvas = fig.closest('.slide-frame').getBoundingClientRect()
              return { width: bounds.width, height: bounds.height, canvasWidth: canvas.width, canvasHeight: canvas.height }
            })
            assert.ok(bleed.width >= bleed.canvasWidth - 1 && bleed.height >= bleed.canvasHeight - 1, 'bleed spans the canvas')
            assert.equal(await frame.locator('[data-media-treatment="bleed"] img').evaluate(img => getComputedStyle(img).objectFit), 'cover', 'the rendered image must fill its canvas, not only its wrapper')
            const veil = await frame.locator('[data-media-treatment="bleed"]').evaluate(fig => getComputedStyle(fig, '::after').backgroundImage)
            assert.ok(veil.includes('0.88'), 'the reading zone has a mode-aware veil above arbitrary image colors')
            const explicitContain = await frame.locator('[data-media-treatment="bleed"] .presentation-media__viewport').evaluate(viewport => {
              viewport.dataset.mediaFit = 'contain'
              const fit = getComputedStyle(viewport.querySelector('img')).objectFit
              viewport.dataset.mediaFit = 'cover'
              return fit
            })
            assert.equal(explicitContain, 'contain', 'an explicit fit continues to override the bleed default')
            assert.equal(await frame.locator('h1').innerText(), slide === 3 ? 'A figure can set the scene.' : 'A setting for the argument')
          }
          if (slide === 4) {
            assert.equal(await frame.locator('[data-caption-numbered="custom"] figcaption').innerText(), 'Fig. S2 — Supplementary experiment.')
            assert.equal(await frame.locator('[data-caption-numbered="custom"] figcaption [aria-hidden="true"]').count(), 0)
          }
        }
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
})
