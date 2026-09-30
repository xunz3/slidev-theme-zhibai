import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import axe from 'axe-core'
import { chromium } from 'playwright-chromium'
import {
  buildDeck,
  qualityArtifactRoot,
  readQualityBuildContext,
  repositoryRoot,
  startStaticServer,
  waitForSlide,
} from './helpers.mjs'

const cases = [
  { slide: 1, preset: 'zhubai', kind: 'image', date: 'September 2026' },
  { slide: 2, preset: 'zhubai', kind: 'slot', date: 'Slot composition' },
  { slide: 3, preset: 'zhubai', kind: 'empty', date: 'September 2026' },
  { slide: 4, preset: 'zhubai', kind: 'long', date: 'September 2026' },
  { slide: 5, preset: 'ucas', kind: 'empty', date: 'September 2026' },
  { slide: 6, preset: 'ucas', kind: 'long', date: 'September 2026' },
  { slide: 7, preset: 'ucas', kind: 'image', date: 'September 2026' },
  { slide: 8, preset: 'ict', kind: 'empty', date: 'September 2026' },
  { slide: 9, preset: 'ict', kind: 'long', date: 'September 2026' },
  { slide: 10, preset: 'ict', kind: 'slot', date: 'September 2026' },
  { slide: 11, preset: 'ict', kind: 'fallback', date: 'September 2026' },
  { slide: 12, preset: 'zhubai', kind: 'markdown-title', date: 'September 2026' },
]

const rectanglesOverlap = (left, right) => (
  Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1
  && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1
)

