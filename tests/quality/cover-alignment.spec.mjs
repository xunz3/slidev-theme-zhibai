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
  { preset: 'zhubai', align: 'center' },
  { preset: 'zhubai', align: 'left' },
  { preset: 'ucas', align: 'center' },
  { preset: 'ucas', align: 'left' },
  { preset: 'ict', align: 'center' },
  { preset: 'ict', align: 'left' },
  { preset: 'zhubai', align: 'center' },
  { preset: 'ucas', align: 'center' },
  { preset: 'ict', align: 'center' },
  { preset: 'zhubai', align: 'center', image: true },
  { preset: 'ict', align: 'center', footer: true },
  { preset: 'ucas', align: 'center', footer: true, header: true },
  { preset: 'zhubai', align: 'left' },
  { preset: 'ict', align: null, section: true },
  { preset: 'zhubai', align: 'center' },
  { preset: 'zhubai', align: 'left' },
  { preset: 'zhubai', align: 'center' },
  { preset: 'ucas', align: 'center' },
  { preset: 'ucas', align: 'center', footer: true, header: true, dense: true },
  { preset: 'ucas', align: 'center', footer: true, header: true, dense: false },
  { preset: 'zhubai', align: 'center' },
  { preset: 'ucas', align: 'center' },
  { preset: 'ict', align: 'center' },
  { preset: 'ict', align: null, section: true },
  { preset: 'ict', align: null, closing: 'minimal' },
  { preset: 'ict', align: null, closing: 'rich' },
]

test('cover alignment and native imagery compose across palettes, imagery, and chrome', {
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
              await t.test(`slide ${slide}: ${expected.preset}, ${expected.align ?? expected.closing ?? 'section'}`, async () => {
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
                    brand: frame.querySelector('.slide-frame__ucas-rail-brand, .slide-frame__ict-lockup'),
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
                    contentClientWidth: content.clientWidth - parseFloat(getComputedStyle(content).paddingLeft) - parseFloat(getComputedStyle(content).paddingRight),
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
                }
                assert.equal(await frame.locator('.slide-frame__header').count(), expected.header ? 1 : 0)
                assert.equal(await frame.locator('.slide-frame__footer').count(), expected.footer ? 1 : 0)

                assert.equal(await frame.locator('.preset-artwork').count(), 0)
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
                      'a rich closing uses the available canvas')
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
                  assert.ok(fontSizeRem >= 1.75 && fontSizeRem <= 3.8,
                    `long title remains legible while scaling down: ${fontSizeRem}rem`)
                }
                if (expected.align === 'center') {
                  for (const name of ['cover', 'authors']) {
                    near(geometry[name].centerX, geometry.frame.centerX, `${name} is centered on the slide`)
                  }
                  for (const name of ['title', 'subtitle']) {
                    near(geometry[name].centerX, expected.image ? geometry.main.centerX : geometry.frame.centerX, `${name} is centered in its text region`)
                  }
                  near(geometry.authorCenterX, geometry.frame.centerX, 'author details are centered')
                } else {
                  near(geometry.title.left, geometry.cover.left, 'left titles retain their reading axis')
                }
                near(geometry.coverClientWidth, geometry.contentClientWidth, 'cover uses the available content width')
                if (expected.image) {
                  const image = frame.locator('.slide-cover__visual img:visible')
                  assert.equal(await image.count(), 1)
                  assert.equal(await image.getAttribute('alt'), 'A landscape research figure presented between the title and author.')
                  assert.ok(geometry.main.right <= geometry.visual.left + 1, 'the visual has its own right-hand region')
                  assert.ok(geometry.visual.right <= geometry.content.right + 1, 'the visual stays inside the content area')
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
