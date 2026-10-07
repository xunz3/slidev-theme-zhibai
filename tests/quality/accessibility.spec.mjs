import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import axe from 'axe-core'
import { chromium } from 'playwright-chromium'
import {
  generateExpandedContentBuilds,
  generatePresetMatrixBuilds,
  qualityArtifactRoot,
  readQualityBuildContext,
  startStaticServer,
  waitForSlide,
} from './helpers.mjs'

const presets = ['zhubai', 'ucas', 'ict']
const modes = ['light', 'dark']
const layoutSlides = {
  default: { marker: 'invalid-inputs', slide: 6 },
  cover: { marker: 'layout-cover', slide: 8 },
  intro: { marker: 'layout-intro', slide: 9 },
  section: { marker: 'layout-section', slide: 10 },
  toc: { marker: 'layout-toc', slide: 11 },
  center: { marker: 'layout-center', slide: 12 },
  'two-cols': { marker: 'layout-two-cols', slide: 13 },
  statement: { marker: 'layout-statement', slide: 14 },
  quote: { marker: 'layout-quote', slide: 15 },
  figure: { marker: 'layout-figure', slide: 16 },
  references: { marker: 'layout-references', slide: 17 },
}

const serializeError = error => ({
  message: error.message,
  name: error.name,
  stack: error.stack,
})

const createFallbackContext = async () => {
  const [matrixBuilds, expandedBuilds] = await Promise.all([
    generatePresetMatrixBuilds(),
    generateExpandedContentBuilds(),
  ])
  const builds = [
    ...matrixBuilds.map(build => ({
      ...build,
      id: `matrix-${build.preset}`,
    })),
    ...expandedBuilds,
  ]
  const servers = await Promise.all(
    builds.map(build => startStaticServer(build.outDir)),
  )
  return {
    builds: Object.fromEntries(builds.map((build, index) => [
      build.id,
      { ...build, baseUrl: servers[index].baseUrl },
    ])),
    close: () => Promise.all(servers.map(server => server.close())),
  }
}

const pageState = async (page, marker) => page.evaluate((qualityMarker) => {
  const markedCanvas = qualityMarker
    ? document.querySelector(`[data-quality-case="${qualityMarker}"]`)
      ?.closest('.slidev-layout')
    : null
  const visibleCanvas = [...document.querySelectorAll('.slidev-layout')]
    .find((element) => {
      const rect = element.getBoundingClientRect()
      return rect.right > 0
        && rect.bottom > 0
        && rect.left < innerWidth
        && rect.top < innerHeight
    })
  const canvas = markedCanvas ?? visibleCanvas
  const frame = canvas?.querySelector('.slide-frame')
  const content = canvas?.querySelector('.slide-frame__content')
  if (!(canvas instanceof HTMLElement)
    || !(frame instanceof HTMLElement)
    || !(content instanceof HTMLElement)) {
    throw new Error('Current slide has no shared canvas/frame/content hierarchy')
  }

  const bounds = (element) => {
    const style = getComputedStyle(element)
    return {
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    }
  }
  const accessibleName = (element) => (
    element.getAttribute('aria-label')
    || element.getAttribute('title')
    || element.textContent
    || ''
  ).trim()
  const images = [...canvas.querySelectorAll('img')].map(image => ({
    alt: image.getAttribute('alt'),
    ariaHidden: image.getAttribute('aria-hidden'),
    complete: image.complete,
    naturalHeight: image.naturalHeight,
    naturalWidth: image.naturalWidth,
    src: image.currentSrc || image.src,
  }))
  const focusables = [...canvas.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )]
    .filter((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return !element.matches(':disabled')
        && element.tabIndex >= 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 0
        && rect.height > 0
    })
    .map(element => ({
      name: accessibleName(element),
      tagName: element.tagName.toLowerCase(),
    }))

  return {
    bounds: {
      canvas: bounds(canvas),
      content: bounds(content),
      frame: bounds(frame),
    },
    focusables,
    headings: [...canvas.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(element => getComputedStyle(element).display !== 'none')
      .map(element => ({
        level: Number(element.tagName.slice(1)),
        text: element.textContent?.trim() ?? '',
      })),
    images,
    landmarkCount: canvas.querySelectorAll('main').length,
    preset: canvas.dataset.presentationPreset ?? null,
  }
}, marker)

const assertNoOverflow = (caseId, state) => {
  for (const [surface, bounds] of Object.entries(state.bounds)) {
    if (surface === 'frame'
      && ['hidden', 'clip'].includes(bounds.overflowX)
      && ['hidden', 'clip'].includes(bounds.overflowY)) {
      continue
    }
    assert.ok(
      bounds.scrollWidth <= bounds.clientWidth + 1,
      `${caseId}: ${surface} horizontal overflow ${JSON.stringify(bounds)}`,
    )
    assert.ok(
      bounds.scrollHeight <= bounds.clientHeight + 1,
      `${caseId}: ${surface} vertical overflow ${JSON.stringify(bounds)}`,
    )
  }
}

const assertSemantics = (caseId, state) => {
  assert.equal(state.landmarkCount, 1, `${caseId}: expected one main landmark`)
  for (const heading of state.headings) {
    assert.ok(heading.text, `${caseId}: empty h${heading.level}`)
  }
  for (const control of state.focusables) {
    assert.ok(
      control.name,
      `${caseId}: unnamed focusable ${control.tagName}`,
    )
  }
  for (const image of state.images) {
    assert.equal(image.complete, true, `${caseId}: incomplete image ${image.src}`)
    assert.ok(image.naturalWidth > 0, `${caseId}: broken image ${image.src}`)
    assert.ok(image.naturalHeight > 0, `${caseId}: broken image ${image.src}`)
    if (image.ariaHidden === 'true') {
      assert.equal(image.alt, '', `${caseId}: decorative image needs empty alt`)
    } else {
      assert.ok(image.alt?.trim(), `${caseId}: meaningful image needs an alt name`)
    }
  }
}

