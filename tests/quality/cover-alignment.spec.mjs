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

const cases = [
  { preset: 'default', align: 'center', type: 'folds', placement: 'bottom' },
  { preset: 'default', align: 'left', type: 'folds', placement: 'right' },
  { preset: 'ucas', align: 'center', type: 'orbits', placement: 'bottom' },
  { preset: 'ucas', align: 'left', type: 'orbits', placement: 'right' },
  { preset: 'ict', align: 'center', type: 'lattice', placement: 'bottom' },
  { preset: 'ict', align: 'left', type: 'lattice', placement: 'right' },
  { preset: 'default', align: 'center', type: 'none', placement: 'bottom' },
  { preset: 'ucas', align: 'center', type: 'custom', placement: 'bottom', wideImage: true },
  { preset: 'ict', align: 'center', type: 'custom', placement: 'background' },
  { preset: 'default', align: 'center', type: 'none', placement: 'bottom', image: true },
  { preset: 'ict', align: 'center', type: 'lattice', placement: 'bottom', footer: true },
  { preset: 'ucas', align: 'center', type: 'orbits', placement: 'bottom', footer: true, header: true },
  { preset: 'default', align: 'left', type: 'flow', placement: 'bottom' },
  { preset: 'ict', align: null, type: 'lattice', placement: 'right', section: true },
  { preset: 'default', align: 'center', type: 'dots', placement: 'bottom' },
  { preset: 'default', align: 'left', type: 'custom', placement: 'right' },
  { preset: 'default', align: 'center', type: 'field', placement: 'background' },
  { preset: 'ucas', align: 'center', type: 'flow', placement: 'background' },
  { preset: 'ucas', align: 'center', type: 'orbits', placement: 'bottom', footer: true, header: true, dense: true },
  { preset: 'ucas', align: 'center', type: 'orbits', placement: 'bottom', footer: true, header: true, dense: false },
  { preset: 'default', align: 'center', type: 'folds', placement: 'right' },
  { preset: 'ucas', align: 'center', type: 'orbits', placement: 'right' },
  { preset: 'ict', align: 'center', type: 'lattice', placement: 'right' },
  { preset: 'ict', align: null, type: 'lattice', placement: 'bottom', section: true },
  { preset: 'ict', align: null, type: 'lattice', placement: 'bottom', closing: 'minimal' },
  { preset: 'ict', align: null, type: 'none', placement: 'right', closing: 'rich' },
]

