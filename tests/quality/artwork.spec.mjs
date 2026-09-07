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

test('artwork selection, custom sources, empty covers, and motion work in actual slides', {
  timeout: 240_000,
}, async (t) => {
  let server
  let browser
  const output = resolve(qualityArtifactRoot, 'screenshots/artwork')
  await mkdir(output, { recursive: true })
  let baseUrl = process.env.QUALITY_ARTWORK_URL || readQualityBuildContext()?.['artwork-gallery']?.baseUrl
  if (!baseUrl) {
    const outDir = resolve(qualityArtifactRoot, 'build/artwork')
    await buildDeck({ id: 'artwork', outDir, source: resolve(repositoryRoot, 'fixtures/artwork-gallery.md') })
    server = await startStaticServer(outDir)
    baseUrl = server.baseUrl
  }
  const cases = [
    ['ict', 'flow'], ['ict', 'field'], ['ict', 'dots'], ['ict', 'lattice'],
    ['default', 'folds'], ['ucas', 'orbits'], ['default', 'flow'], ['ucas', 'dots'],
    ['ict', 'custom'], ['ict', 'custom'], ['ucas', 'none'], ['ict', 'none'],
    ['ict', 'none'], ['ict', 'field'], ['ict', 'dots'],
  ]
  const report = []
  try {
    browser = await chromium.launch({ headless: true })
    for (const width of [980, 720]) {
      for (const mode of ['light', 'dark']) {
        await t.test(`${width}px ${mode}: all motifs and cover configurations`, async () => {
          const page = await browser.newPage({ viewport: { width, height: Math.round(width * 9 / 16) }, reducedMotion: 'reduce' })
          const errors = []
          page.on('pageerror', error => {
            if (!error.message.includes('Wake Lock permission request denied')) errors.push(error.message)
          })
          try {
            for (const [index, [preset, type]] of cases.entries()) {
              const slide = index + 1
              if (width === 720 && ![1, 2, 3, 9, 10, 11, 13, 14, 15].includes(slide)) continue
              await waitForSlide(page, baseUrl, slide, mode)
              const frame = page.locator(`.slidev-page-${slide} .slide-frame`)
              await frame.waitFor({ state: 'visible' })
              assert.equal(await frame.getAttribute('data-presentation-preset'), preset)
              assert.equal(await frame.getAttribute('data-presentation-artwork'), type)
              const artwork = frame.locator('.preset-artwork')
              assert.equal(await artwork.count(), type === 'none' ? 0 : 1)
              const geometry = await frame.evaluate(frame => {
                const content = frame.querySelector('.slide-frame__content')
                const cover = frame.querySelector('.slide-cover')
                return {
                  overflowY: content.scrollHeight - content.clientHeight,
                  overflowX: content.scrollWidth - content.clientWidth,
                  coverWidth: cover?.getBoundingClientRect().width,
                  contentWidth: content.getBoundingClientRect().width,
                  coverClientWidth: cover?.clientWidth,
                  contentClientWidth: content.clientWidth,
                }
              })
              assert.ok(geometry.overflowY <= 1 && geometry.overflowX <= 1, JSON.stringify({ slide, geometry }))
              // Compare content boxes: the stable scrollbar gutter is intentionally reserved.
              if (type === 'none' && slide !== 13) assert.ok(Math.abs(geometry.coverClientWidth - geometry.contentClientWidth) <= 1, JSON.stringify({ slide, geometry }))
              if (preset === 'ucas') {
                assert.equal(await frame.locator('.slide-frame__ucas-rail-brand').count(), 1)
                assert.equal(await frame.locator('.slide-frame__ucas-watermark').count(), type === 'orbits' ? 1 : 0)
              }
              if (type !== 'none') assert.equal(await artwork.getAttribute('aria-hidden'), 'true')
              if (type === 'custom') {
                const visibleImage = frame.locator('.preset-artwork__image:visible')
                assert.equal(await visibleImage.count(), 1)
                assert.match(await visibleImage.getAttribute('src'), new RegExp(`artwork-${mode}\\.svg$`))
                assert.equal(await visibleImage.getAttribute('alt'), '')
                assert.equal(await visibleImage.evaluate(image => image.naturalWidth), 400)
                assert.equal(await visibleImage.evaluate(image => getComputedStyle(image).objectFit), slide === 9 ? 'contain' : 'cover')
                assert.equal(await artwork.evaluate(element => getComputedStyle(element).opacity), slide === 9 ? '0.85' : '0.5')
              }
              if (slide === 13) assert.equal(await frame.locator('.slide-cover__visual img:visible').count(), 1)
              if ([1, 2, 3, 9, 11].includes(slide)) {
                await page.evaluate(axe.source)
                const result = await page.evaluate(async selector => window.axe.run(selector, {
                  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
                }), `.slidev-page-${slide} .slidev-layout`)
                assert.deepEqual(result.violations, [], `slide ${slide}: accessibility`)
              }
              await frame.screenshot({ path: resolve(output, `${width}-${mode}-${String(slide).padStart(2, '0')}.png`) })
              report.push({ width, mode, slide, preset, type, ...geometry })
            }
            assert.deepEqual(errors, [])
          } finally { await page.close() }
        })
      }
    }

    await t.test('custom images switch with the theme and fall back when one source fails', async () => {
      const page = await browser.newPage({ reducedMotion: 'reduce' })
      try {
        await waitForSlide(page, baseUrl, 9, 'light')
        const images = page.locator('.slidev-page-9 .preset-artwork__image:visible')
        await page.evaluate(() => document.documentElement.classList.add('dark'))
        assert.match(await images.getAttribute('src'), /artwork-dark\.svg$/)
        await page.evaluate(() => document.documentElement.classList.remove('dark'))
        assert.match(await images.getAttribute('src'), /artwork-light\.svg$/)
        await page.route('**/author-fixtures/artwork-dark.svg', route => route.abort())
        await waitForSlide(page, baseUrl, 9, 'dark')
        assert.match(await images.getAttribute('src'), /artwork-light\.svg$/)
        await page.route('**/author-fixtures/artwork-light.svg', route => route.abort())
        await waitForSlide(page, baseUrl, 9, 'light')
        assert.equal(await page.locator('.slidev-page-9 .preset-artwork__image').count(), 0)
        assert.equal(await page.locator('.slidev-page-9 h1').innerText(), 'Your work, your visual.')
      } finally { await page.close() }
    })

    await t.test('new motifs animate only on active slides and are static in reduced motion and print', async () => {
      const page = await browser.newPage({ reducedMotion: 'no-preference' })
      try {
        for (const slide of [1, 2, 3, 4, 9]) {
          await page.goto(`${baseUrl}/${slide}`, { waitUntil: 'domcontentloaded' })
          const frame = page.locator(`.slidev-page-${slide} .slide-frame[data-presentation-motion="active"]`)
          await frame.waitFor({ state: 'visible' })
          const artwork = frame.locator('.preset-artwork')
          assert.equal(await artwork.evaluate(el => getComputedStyle(el).animationName), 'presentation-artwork')
          assert.equal(await artwork.evaluate(el => getComputedStyle(el).animationIterationCount), '1')
          if ([1, 2, 4].includes(slide)) {
            const names = await artwork.locator('path, circle').evaluateAll(elements => elements.map(el => getComputedStyle(el).animationName))
            assert.ok(names.includes('presentation-draw'), `slide ${slide}: vector lines draw on entry`)
          }
          await page.emulateMedia({ reducedMotion: 'reduce' })
          assert.equal(await artwork.evaluate(el => getComputedStyle(el).animationName), 'none')
          await page.emulateMedia({ reducedMotion: 'no-preference', media: 'print' })
          assert.equal(await artwork.evaluate(el => getComputedStyle(el).animationName), 'none')
          await page.emulateMedia({ media: 'screen' })
        }
      } finally { await page.close() }
    })
  } finally {
    await writeFile(resolve(output, 'review.json'), JSON.stringify(report, null, 2))
    await browser?.close()
    await server?.close()
  }
})