const runAxe = async (page, marker) => {
  await page.addScriptTag({ content: axe.source })
  return page.evaluate(async (qualityMarker) => {
    const markedCanvas = qualityMarker
      ? document.querySelector(`[data-quality-case="${qualityMarker}"]`)
        ?.closest('.slidev-layout')
      : null
    const visibleCanvas = [...document.querySelectorAll('.slidev-layout')]
      .find((element) => {
        const rect = element.getBoundingClientRect()
        return rect.right > 0
          && rect.bottom > 0
          && rect.left < innerWidth
          && rect.top < innerHeight
      })
    const canvas = markedCanvas ?? visibleCanvas
    if (!canvas) throw new Error('Axe root canvas is missing')
    return window.axe.run(canvas, {
      resultTypes: ['violations', 'incomplete'],
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
    })
  }, marker)
}

const inspectScenario = async ({
  axeDirectory,
  baseUrl,
  browserContext,
  caseId,
  marker,
  mode,
  preset,
  slide,
  viewport,
}) => {
  const page = await browserContext.newPage()
  if (viewport) await page.setViewportSize(viewport)
  const runtimeErrors = []
  const ignoredRuntimeEvents = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const location = message.location()
    const sourceUrl = location.url
    if (sourceUrl) {
      const url = new URL(sourceUrl)
      if (url.hostname !== '127.0.0.1') {
        ignoredRuntimeEvents.push(
          `external console: ${message.text()} (${sourceUrl})`,
        )
        return
      }
    }
    runtimeErrors.push(
      `console: ${message.text()}${sourceUrl ? ` (${sourceUrl})` : ''}`,
    )
  })
  page.on('pageerror', (error) => {
    if (error.message === 'Wake Lock permission request denied') {
      ignoredRuntimeEvents.push(`pageerror: ${error.message}`)
      return
    }
    runtimeErrors.push(`pageerror: ${error.message}`)
  })
  page.on('requestfailed', (request) => {
    const url = new URL(request.url())
    if (url.hostname === '127.0.0.1') {
      runtimeErrors.push(
        `requestfailed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
      )
    }
  })

  try {
    await waitForSlide(page, baseUrl, slide, mode, marker)
    const state = await pageState(page, marker)
    const axeResult = await runAxe(page, marker)
    const seriousViolations = axeResult.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical',
    )
    const evidence = {
      caseId,
      ignoredRuntimeEvents,
      mode,
      preset,
      runtimeErrors,
      seriousViolations,
      slide,
      state,
      violations: axeResult.violations,
    }
    const evidencePath = resolve(axeDirectory, `${caseId}.json`)
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)

    assert.equal(state.preset, preset, `${caseId}: resolved preset`)
    assertNoOverflow(caseId, state)
    assertSemantics(caseId, state)
    assert.deepEqual(runtimeErrors, [], `${caseId}: browser runtime errors`)
    assert.deepEqual(
      seriousViolations,
      [],
      `${caseId}: serious/critical Axe findings; evidence: ${evidencePath}`,
    )
    return { page, state }
  } catch (error) {
    error.message = `${caseId}: ${error.message}`
    await page.close()
    throw error
  }
}

const assertSequenceAccessibility = async ({
  caseId,
  itemCount,
  kind,
  page,
  slide,
}) => {
  const selector = `.slidev-page-${slide} .presentation-${kind}`
  const sequence = page.locator(selector)
  assert.equal(await sequence.count(), 1, `${caseId}: sequence root`)
  assert.equal(
    await sequence.locator('[role], [tabindex]').count(),
    0,
    `${caseId}: decorative sequence controls`,
  )
  const state = await sequence.evaluate((root) => {
    const list = root.querySelector(':scope > ol')
    if (!list) return { itemCount: 0, list: null, items: [] }
    const items = [...list.querySelectorAll(':scope > li')].map((item) => {
      const style = getComputedStyle(item)
      const rect = item.getBoundingClientRect()
      return {
        after: getComputedStyle(item, '::after').content,
        before: getComputedStyle(item, '::before').content,
        borderLeftWidth: style.borderLeftWidth,
        clientWidth: item.clientWidth,
        listStyleType: style.listStyleType,
        rectWidth: rect.width,
        scrollWidth: item.scrollWidth,
      }
    })
    return {
      itemCount: items.length,
      items,
      list: {
        role: list.getAttribute('role'),
        tagName: list.tagName.toLowerCase(),
      },
    }
  })
  assert.equal(state.itemCount, itemCount, `${caseId}: item count`)
  if (itemCount === 0) {
    assert.equal(state.list, null, `${caseId}: zero-item list`)
    return
  }
  assert.deepEqual(
    state.list,
    { role: null, tagName: 'ol' },
    `${caseId}: ordered-list semantics`,
  )
  assert.ok(state.items.every(item => (
    item.listStyleType === 'none'
    && item.before !== 'none'
    && item.scrollWidth <= item.clientWidth + 1
    && item.rectWidth > 0
  )), `${caseId}: node semantics/overflow ${JSON.stringify(state)}`)
  assert.equal(
    state.items.filter(item => item.after !== 'none').length,
    Math.max(0, itemCount - 1),
    `${caseId}: adjacent connectors`,
  )
  assert.equal(
    state.items.at(-1).after,
    'none',
    `${caseId}: orphan final connector`,
  )
  if (kind === 'timeline') {
    assert.ok(
      state.items.every(item => item.borderLeftWidth === '0px'),
      `${caseId}: doubled Timeline rail ${JSON.stringify(state)}`,
    )
  }
}

test('WCAG, layout, image, console, and interaction contract', {
  concurrency: 3,
  timeout: 240_000,
}, async (t) => {
  const focus = process.env.PRESENTATION_ACCESSIBILITY_FOCUS?.trim() ?? ''
  const isFocusedCase = caseId => !focus || caseId.includes(focus)
  const externalContext = readQualityBuildContext()
  const fallback = externalContext ? null : await createFallbackContext()
  const builds = externalContext ?? fallback.builds
  for (const id of [
    'matrix-zhubai',
    'matrix-ucas',
    'matrix-ict',
    'expanded-zhubai',
    'expanded-ucas',
    'expanded-ict',
  ]) {
    assert.ok(builds[id], `quality build context is missing ${id}`)
  }

  const axeDirectory = resolve(qualityArtifactRoot, 'axe')
  await mkdir(axeDirectory, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-font-subpixel-positioning',
      '--disable-lcd-text',
      '--font-render-hinting=none',
    ],
  })
  const browserContext = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  await browserContext.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') await route.continue()
    else {
      await route.fulfill({
        body: '',
        contentType: 'text/plain',
        status: 204,
      })
    }
  })
  const subtests = []

  try {
    for (const preset of presets) {
      const baseUrl = builds[`matrix-${preset}`].baseUrl
      for (const mode of modes) {
        for (const [layout, definition] of Object.entries(layoutSlides)) {
          const caseId = `${preset}-${layout}-${mode}`
          if (!isFocusedCase(caseId)) continue
          subtests.push(t.test(caseId, async () => {
            const result = await inspectScenario({
              axeDirectory,
              baseUrl,
              browserContext,
              caseId,
              marker: definition.marker,
              mode,
              preset,
              slide: definition.slide,
            })
            await result.page.close()
          }))
        }
      }
    }

    const us1Scenarios = [
      {
        family: 'info',
        marker: 'us1-callouts-info',
        name: 'callout-info',
        slide: 3,
      },
      {
        family: 'positive',
        marker: 'us1-callouts-positive',
        name: 'callout-positive',
        slide: 4,
      },
      {
        family: 'caution',
        marker: 'us1-callouts-caution',
        name: 'callout-caution',
        slide: 5,
      },
      {
        family: 'danger',
        marker: 'us1-callouts-danger',
        name: 'callout-danger',
        slide: 6,
      },
      {
        family: 'question',
        marker: 'us1-callouts-question',
        name: 'callout-question',
        slide: 7,
      },
      {
        family: 'quotation',
        marker: 'us1-callouts-quotation',
        name: 'callout-quotation',
        slide: 8,
      },
      {
        marker: 'us1-callout-fallbacks',
        name: 'callout-rich-long-bilingual',
        slide: 9,
      },
      {
        marker: 'visual-callout-authored-compact',
        name: 'callout-authored-compact',
        slide: 52,
      },
      {
        marker: 'visual-links-authors',
        name: 'links-authors',
        slide: 53,
      },
      {
        marker: 'visual-badge-matrix',
        name: 'badge-matrix',
        slide: 54,
      },
      {
        marker: 'us1-figures-alternatives',
        name: 'figure-alternatives',
        slide: 11,
      },
      {
        marker: 'us1-authors-mixed',
        name: 'authors-email',
        slide: 13,
      },
      {
        marker: 'us2-end-minimal',
        name: 'coherent-closing-minimal',
        slide: 14,
      },
      {
        marker: 'us2-closing-metadata',
        name: 'coherent-closing-rich',
        slide: 16,
      },
      {
        marker: 'us2-closing-failed-logo',
        name: 'coherent-closing-failed',
        slide: 18,
      },
      {
        marker: 'us2-image-left',
        name: 'us2-image-left',
        slide: 20,
      },
      {
        marker: 'us2-image-right',
        name: 'us2-image-right',
        slide: 21,
      },
      {
        marker: 'us2-image-bilingual',
        name: 'us2-image-bilingual',
        slide: 25,
      },
      {
        marker: 'visual-media-figure-fits',
        name: 'visual-media-figure-fits',
        slide: 45,
      },
      {
        marker: 'visual-image-left-contain',
        name: 'visual-image-left-contain',
        slide: 46,
      },
      {
        marker: 'visual-image-right-contain',
        name: 'visual-image-right-contain',
        slide: 48,
      },
      {
        marker: 'visual-closing-logo-wide',
        name: 'visual-closing-logo-wide',
        slide: 50,
      },
      {
        marker: 'visual-closing-logo-tall',
        name: 'visual-closing-logo-tall',
        slide: 51,
      },
      {
        marker: 'us3-accent-local-a',
        name: 'us3-accent-local-a',
        slide: 26,
      },
      {
        marker: 'us3-accent-unaccented',
        name: 'us3-accent-unaccented',
        slide: 27,
      },
      {
        marker: 'us3-accent-local-b',
        name: 'us3-accent-local-b',
        slide: 30,
      },
      {
        marker: 'us4-code-titled',
        name: 'us4-code-titled',
        slide: 32,
      },
      {
        marker: 'us4-code-titleless',
        name: 'us4-code-titleless',
        slide: 33,
      },
      {
        itemCount: 0,
        marker: 'us4-steps-zero',
        name: 'sequence-steps-zero',
        sequenceKind: 'steps',
        slide: 34,
      },
      {
        itemCount: 1,
        marker: 'us4-steps-one',
        name: 'sequence-steps-one',
        sequenceKind: 'steps',
        slide: 35,
      },
      {
        itemCount: 4,
        marker: 'us4-steps-many',
        name: 'sequence-steps-many',
        sequenceKind: 'steps',
        slide: 36,
      },
      {
        itemCount: 0,
        marker: 'us4-timeline-zero',
        name: 'sequence-timeline-zero',
        sequenceKind: 'timeline',
        slide: 37,
      },
      {
        itemCount: 1,
        marker: 'us4-timeline-one',
        name: 'sequence-timeline-one',
        sequenceKind: 'timeline',
        slide: 38,
      },
      {
        itemCount: 4,
        marker: 'us4-timeline-many',
        name: 'sequence-timeline-many',
        sequenceKind: 'timeline',
        slide: 39,
      },
      {
        itemCount: 6,
        marker: 'visual-sequences-custom',
        name: 'sequence-custom',
        sequenceKind: 'combined',
        slide: 55,
      },
      {
        marker: 'us4-status-labels',
        name: 'us4-status-labels',
        slide: 40,
      },
      {
        marker: 'us4-keyboard',
        name: 'us4-keyboard',
        slide: 41,
      },
      {
        marker: 'us5-tasks-native',
        name: 'us5-tasks-native',
        slide: 42,
      },
      {
        marker: 'us5-tasks-generated',
        name: 'us5-tasks-generated',
        slide: 43,
      },
      {
        marker: 'us5-highlights',
        name: 'us5-highlights',
        slide: 44,
      },
      {
        marker: 'visual-chrome-safe-zone',
        name: 'coherent-chrome',
        slide: 56,
      },
      {
        marker: 'visual-bilingual-heading',
        name: 'coherent-bilingual',
        slide: 57,
      },
      {
        marker: 'visual-brand-collision',
        name: 'coherent-brand-collision',
        slide: 58,
      },
      {
        marker: 'visual-section-header',
        name: 'coherent-section-header',
        slide: 61,
      },
    ]
    for (const preset of presets) {
      const baseUrl = builds[`expanded-${preset}`].baseUrl
      for (const mode of modes) {
        for (const definition of us1Scenarios) {
          const caseId = `${preset}-us1-${definition.name}-${mode}`
          if (!isFocusedCase(caseId)) continue
          subtests.push(t.test(caseId, async () => {
            const result = await inspectScenario({
              axeDirectory,
              baseUrl,
              browserContext,
              caseId,
              marker: definition.marker,
              mode,
              preset,
              slide: definition.slide,
            })
            if (definition.name.startsWith('callout-')) {
              const callouts = result.page.locator(
                `.slidev-page-${definition.slide} .presentation-callout`,
              )
              const cues = await callouts.evaluateAll(elements => elements.map(
                (callout) => {
                  const title = callout.querySelector(
                    '.presentation-callout__title',
                  )
                  const content = callout.querySelector(
                    '.presentation-callout__content',
                  )
                  const calloutStyle = getComputedStyle(callout)
                  const titleStyle = getComputedStyle(title)
                  const markerStyle = getComputedStyle(title, '::before')
                  const markerWidth = Number.parseFloat(markerStyle.width)
                  const markerHeight = Number.parseFloat(markerStyle.height)
                  const markerBorder = Number.parseFloat(
                    markerStyle.borderTopWidth,
                  )
                  const transparentMarker = markerStyle.backgroundColor
                    === 'rgba(0, 0, 0, 0)'
                  const markerShape = markerStyle.clipPath !== 'none'
                    ? 'triangle'
                    : markerBorder > 0 && transparentMarker
                      ? 'ring'
                      : markerWidth < markerHeight * 0.6
                        ? 'bar'
                        : markerStyle.transform !== 'none'
                          ? 'diamond'
                          : Number.parseFloat(markerStyle.borderRadius) <= 2
                            ? 'square'
                            : 'circle'
                  return {
                    labelled: callout.getAttribute('aria-labelledby')
                      === title?.id,
                    markerColor: callout.dataset.calloutFamily === 'question'
                      ? markerStyle.borderTopColor
                      : markerStyle.backgroundColor,
                    markerHeight,
                    markerShape,
                    markerWidth,
                    order: [
                      ...callout.children,
                    ].map(child => child.className),
                    role: callout.getAttribute('role'),
                    surfaceColor: calloutStyle.backgroundColor,
                    titleColor: titleStyle.color,
                    titleTransform: titleStyle.textTransform,
                    contentAfterTitle: Boolean(
                      title && content
                      && (title.compareDocumentPosition(content)
                        & Node.DOCUMENT_POSITION_FOLLOWING),
                    ),
                  }
                },
              ))
              assert.ok(cues.length > 0)
              assert.ok(cues.every(cue => cue.labelled && cue.role === 'note'))
              assert.ok(cues.every(cue => cue.contentAfterTitle))
              assert.ok(cues.every(cue => cue.titleTransform === 'none'))
              assert.ok(cues.every(cue => (
                cue.markerHeight > 0
                && cue.markerWidth > 0
                && cue.markerColor !== cue.surfaceColor
                && cue.titleColor !== cue.surfaceColor
              )))
              if (definition.family) {
                const expectedShape = {
                  caution: 'triangle',
                  danger: 'square',
                  info: 'circle',
                  positive: 'diamond',
                  question: 'ring',
                  quotation: 'bar',
                }[definition.family]
                assert.ok(cues.every(cue => cue.markerShape === expectedShape))
              }
            }
            if (definition.name === 'figure-alternatives') {
              const alternatives = await result.page.locator(
                `[data-quality-case="${definition.marker}"] > .presentation-media`,
              ).evaluateAll(figures => figures.map((figure) => {
                const image = figure.querySelector('img')
                return {
                  alt: image?.getAttribute('alt') ?? null,
                  fallback: figure.querySelector(
                    '.presentation-media__fallback',
                  )?.textContent?.trim() ?? null,
                }
              }))
              assert.deepEqual(
                alternatives.map(item => item.alt),
                [
                  'Zhibai card connected to a presentation',
                  'Caption supplies the omitted alternative.',
                  '',
                  null,
                  null,
                ],
              )
              assert.ok(alternatives[3].fallback)
              assert.ok(alternatives[4].fallback)
            }
            if (definition.name === 'authors-email') {
              const email = result.page.locator(
                '.presentation-author a[href^="mailto:"]',
              ).first()
              await email.focus()
              const focus = await email.evaluate((element) => {
                const style = getComputedStyle(element)
                return {
                  outlineStyle: style.outlineStyle,
                  outlineWidth: style.outlineWidth,
                }
              })
              assert.notEqual(focus.outlineStyle, 'none')
              assert.notEqual(focus.outlineWidth, '0px')
            }
            if (definition.name === 'links-authors') {
              const links = result.page.locator(
                `.slidev-page-${definition.slide} a[href]`,
              )
              assert.ok(await links.count() >= 6)
              for (let index = 0; index < await links.count(); index += 1) {
                const link = links.nth(index)
                await link.focus()
                const style = await link.evaluate((element) => {
                  const computed = getComputedStyle(element)
                  return {
                    borderBottomWidth: computed.borderBottomWidth,
                    outlineStyle: computed.outlineStyle,
                    outlineWidth: computed.outlineWidth,
                    textDecorationLine: computed.textDecorationLine,
                  }
                })
                assert.equal(style.borderBottomWidth, '0px')
                assert.match(style.textDecorationLine, /\bunderline\b/)
                assert.notEqual(style.outlineStyle, 'none')
                assert.notEqual(style.outlineWidth, '0px')
              }
              const cards = await result.page.locator(
                `.slidev-page-${definition.slide} .presentation-author`,
              ).evaluateAll(elements => elements.map((card) => {
                const values = [...card.querySelectorAll(
                  '.presentation-author__primary, .presentation-author__institution, .presentation-author__email',
                )].map(element => element.textContent?.trim() ?? '')
                return {
                  mailtoCount: card.querySelectorAll('a[href^="mailto:"]').length,
                  uniqueValues: new Set(values).size,
                  values,
                }
              }))
              assert.equal(cards.length, 9)
              assert.ok(cards.every(card => (
                card.values.length === card.uniqueValues
                && card.mailtoCount <= 1
              )))
              assert.deepEqual(
                cards.map(card => card.values[0]),
                [
                  'Ada Lovelace',
                  'Grace Hopper',
                  'Institute for Reproducible Research',
                  'contributor@example.org',
                  'not-an-email',
                  'Equal Value',
                  'Duplicate Fields',
                  'Intentional Duplicate',
                  'Intentional Duplicate',
                ],
              )
            }
            if (definition.name === 'coherent-closing-rich') {
              const contact = result.page.locator(
                '.presentation-closing__contact[href^="mailto:"]',
              )
              await contact.focus()
              const style = await contact.evaluate((element) => {
                const computed = getComputedStyle(element)
                return {
                  outlineStyle: computed.outlineStyle,
                  outlineWidth: computed.outlineWidth,
                }
              })
              assert.notEqual(style.outlineStyle, 'none')
              assert.notEqual(style.outlineWidth, '0px')
            }
            if (definition.name.startsWith('coherent-closing-')) {
              const closing = result.page.locator(
                `.slidev-page-${definition.slide} .presentation-closing`,
              )
              const expectedState = definition.name === 'coherent-closing-minimal'
                ? 'minimal'
                : 'rich'
              assert.equal(
                await closing.getAttribute('data-closing-state'),
                expectedState,
              )
              assert.ok(
                (await closing.getAttribute('class'))
                  .includes(`presentation-closing--${expectedState}`),
              )
              if (definition.name === 'coherent-closing-minimal') {
                assert.deepEqual(
                  await closing.locator(':scope > *').evaluateAll(
                    elements => elements.map(element => element.className),
                  ),
                  ['presentation-closing__message'],
                )
              } else {
                assert.equal(
                  await closing.locator(
                    '.presentation-closing-logo:is(a, button), .presentation-closing-logo [tabindex]',
                  ).count(),
                  0,
                )
                const sourceOrder = await closing.locator(
                  ':scope > *',
                ).evaluateAll(elements => elements.map(
                  element => element.className,
                ))
                assert.deepEqual(
                  sourceOrder.map(className => (
                    className.split(/\s+/).find(value => (
                      value.startsWith('presentation-closing__')
                    ))
                  )),
                  definition.name === 'coherent-closing-rich'
                    ? [
                        'presentation-closing__message',
                        'presentation-closing__contact',
                        'presentation-closing__authors',
                        'presentation-closing__logo',
                      ]
                    : [
                        'presentation-closing__message',
                        'presentation-closing__contact',
                        'presentation-closing__logo',
                      ],
                )
              }
            }
            if (definition.name.startsWith('us2-image-')) {
              assert.deepEqual(
                await result.page.locator(
                  `.slidev-page-${definition.slide} .presentation-image-text`,
                )
                  .evaluate(root => [...root.children].map(
                    element => element.className,
                  )),
                [
                  'presentation-image-text__narrative',
                  'presentation-media presentation-media--image presentation-media--treatment-plain presentation-image-text__figure',
                ],
              )
            }
            if (definition.name.startsWith('visual-image-')
              || definition.name === 'visual-media-figure-fits') {
              const figures = result.page.locator(
                `.slidev-page-${definition.slide} .presentation-media`,
              )
              assert.ok(await figures.count() > 0)
              assert.ok(await figures.evaluateAll(elements => elements.every(
                element => ['contain', 'cover'].includes(
                  element.getAttribute('data-media-fit'),
                ),
              )))
            }
            if (definition.name.startsWith('visual-closing-logo-')) {
              const logo = result.page.locator(
                `.slidev-page-${definition.slide} .presentation-closing-logo`,
              )
              assert.equal(await logo.count(), 1)
              assert.equal(await logo.locator('[role="img"] img').count(), 0)
              assert.equal(
                await result.page.locator(
                  `.slidev-page-${definition.slide} .presentation-closing__logo.presentation-media`,
                ).count(),
                0,
              )
            }
            if (definition.name === 'us4-status-labels') {
              const labels = result.page.locator(
                `.slidev-page-${definition.slide} :is(.presentation-tag, .presentation-badge)`,
              )
              assert.equal(await labels.count(), 4)
              assert.equal(await labels.locator('[role], [tabindex]').count(), 0)
            }
            if (definition.name === 'badge-matrix') {
              const badges = result.page.locator(
                `.slidev-page-${definition.slide} .presentation-badge`,
              )
              assert.equal(await badges.count(), 16)
              assert.equal(
                await badges.locator('[role], [tabindex]').count(),
                0,
              )
              const markers = badges.locator('.presentation-badge__marker')
              assert.equal(await markers.count(), 4)
              assert.ok(await markers.evaluateAll(elements => elements.every(
                marker => marker.getAttribute('aria-hidden') === 'true',
              )))
              assert.ok(await badges.evaluateAll(elements => elements.every(
                badge => badge.scrollWidth <= badge.clientWidth + 1,
              )))
            }
            if (definition.name === 'us4-keyboard') {
              const keys = result.page.locator(
                `.slidev-page-${definition.slide} :is(.presentation-kbd--single, .presentation-kbd-sequence, .presentation-kbd-key)`,
              )
              assert.ok(await keys.count() > 0)
              assert.equal(await keys.locator('[tabindex]').count(), 0)
              assert.equal(
                await result.page.locator(
                  `.slidev-page-${definition.slide} button`,
                ).count(),
                0,
              )
            }
            if (definition.name.startsWith('sequence-')) {
              if (definition.sequenceKind === 'combined') {
                await assertSequenceAccessibility({
                  caseId,
                  itemCount: 3,
                  kind: 'steps',
                  page: result.page,
                  slide: definition.slide,
                })
                await assertSequenceAccessibility({
                  caseId,
                  itemCount: 3,
                  kind: 'timeline',
                  page: result.page,
                  slide: definition.slide,
                })
              } else {
                await assertSequenceAccessibility({
                  caseId,
                  itemCount: definition.itemCount,
                  kind: definition.sequenceKind,
                  page: result.page,
                  slide: definition.slide,
                })
              }
            }
            if (definition.name.startsWith('us5-tasks-')) {
              const tasks = result.page.locator(
                `.slidev-page-${definition.slide} input[type="checkbox"]`,
              )
              assert.ok(await tasks.count() > 0)
              assert.ok(await tasks.evaluateAll(inputs => inputs.every(
                input => input.disabled
                  && input.tabIndex === -1
                  && input.dataset.presentationTask === 'true',
              )))
              assert.equal(
                result.state.focusables.filter(
                  item => item.tagName === 'input',
                ).length,
                0,
              )
              const cues = await tasks.evaluateAll(inputs => inputs.map(
                (input) => {
                  const item = input.closest('li')
                  const itemStyle = getComputedStyle(item)
                  return {
                    checked: input.checked,
                    checkedCue: item
                      ? getComputedStyle(item, '::after').content
                      : 'none',
                    emptyCue: item
                      ? getComputedStyle(item, '::before').borderStyle
                      : 'none',
                    fontWeight: Number.parseInt(itemStyle.fontWeight, 10),
                  }
                },
              ))
              assert.ok(cues.every(cue => cue.emptyCue !== 'none'))
              assert.ok(cues.filter(cue => cue.checked)
                .every(cue => cue.checkedCue !== 'none'))
              assert.ok(cues.filter(cue => cue.checked)
                .every(cue => cue.fontWeight <= 400))
              assert.ok(cues.filter(cue => !cue.checked)
                .every(cue => cue.fontWeight >= 600))
            }
            if (definition.name === 'us5-highlights') {
              const proseHighlights = result.page.locator(
                `.slidev-page-${definition.slide} [data-highlight-case]`,
              )
              assert.equal(await proseHighlights.count(), 2)
              assert.ok(await proseHighlights.evaluateAll(elements => (
                elements.every((element) => {
                  const style = getComputedStyle(element)
                  return style.borderWidth === '0px'
                    && style.borderRadius === '2px'
                    && style.textDecorationLine === 'underline'
                    && style.textDecorationThickness === '1.5px'
                    && style.boxShadow === 'none'
                    && element.tabIndex < 0
                })
              )))
              const codeHighlights = result.page.locator(
                `.slidev-page-${definition.slide} [data-highlight-code-scope] mark`,
              )
              assert.ok(await codeHighlights.evaluateAll(elements => (
                elements.every((element) => {
                  const style = getComputedStyle(element)
                  return style.backgroundColor === 'rgba(0, 0, 0, 0)'
                    && style.borderWidth === '0px'
                    && style.borderRadius === '0px'
                    && style.boxShadow === 'none'
                    && style.padding === '0px'
                })
              )))
            }
            if (definition.name === 'coherent-bilingual') {
              const separators = await result.page.locator(
                `.slidev-page-${definition.slide} [data-quality-case="visual-bilingual-heading"] :is(h1, h2)`,
              ).evaluateAll(headings => headings.flatMap((heading) => {
                const walker = document.createTreeWalker(
                  heading,
                  NodeFilter.SHOW_TEXT,
                )
                const values = []
                let node
                while ((node = walker.nextNode())) {
                  for (
                    let index = node.data.indexOf('·');
                    index >= 0;
                    index = node.data.indexOf('·', index + 1)
                  ) {
                    values.push(node.data[index - 1])
                  }
                }
                return values
              }))
              assert.ok(separators.length >= 2)
              assert.ok(separators.every(value => value === '\u00a0'))
            }
            if (definition.name === 'coherent-brand-collision') {
              const brandState = await result.page.locator(
                `.slidev-page-${definition.slide} .slide-frame`,
              ).evaluate((frame) => {
                const visible = (element) => {
                  if (!element) return false
                  const style = getComputedStyle(element)
                  const rect = element.getBoundingClientRect()
                  return style.display !== 'none'
                    && style.visibility !== 'hidden'
                    && rect.width > 0
                    && rect.height > 0
                }
                const rect = (element) => {
                  const bounds = element.getBoundingClientRect()
                  return {
                    bottom: bounds.bottom,
                    left: bounds.left,
                    right: bounds.right,
                    top: bounds.top,
                  }
                }
                const overlaps = (left, right) => !(
                  left.right <= right.left
                  || left.left >= right.right
                  || left.bottom <= right.top
                  || left.top >= right.bottom
                )
                const mark = [...frame.querySelectorAll(
                  '.slide-frame__ucas-wordmark, .slide-frame__ict-lockup',
                )].find(visible)
                if (!mark) return { collisions: [], markPresent: false }
                const markRect = rect(mark)
                return {
                  collisions: [...frame.querySelectorAll(
                    '[data-quality-case="visual-brand-collision"] :is(h1, figure, figcaption, a, button)',
                  )]
                    .filter(visible)
                    .filter(element => overlaps(markRect, rect(element)))
                    .map(element => element.tagName.toLowerCase()),
                  markPresent: true,
                }
              })
              assert.equal(brandState.markPresent, preset !== 'zhubai')
              assert.deepEqual(brandState.collisions, [])
            }
            if (definition.name === 'coherent-section-header') {
              const brandState = await result.page.locator(
                `.slidev-page-${definition.slide} .slide-frame`,
              ).evaluate((frame) => ({
                headerCount: frame.querySelectorAll(
                  '.slide-frame__header',
                ).length,
                identityImageCount: frame.querySelectorAll(
                  'img[class*="slide-frame__ucas"], img[class*="slide-frame__ict"]',
                ).length,
                lockupCount: frame.querySelectorAll(
                  '.slide-frame__ucas-wordmark, .slide-frame__ict-lockup--section',
                ).length,
              }))
              assert.equal(brandState.headerCount, 0)
              assert.equal(brandState.lockupCount, preset === 'zhubai' ? 0 : 1)
              assert.equal(
                brandState.identityImageCount,
                preset === 'zhubai' ? 0 : 1,
              )
            }
            await result.page.close()
          }))
        }
      }
    }

    for (const preset of presets) {
      for (const mode of modes) {
        for (const definition of [
          {
            marker: 'visual-media-figure-fits',
            name: 'media',
            slide: 45,
          },
          {
            marker: 'visual-image-left-contain',
            name: 'image-left',
            slide: 46,
          },
          {
            marker: 'visual-closing-logo-wide',
            name: 'closing-wide',
            slide: 50,
          },
          {
            marker: 'us2-end-minimal',
            name: 'coherent-closing-minimal',
            slide: 14,
          },
          {
            marker: 'us2-closing-metadata',
            name: 'coherent-closing-rich',
            slide: 16,
          },
          {
            marker: 'visual-bilingual-heading',
            name: 'coherent-bilingual',
            slide: 57,
          },
          {
            marker: 'visual-brand-collision',
            name: 'coherent-brand-collision',
            slide: 58,
          },
          {
            marker: 'visual-section-header',
            name: 'coherent-section-header',
            slide: 61,
          },
          {
            itemCount: 4,
            marker: 'us4-steps-many',
            name: 'sequence-steps-many',
            sequenceKind: 'steps',
            slide: 36,
          },
          {
            itemCount: 4,
            marker: 'us4-timeline-many',
            name: 'sequence-timeline-many',
            sequenceKind: 'timeline',
            slide: 39,
          },
        ]) {
          const compactCaseId = `${preset}-compact-${definition.name}-${mode}`
          if (!isFocusedCase(compactCaseId)) continue
          subtests.push(t.test(compactCaseId, async () => {
            const result = await inspectScenario({
              axeDirectory,
              baseUrl: builds[`expanded-${preset}`].baseUrl,
              browserContext,
              caseId: compactCaseId,
              marker: definition.marker,
              mode,
              preset,
              slide: definition.slide,
              viewport: { height: 405, width: 720 },
            })
            if (definition.name.startsWith('sequence-')) {
              await assertSequenceAccessibility({
                caseId: compactCaseId,
                itemCount: definition.itemCount,
                kind: definition.sequenceKind,
                page: result.page,
                slide: definition.slide,
              })
            }
            if (definition.name.startsWith('coherent-closing-')) {
              const expectedState = definition.name.endsWith('-minimal')
                ? 'minimal'
                : 'rich'
              assert.equal(
                await result.page.locator(
                  `.slidev-page-${definition.slide} .presentation-closing`,
                ).getAttribute('data-closing-state'),
                expectedState,
              )
            }
            if (definition.name === 'coherent-bilingual') {
              assert.ok(await result.page.locator(
                `.slidev-page-${definition.slide} [data-quality-case="visual-bilingual-heading"] :is(h1, h2)`,
              ).evaluateAll(headings => headings.every(
                heading => heading.textContent.includes('\u00a0· '),
              )))
            }
            if (definition.name === 'coherent-brand-collision') {
              const brandState = await result.page.locator(
                `.slidev-page-${definition.slide} .slide-frame`,
              ).evaluate((frame) => {
                const visible = (element) => {
                  if (!element) return false
                  const style = getComputedStyle(element)
                  const rect = element.getBoundingClientRect()
                  return style.display !== 'none'
                    && style.visibility !== 'hidden'
                    && rect.width > 0
                    && rect.height > 0
                }
                const mark = [...frame.querySelectorAll(
                  '.slide-frame__ucas-wordmark, .slide-frame__ict-lockup',
                )].find(visible)
                if (!mark) return { collisionCount: 0, markPresent: false }
                const markRect = mark.getBoundingClientRect()
                return {
                  collisionCount: [...frame.querySelectorAll(
                    '[data-quality-case="visual-brand-collision"] :is(h1, figure, figcaption, a, button)',
                  )].filter((element) => {
                    if (!visible(element)) return false
                    const rect = element.getBoundingClientRect()
                    return !(
                      markRect.right <= rect.left
                      || markRect.left >= rect.right
                      || markRect.bottom <= rect.top
                      || markRect.top >= rect.bottom
                    )
                  }).length,
                  markPresent: true,
                }
              })
              assert.equal(brandState.markPresent, preset !== 'zhubai')
              assert.equal(brandState.collisionCount, 0)
            }
            if (definition.name === 'coherent-section-header') {
              const brandState = await result.page.locator(
                `.slidev-page-${definition.slide} .slide-frame`,
              ).evaluate((frame) => ({
                headerCount: frame.querySelectorAll(
                  '.slide-frame__header',
                ).length,
                identityImageCount: frame.querySelectorAll(
                  'img[class*="slide-frame__ucas"], img[class*="slide-frame__ict"]',
                ).length,
                lockupCount: frame.querySelectorAll(
                  '.slide-frame__ucas-wordmark, .slide-frame__ict-lockup--section',
                ).length,
              }))
              assert.equal(brandState.headerCount, 0)
              assert.equal(brandState.lockupCount, preset === 'zhubai' ? 0 : 1)
              assert.equal(
                brandState.identityImageCount,
                preset === 'zhubai' ? 0 : 1,
              )
            }
            await result.page.close()
          }))
        }
      }
    }

    const interactionCaseId = 'ArrowRight, TOC keyboard, Enter, click, and focus outline'
    if (isFocusedCase(interactionCaseId)) subtests.push(t.test(interactionCaseId, async () => {
      const page = await browserContext.newPage()
      const baseUrl = builds['matrix-zhubai'].baseUrl
      try {
        await waitForSlide(page, baseUrl, 2, 'light', 'baseline-zhubai')
        await page.keyboard.press('ArrowRight')
        await page.locator('[data-quality-case="local-zhubai"]').waitFor({
          state: 'attached',
        })

        await waitForSlide(page, baseUrl, 11, 'light', 'layout-toc')
        const buttons = page.locator(
          '.slide-layout-toc__button:not(.slide-layout-toc__button--static)',
        )
        assert.equal(await buttons.count(), 2)
        await page.locator('body').focus()
        let focused = false
        for (let index = 0; index < 20; index += 1) {
          await page.keyboard.press('Tab')
          focused = await page.evaluate(() => (
            document.activeElement?.classList.contains('slide-layout-toc__button')
            ?? false
          ))
          if (focused) break
        }
        assert.equal(focused, true, 'TOC button is not reachable with Tab')
        const focusStyle = await page.evaluate(() => {
          const style = getComputedStyle(document.activeElement)
          return {
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
          }
        })
        assert.notEqual(focusStyle.outlineStyle, 'none')
        assert.notEqual(focusStyle.outlineWidth, '0px')

        await page.keyboard.press('Enter')
        await page.locator('[data-quality-case="layout-center"]').waitFor({
          state: 'attached',
        })
        await waitForSlide(page, baseUrl, 11, 'light', 'layout-toc')
        await buttons.nth(1).click()
        await page.locator('[data-quality-case="layout-two-cols"]').waitFor({
          state: 'attached',
        })
      } catch (error) {
        const evidencePath = resolve(
          axeDirectory,
          'interaction-failure.json',
        )
        await writeFile(evidencePath, `${JSON.stringify({
          caseId: 'interaction-navigation',
          error: serializeError(error),
        }, null, 2)}\n`)
        error.message = `${error.message}; evidence: ${evidencePath}`
        throw error
      } finally {
        await page.close()
      }
    }))
    await Promise.allSettled(subtests)
  } finally {
    await browserContext.close()
    await browser.close()
    await fallback?.close()
  }
})