test('cover alignment and artwork placement compose across palettes, imagery, and chrome', {
  timeout: 240_000,
}, async (t) => {
  let browser
  let server
  const output = resolve(qualityArtifactRoot, 'screenshots/cover-alignment')
  await mkdir(output, { recursive: true })
  let baseUrl = process.env.QUALITY_COVER_ALIGNMENT_URL
    || readQualityBuildContext()?.['cover-alignment']?.baseUrl
  if (!baseUrl) {
    const outDir = resolve(qualityArtifactRoot, 'build/cover-alignment')
    await buildDeck({
      id: 'cover-alignment', outDir,
      source: resolve(repositoryRoot, 'fixtures/cover-alignment.md'),
    })
    server = await startStaticServer(outDir)
    baseUrl = server.baseUrl
  }
  const report = []
  const near = (actual, expected, message) => assert.ok(
    Math.abs(actual - expected) <= 1.5,
    `${message}: expected ${expected}, actual ${actual}`,
  )
  const overlaps = (a, b) => a && b
    && a.left < b.right - 1 && a.right > b.left + 1
    && a.top < b.bottom - 1 && a.bottom > b.top + 1
  try {
    browser = await chromium.launch({ headless: true })
    for (const width of [980, 720]) {
      for (const mode of ['light', 'dark']) {
        await t.test(`${width}px ${mode}`, async (t) => {
          const page = await browser.newPage({
            viewport: { width, height: Math.round(width * 9 / 16) },
            reducedMotion: 'reduce',
          })
          const errors = []
          page.on('pageerror', error => {
            if (!error.message.includes('Wake Lock permission request denied')) errors.push(error.message)
          })
          try {
            for (const [index, expected] of cases.entries()) {
              const slide = index + 1
              await t.test(`slide ${slide}: ${expected.preset}, ${expected.align ?? expected.closing ?? 'section'}, ${expected.placement}`, async () => {
                await waitForSlide(page, baseUrl, slide, mode)
                const outer = page.locator(`.slidev-page-${slide} .slidev-layout`)
                const frame = outer.locator('.slide-frame')
                await frame.waitFor({ state: 'visible' })
                const geometry = await frame.evaluate(frame => {
                  const bounds = element => {
                    if (!element) return null
                    const { left, right, top, bottom, width, height } = element.getBoundingClientRect()
                    return { left, right, top, bottom, width, height, centerX: left + width / 2 }
                  }
                  const content = frame.querySelector('.slide-frame__content')
                  const cover = frame.querySelector('.slide-cover')
                  const composition = cover || frame.querySelector('.slide-layout-section, .presentation-closing')
                  const heading = composition?.querySelector('h1')
                  const ink = []
                  if (heading) {
                    const text = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
                    while (text.nextNode()) {
                      if (!text.currentNode.textContent.trim()) continue
                      const range = document.createRange()
                      range.selectNodeContents(text.currentNode)
                      ink.push(...[...range.getClientRects()].filter(rect => rect.width && rect.height).map(rect => ({
                        left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
                        width: rect.width, height: rect.height,
                      })))
                    }
                  }
                  const measured = Object.fromEntries(Object.entries({
                    frame,
                    content,
                    cover,
                    composition,
                    main: frame.querySelector('.slide-cover__main'),
                    title: frame.querySelector('.slide-cover__title'),
                    subtitle: frame.querySelector('.slide-cover__subtitle'),
                    authors: frame.querySelector('.slide-cover__authors'),
                    artwork: frame.querySelector('.preset-artwork'),
                    brand: frame.querySelector('.slide-frame__ucas-rail-brand, .slide-frame__ict-lockup'),
                    secondaryBrand: frame.querySelector('.slide-frame__ucas-watermark'),
                    visual: frame.querySelector('.slide-cover__visual'),
                    header: frame.querySelector('.slide-frame__header'),
                    footer: frame.querySelector('.slide-frame__footer'),
                  }).map(([name, element]) => [name, bounds(element)]))
                  const authors = [...frame.querySelectorAll('.slide-cover__author')].map(bounds)
                  const authorLeft = Math.min(...authors.map(author => author.left))
                  const authorRight = Math.max(...authors.map(author => author.right))
                  return {
                    ...measured,
                    ink,
                    authorCenterX: authors.length ? (authorLeft + authorRight) / 2 : null,
                    overflowX: content.scrollWidth - content.clientWidth,
                    overflowY: content.scrollHeight - content.clientHeight,
                    coverClientWidth: cover?.clientWidth,
                    contentClientWidth: content.clientWidth,
                    textAlign: cover ? getComputedStyle(cover).textAlign : null,
                    clipped: [...frame.querySelectorAll('.slide-cover__title, .slide-cover__subtitle, .slide-cover__body, .slide-cover__author, .slide-cover__visual, .slide-layout-section > *, .presentation-closing__message, .presentation-closing__contact')]
                      .filter(element => {
                        const rect = bounds(element)
                        if (!rect.width || !rect.height) return false
                        return rect.left < measured.content.left - 1
                          || rect.right > measured.content.right + 1
                          || rect.top < measured.content.top - 1
                          || rect.bottom > measured.content.bottom + 1
                      })
                      .map(element => element.className),
                  }
                })
                const evidence = { width, mode, slide, ...expected, geometry }
                report.push(evidence)
                await frame.screenshot({ path: resolve(output, `${width}-${mode}-${String(slide).padStart(2, '0')}.png`) })

                for (const element of [outer, frame]) {
                  assert.equal(await element.getAttribute('data-presentation-preset'), expected.preset)
                  assert.equal(await element.getAttribute('data-presentation-cover-align'), expected.align)
                  assert.equal(await element.getAttribute('data-presentation-artwork-placement'), expected.placement)
                  assert.equal(await element.getAttribute('data-presentation-artwork'), expected.type)
                }
                assert.ok(geometry.overflowX <= 1 && geometry.overflowY <= 1, JSON.stringify(evidence))
                assert.deepEqual(geometry.clipped, [], 'all title, author, and supporting content stays inside its available region')
                assert.ok(geometry.composition.width > 0 && geometry.composition.height > 0, 'the main composition has a visible area')
                assert.ok(geometry.ink.length > 0, 'the main heading has visible text')
                for (const ink of geometry.ink) {
                  assert.ok(ink.left >= geometry.content.left - 1.5
                    && ink.right <= geometry.content.right + 1.5
                    && ink.top >= geometry.content.top - 1.5
                    && ink.bottom <= geometry.content.bottom + 1.5,
                  `main heading text stays inside the content region: ${JSON.stringify({ ink, content: geometry.content })}`)
                  assert.ok(!overlaps(ink, geometry.brand), 'main heading text does not overlap the institutional signature')
                  assert.ok(!overlaps(ink, geometry.secondaryBrand), 'main heading text does not overlap the secondary institutional seal')
                }
                assert.equal(await frame.locator('.slide-frame__header').count(), expected.header ? 1 : 0)
                assert.equal(await frame.locator('.slide-frame__footer').count(), expected.footer ? 1 : 0)

                const artwork = frame.locator('.preset-artwork')
                assert.equal(await artwork.count(), expected.type === 'none' ? 0 : 1)
                if (expected.type !== 'none') {
                  assert.equal(await artwork.getAttribute('aria-hidden'), 'true')
                  assert.equal(await artwork.getAttribute('data-artwork-placement'), expected.placement)
                  near(geometry.artwork.right, geometry.frame.right, 'artwork reaches the canvas edge')
                  if (expected.placement === 'right') {
                    assert.ok(geometry.artwork.left > geometry.frame.centerX, 'right artwork reserves the side of the canvas')
                  } else {
                    near(geometry.artwork.left, geometry.frame.left, 'balanced artwork spans the canvas')
                    near(geometry.artwork.centerX, geometry.frame.centerX, 'artwork is centered')
                    near(geometry.artwork.bottom, geometry.frame.bottom, 'artwork reaches the lower canvas edge')
                    if (expected.placement === 'bottom') {
                      assert.ok(geometry.artwork.top > geometry.frame.top + geometry.frame.height * 0.6, 'bottom artwork stays in the lower band')
                      assert.ok(geometry.composition.bottom <= geometry.artwork.top + 1.5, 'bottom decoration leaves space for cover, section, and closing content')
                      for (const ink of geometry.ink) {
                        assert.ok(ink.bottom <= geometry.artwork.top - 1, 'the main heading stays above the lower artwork band')
                      }
                    } else near(geometry.artwork.top, geometry.frame.top, 'background artwork covers the canvas height')
                  }
                }
                if (expected.type === 'custom') {
                  const image = artwork.locator('.preset-artwork__image:visible')
                  assert.equal(await image.count(), 1)
                  assert.match(await image.getAttribute('src'), new RegExp(`artwork-${expected.wideImage ? 'wide-' : ''}${mode}\\.svg$`))
                  assert.equal(await image.evaluate(element => element.naturalWidth), expected.wideImage ? 1000 : 400)
                  if (expected.wideImage) {
                    assert.equal(await image.evaluate(element => getComputedStyle(element).objectFit), 'contain')
                    assert.equal(await artwork.evaluate(element => getComputedStyle(element).opacity), '0.85')
                  }
                }
                if (expected.section) {
                  assert.equal(await frame.locator('.slide-layout-section').count(), 1)
                  assert.equal(await frame.locator('.slide-cover').count(), 0)
                  return
                }
                if (expected.closing) {
                  assert.equal(await frame.locator('.presentation-closing').getAttribute('data-closing-state'), expected.closing)
                  assert.equal(await frame.locator('.slide-cover').count(), 0)
                  if (expected.closing === 'rich') {
                    assert.equal(await frame.locator('.presentation-closing__contact').getAttribute('href'), 'mailto:research@example.org')
                    assert.ok(geometry.content.bottom > geometry.frame.bottom - geometry.frame.height * 0.15,
                      'a rich closing with no artwork does not reserve the lower artwork band')
                  }
                  return
                }

                assert.equal(geometry.textAlign, expected.align)
                if (expected.dense !== undefined) {
                  assert.equal(await frame.locator('.slide-cover--long-title').count(), 1)
                  assert.equal(await frame.locator('.slide-cover--dense-title').count(), expected.dense ? 1 : 0)
                  const fontSizeRem = await frame.locator('.slide-cover__title').evaluate(element => (
                    Number.parseFloat(getComputedStyle(element).fontSize)
                    / Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
                  ))
                  assert.ok(fontSizeRem <= 2.55, `long title keeps a compact type size with the header: ${fontSizeRem}rem`)
                }
                if (expected.align === 'center') {
                  assert.equal(await frame.locator('.slide-frame__ucas-watermark').count(), 0,
                    'a centered cover keeps one institutional signature, including right placement')
                  for (const name of ['cover', 'title', 'subtitle', 'authors']) {
                    near(geometry[name].centerX, geometry.frame.centerX, `${name} is centered on the slide`)
                  }
                  near(geometry.authorCenterX, geometry.frame.centerX, 'author details are centered')
                  if (geometry.brand) near(geometry.brand.centerX, geometry.frame.centerX, 'institutional branding shares the title axis')
                } else {
                  near(geometry.title.left, geometry.cover.left, 'left titles retain their reading axis')
                  if (expected.placement === 'right') {
                    assert.ok(geometry.cover.width < geometry.content.width * 0.8, 'legacy left cover preserves room for right artwork')
                  }
                }
                if (expected.align === 'center' || expected.placement !== 'right' || expected.type === 'none') {
                  near(geometry.coverClientWidth, geometry.contentClientWidth, 'cover uses the available content width')
                }
                if (expected.image) {
                  const image = frame.locator('.slide-cover__visual img:visible')
                  assert.equal(await image.count(), 1)
                  assert.equal(await image.getAttribute('alt'), 'A landscape research figure presented between the title and author.')
                  near(geometry.visual.centerX, geometry.frame.centerX, 'authored image is centered')
                  assert.ok(geometry.main.bottom <= geometry.visual.top + 1, 'title precedes the authored image')
                  assert.ok(geometry.visual.bottom <= geometry.authors.top + 1, 'authors follow the authored image')
                }
                if (width === 980 && [1, 3, 5, 10].includes(slide)) {
                  await page.evaluate(axe.source)
                  const result = await page.evaluate(async selector => window.axe.run(selector, {
                    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
                  }), `.slidev-page-${slide} .slidev-layout`)
                  assert.deepEqual(result.violations, [], 'centered cover remains accessible')
                }
              })
            }
            assert.deepEqual(errors, [], 'slides render without browser errors')
          } finally { await page.close() }
        })
      }
    }
  } finally {
    await writeFile(resolve(output, 'review.json'), JSON.stringify(report, null, 2))
    await browser?.close()
    await server?.close()
  }
})