test('cover composition supports authored visuals, text-only covers, and long titles', {
  timeout: 240_000,
}, async (t) => {
  const output = resolve(qualityArtifactRoot, 'screenshots/cover-composition')
  await mkdir(output, { recursive: true })

  let server
  let browser
  let baseUrl = process.env.QUALITY_COVER_COMPOSITION_URL
    || readQualityBuildContext()?.['cover-composition']?.baseUrl
  const report = []

  try {
    if (!baseUrl) {
      const outDir = resolve(qualityArtifactRoot, 'build/cover-composition')
      await buildDeck({
        id: 'cover-composition',
        outDir,
        source: resolve(repositoryRoot, 'fixtures/cover-composition.md'),
      })
      server = await startStaticServer(outDir)
      baseUrl = server.baseUrl
    }

    browser = await chromium.launch({ headless: true })
    for (const width of [980, 720]) {
      for (const mode of ['light', 'dark']) {
        await t.test(`${width}px ${mode}: all cover compositions`, async (tViewport) => {
          const page = await browser.newPage({
            viewport: { width, height: Math.round(width * 9 / 16) },
            reducedMotion: 'reduce',
          })
          const pageErrors = []
          page.on('pageerror', error => {
            if (!error.message.includes('Wake Lock permission request denied')) {
              pageErrors.push(error.message)
            }
          })

          try {
            for (const item of cases) {
              await tViewport.test(`slide ${item.slide} · ${item.preset} · ${item.kind}`, async () => {
                await waitForSlide(page, baseUrl, item.slide, mode)
                const layout = page.locator(`.slidev-page-${item.slide} .slidev-layout`)
                const frame = layout.locator('.slide-frame')
                const cover = frame.locator('.slide-cover')
                assert.equal(await frame.getAttribute('data-presentation-preset'), item.preset)

                const state = await cover.evaluate((cover) => {
                  const frame = cover.closest('.slide-frame')
                  const content = frame.querySelector('.slide-frame__content')
                  const main = cover.querySelector('.slide-cover__main')
                  const visual = cover.querySelector('.slide-cover__visual')
                  const meta = cover.querySelector('.slide-cover__meta')
                  const rect = element => {
                    if (!element) return null
                    const box = element.getBoundingClientRect()
                    return {
                      left: box.left,
                      top: box.top,
                      right: box.right,
                      bottom: box.bottom,
                      width: box.width,
                      height: box.height,
                    }
                  }
                  const visible = element => Boolean(element)
                    && getComputedStyle(element).display !== 'none'
                    && getComputedStyle(element).visibility !== 'hidden'
                    && Number(getComputedStyle(element).opacity) > 0
                  const visibleHeadings = [...cover.querySelectorAll('h1')].filter(visible)
                  const heading = visibleHeadings[0]
                  const subtitle = cover.querySelector('.slide-cover__subtitle')
                  const paragraph = cover.querySelector('.slide-cover__body p')
                  const image = visual?.querySelector('img')
                  const contentBox = content.getBoundingClientRect()
                  return {
                    classes: cover.className,
                    main: rect(main),
                    visual: rect(visual),
                    meta: rect(meta),
                    contentWidth: contentBox.width,
                    overflowX: content.scrollWidth - content.clientWidth,
                    overflowY: content.scrollHeight - content.clientHeight,
                    visibleHeadings: visibleHeadings.map(heading => heading.innerText.trim()),
                    headingEmphasis: heading?.querySelector('em')?.textContent ?? null,
                    headingBeforeSubtitle: Boolean(heading && subtitle
                      && (heading.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING)),
                    subtitleBeforeBody: Boolean(subtitle && paragraph
                      && (subtitle.compareDocumentPosition(paragraph) & Node.DOCUMENT_POSITION_FOLLOWING)),
                    heading: rect(heading),
                    subtitle: rect(subtitle),
                    paragraph: rect(paragraph),
                    slot: visual?.querySelector('[data-visual-slot]')?.getAttribute('data-visual-slot') ?? null,
                    figureCount: visual?.querySelectorAll('.presentation-media').length ?? 0,
                    image: image
                      ? {
                          alt: image.getAttribute('alt'),
                          complete: image.complete,
                          naturalWidth: image.naturalWidth,
                          src: image.getAttribute('src'),
                        }
                      : null,
                    fallback: visual?.querySelector('.presentation-media__fallback')?.getAttribute('aria-label') ?? null,
                    mediaState: visual?.querySelector('.presentation-media')?.getAttribute('data-media-state') ?? null,
                    date: meta?.querySelector('.slide-cover__date')?.textContent.trim() ?? null,
                  }
                })

                report.push({ width, mode, ...item, ...state })
                await frame.screenshot({
                  path: resolve(output, `${width}-${mode}-${String(item.slide).padStart(2, '0')}.png`),
                })

                assert.ok(state.main, 'cover retains its main text region')
                assert.ok(state.overflowX <= 1, JSON.stringify(state))
                assert.ok(state.overflowY <= 1, JSON.stringify(state))

                if (item.kind === 'empty') {
                  assert.equal(state.visual, null, 'text-only covers do not create an empty visual column')
                  assert.ok(state.main.width >= state.contentWidth * 0.8, JSON.stringify(state))
                }
                if (item.kind === 'long') {
                  assert.match(state.classes, /slide-cover--long-title/)
                }
                if (item.kind === 'image') {
                  assert.ok(state.visual)
                  assert.ok(state.image?.complete && state.image.naturalWidth > 0, JSON.stringify(state.image))
                  assert.ok(state.image.alt.length > 10, 'frontmatter image has meaningful alternative text')
                  assert.equal(state.figureCount, 1)
                }
                if (item.kind === 'slot') {
                  assert.ok(state.visual)
                  assert.ok(state.slot, 'native visual slot content is rendered')
                  assert.equal(state.figureCount, 0, 'slot takes precedence over frontmatter image')
                  assert.equal(state.image, null)
                }
                if (item.kind === 'fallback') {
                  assert.equal(state.mediaState, 'failed')
                  assert.equal(state.fallback, 'Missing calibration plot showing the confidence estimate over time.')
                }
                if (item.kind === 'markdown-title') {
                  assert.deepEqual(state.visibleHeadings, [
                    'A Markdown heading remains the single cover headline',
                  ])
                  assert.equal(state.headingEmphasis, 'single', 'preserve authored inline markup')
                  assert.equal(state.headingBeforeSubtitle, true, 'headline precedes subtitle in DOM reading order')
                  assert.equal(state.subtitleBeforeBody, true, 'subtitle precedes ordinary cover prose')
                  assert.ok(state.heading.bottom <= state.subtitle.top + 1, 'subtitle follows the headline visually')
                  assert.ok(state.subtitle.bottom <= state.paragraph.top + 1, 'body follows the subtitle visually')
                }
                if (state.visual && state.meta) {
                  assert.equal(rectanglesOverlap(state.main, state.visual), false, 'headline and visual never overlap')
                  assert.equal(rectanglesOverlap(state.visual, state.meta), false, 'visual and author/date baseline never overlap')
                }
                if (state.meta) {
                  assert.equal(rectanglesOverlap(state.main, state.meta), false, 'headline and author/date baseline never overlap')
                }
                assert.equal(state.date, item.date)

                if (width === 980) {
                  await page.evaluate(axe.source)
                  const accessibility = await page.evaluate(selector => window.axe.run(selector, {
                    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
                  }), `.slidev-page-${item.slide} .slidev-layout`)
                  assert.deepEqual(accessibility.violations, [], `slide ${item.slide} accessibility`)
                }

              })
            }
            assert.deepEqual(pageErrors, [])
          } finally {
            await page.close()
          }
        })
      }
    }
  } finally {
    await writeFile(resolve(output, 'review.json'), `${JSON.stringify(report, null, 2)}\n`)
    await browser?.close()
    await server?.close()
  }
})
