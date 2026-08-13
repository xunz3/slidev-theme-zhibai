import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import {
  generateExpandedContentBuilds,
  generatePresetMatrixBuilds,
  qualityArtifactRoot,
  readQualityBuildContext,
  startStaticServer,
  waitForSlide,
} from './helpers.mjs'

const presets = ['default', 'ucas', 'ict']
const modes = ['light', 'dark']
const localSlideNumber = {
  default: 3,
  ucas: 4,
  ict: 5,
}

const snapshotPage = async (page, caseId) => {
  const state = await page.evaluate((qualityCase) => {
    const marker = document.querySelector(`[data-quality-case="${qualityCase}"]`)
    const canvas = marker?.closest('.slidev-layout')
    const frame = canvas?.querySelector('.slide-frame')
    const content = frame?.querySelector('.slide-frame__content')
    if (!(canvas instanceof HTMLElement)
      || !(frame instanceof HTMLElement)
      || !(content instanceof HTMLElement)) {
      throw new Error('Shared canvas/frame hierarchy is missing')
    }
    canvas.dataset.qualityCapture = qualityCase

    const style = (selector, properties) => {
      const element = selector === '.slidev-layout' ? canvas : canvas.querySelector(selector)
      if (!(element instanceof Element)) return null
      const computed = getComputedStyle(element)
      return Object.fromEntries(properties.map(property => [property, computed.getPropertyValue(property)]))
    }
    const bounds = element => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    })
    const rect = (element) => {
      const value = element?.getBoundingClientRect()
      return value
        ? {
            height: value.height,
            left: value.left,
            top: value.top,
            width: value.width,
          }
        : null
    }
    const brandElements = [...canvas.querySelectorAll(
      '[class*="slide-frame__ucas"], [class*="slide-frame__ict"]',
    )]
    const images = [...canvas.querySelectorAll('img')].map(image => ({
      className: image.className,
      complete: image.complete,
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      rect: {
        height: image.getBoundingClientRect().height,
        left: image.getBoundingClientRect().left,
        top: image.getBoundingClientRect().top,
        width: image.getBoundingClientRect().width,
      },
      src: image.currentSrc || image.src,
    }))

    const result = {
      brandClasses: brandElements.map(element => element.className).sort(),
      canvasBounds: bounds(canvas),
      canvasRect: rect(canvas),
      canvasDensity: canvas.dataset.presentationDensity ?? null,
      canvasPreset: canvas.dataset.presentationPreset ?? null,
      caseId: qualityCase,
      contentBounds: bounds(content),
      geometry: {
        heading: rect(canvas.querySelector('h1')),
        leftPane: rect(canvas.querySelector('.slide-layout-two-cols__pane')),
        rightPane: rect(canvas.querySelectorAll('.slide-layout-two-cols__pane')[1]),
        table: rect(canvas.querySelector('table')),
      },
      loadedFonts: [...document.fonts]
        .filter(font => font.status === 'loaded')
        .map(font => `${font.family}:${font.style}:${font.weight}`)
        .sort(),
      renderContext: {
        devicePixelRatio,
        parents: [...function* ancestors(element) {
          let current = element
          while (current instanceof HTMLElement) {
            const computed = getComputedStyle(current)
            yield {
              className: current.className,
              rect: rect(current),
              transform: computed.transform,
              zoom: computed.zoom,
            }
            current = current.parentElement
          }
        }(canvas)],
        viewport: {
          height: visualViewport?.height,
          offsetLeft: visualViewport?.offsetLeft,
          offsetTop: visualViewport?.offsetTop,
          scale: visualViewport?.scale,
          width: visualViewport?.width,
        },
      },
      fingerprint: {
        callout: style('.obsidian-slidev-callout', [
          'background-color',
          'border-color',
          'border-radius',
          'color',
        ]),
        canvas: style('.slidev-layout', [
          'background-color',
          'color',
          'font-family',
          'font-size',
          'line-height',
          'padding',
        ]),
        caption: style('.obsidian-slidev-media__caption', [
          'color',
          'font-family',
          'font-size',
          'font-style',
          'letter-spacing',
        ]),
        code: style('pre', [
          'background-color',
          'border-color',
          'border-radius',
          'color',
          'font-family',
        ]),
        footer: style('.slide-frame__footer', [
          'border-color',
          'color',
          'font-family',
          'font-size',
        ]),
        frame: style('.slide-frame', [
          'background-color',
          'color',
          'padding',
        ]),
        header: style('.slide-frame__header', [
          'border-color',
          'color',
          'font-family',
          'font-size',
        ]),
        heading: style('h1', [
          'color',
          'font-family',
          'font-size',
          'font-weight',
          'letter-spacing',
          'line-height',
        ]),
        table: style('table', [
          'background-color',
          'border-collapse',
          'font-size',
        ]),
        tableHeader: style('th', [
          'background-color',
          'border-color',
          'color',
          'font-weight',
        ]),
        warning: style('.obsidian-slidev-warning', [
          'background-color',
          'border-color',
          'color',
        ]),
      },
      frameBounds: bounds(frame),
      frameDensity: frame.dataset.presentationDensity ?? null,
      framePreset: frame.dataset.presentationPreset ?? null,
      images,
    }

    return result
  }, caseId)
  await page.evaluate(() => new Promise(resolveFrame => {
    requestAnimationFrame(() => requestAnimationFrame(resolveFrame))
  }))

  const screenshot = await page.locator(`[data-quality-capture="${caseId}"]`).screenshot({
    type: 'png',
  })
  return { screenshot, state }
}

const assertNoOverflow = (name, bounds) => {
  assert.ok(
    bounds.scrollWidth <= bounds.clientWidth + 1,
    `${name} overflows horizontally: ${JSON.stringify(bounds)}`,
  )
  assert.ok(
    bounds.scrollHeight <= bounds.clientHeight + 1,
    `${name} overflows vertically: ${JSON.stringify(bounds)}`,
  )
}

const assertBrandBoundary = (preset, brandClasses) => {
  const ucas = brandClasses.filter(className => className.includes('__ucas'))
  const ict = brandClasses.filter(className => className.includes('__ict'))
  if (preset === 'default') {
    assert.equal(ucas.length, 0)
    assert.equal(ict.length, 0)
  } else if (preset === 'ucas') {
    assert.equal(ucas.length, 0, 'UCAS content slide contains top-right brand DOM')
    assert.equal(ict.length, 0, 'UCAS slide contains ICT brand DOM')
  } else {
    assert.equal(ict.length, 0, 'ICT content slide contains top-right brand DOM')
    assert.equal(ucas.length, 0, 'ICT slide contains UCAS brand DOM')
  }
}

const compareScreenshotPixels = async (page, actual, expected) => {
  return page.evaluate(async ({ actualBase64, expectedBase64 }) => {
    const decode = async (base64) => {
      const response = await fetch(`data:image/png;base64,${base64}`)
      const bitmap = await createImageBitmap(await response.blob())
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(bitmap, 0, 0)
      return {
        data: context.getImageData(0, 0, bitmap.width, bitmap.height).data,
        height: bitmap.height,
        width: bitmap.width,
      }
    }

    const [actualImage, expectedImage] = await Promise.all([
      decode(actualBase64),
      decode(expectedBase64),
    ])
    if (actualImage.width !== expectedImage.width
      || actualImage.height !== expectedImage.height) {
      return {
        actualHeight: actualImage.height,
        actualWidth: actualImage.width,
        changedPixels: Number.POSITIVE_INFINITY,
        expectedHeight: expectedImage.height,
        expectedWidth: expectedImage.width,
        maximumChannelDelta: 255,
      }
    }

    let changedPixels = 0
    let maximumChannelDelta = 0
    for (let index = 0; index < actualImage.data.length; index += 4) {
      let pixelChanged = false
      for (let channel = 0; channel < 4; channel += 1) {
        const delta = Math.abs(actualImage.data[index + channel] - expectedImage.data[index + channel])
        maximumChannelDelta = Math.max(maximumChannelDelta, delta)
        if (delta !== 0) pixelChanged = true
      }
      if (pixelChanged) changedPixels += 1
    }
    return {
      changedPixels,
      height: actualImage.height,
      maximumChannelDelta,
      width: actualImage.width,
    }
  }, {
    actualBase64: actual.toString('base64'),
    expectedBase64: expected.toString('base64'),
  })
}

test('3 × 3 × 2 public preset API is visually isolated', { timeout: 240_000 }, async (t) => {
  const externalContext = readQualityBuildContext()
  const builds = externalContext
    ? presets.map(preset => ({
        ...externalContext[`matrix-${preset}`],
        preset,
      }))
    : await generatePresetMatrixBuilds()
  const servers = externalContext
    ? []
    : await Promise.all(builds.map(build => startStaticServer(build.outDir)))
  const serverByPreset = Object.fromEntries(
    builds.map((build, index) => [
      build.preset,
      externalContext ? build : servers[index],
    ]),
  )
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-font-subpixel-positioning',
      '--disable-lcd-text',
      '--font-render-hinting=none',
    ],
  })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') await route.continue()
    else await route.abort()
  })
  const evidenceDirectory = resolve(qualityArtifactRoot, 'screenshots/preset-isolation')
  await mkdir(evidenceDirectory, { recursive: true })

  try {
    const expectedSnapshots = new Map()
    for (const targetPreset of presets) {
      for (const mode of modes) {
        const page = await context.newPage()
        const baselineCaseId = `baseline-${targetPreset}`
        await waitForSlide(
          page,
          serverByPreset[targetPreset].baseUrl,
          2,
          mode,
          baselineCaseId,
        )
        expectedSnapshots.set(
          `${targetPreset}:${mode}`,
          await snapshotPage(page, baselineCaseId),
        )
        await page.close()
      }
    }

    for (const globalPreset of presets) {
      for (const localPreset of presets) {
        for (const mode of modes) {
          const caseId = `${globalPreset}-to-${localPreset}-${mode}`
          await t.test(caseId, async () => {
            const page = await context.newPage()
            await waitForSlide(
              page,
              serverByPreset[globalPreset].baseUrl,
              localSlideNumber[localPreset],
              mode,
              `local-${localPreset}`,
            )
            const actual = await snapshotPage(page, `local-${localPreset}`)
            const expected = expectedSnapshots.get(`${localPreset}:${mode}`)
            const pixelComparison = await compareScreenshotPixels(
              page,
              actual.screenshot,
              expected.screenshot,
            )
            await page.close()

            try {
              assert.equal(actual.state.canvasPreset, localPreset, 'outer canvas preset')
              assert.equal(actual.state.framePreset, localPreset, 'inner frame preset')
              assert.equal(actual.state.canvasDensity, 'compact', 'outer canvas density')
              assert.equal(actual.state.frameDensity, 'compact', 'inner frame density')
              assert.deepEqual(actual.state.fingerprint, expected.state.fingerprint)
              assertBrandBoundary(localPreset, actual.state.brandClasses)
              assert.deepEqual(actual.state.brandClasses, expected.state.brandClasses)
              for (const image of actual.state.images) {
                assert.ok(image.complete, `Image did not complete: ${image.src}`)
                assert.ok(image.naturalWidth > 0, `Broken image: ${image.src}`)
                assert.ok(image.naturalHeight > 0, `Broken image: ${image.src}`)
                assert.ok(image.rect.width >= 0 && image.rect.height >= 0)
              }
              assertNoOverflow('canvas', actual.state.canvasBounds)
              assertNoOverflow('content', actual.state.contentBounds)
              assertNoOverflow('frame', actual.state.frameBounds)
              assert.equal(
                pixelComparison.changedPixels,
                0,
                `same-run target screenshot differs: ${JSON.stringify(pixelComparison)}`,
              )
            } catch (error) {
              const actualPath = resolve(evidenceDirectory, `${caseId}-actual.png`)
              const expectedPath = resolve(evidenceDirectory, `${caseId}-expected.png`)
              const diffPath = resolve(evidenceDirectory, `${caseId}-diff.json`)
              await Promise.all([
                writeFile(actualPath, actual.screenshot),
                writeFile(expectedPath, expected.screenshot),
                writeFile(diffPath, `${JSON.stringify({
                  actual: actual.state,
                  caseId,
                  expected: expected.state,
                  message: error.message,
                  pixelComparison,
                }, null, 2)}\n`),
              ])
              error.message = `${caseId}: ${error.message}; artifacts: ${actualPath}, ${expectedPath}, ${diffPath}`
              throw error
            }
          })
        }
      }
    }

    await t.test('two-column panes share one top alignment line', async () => {
      for (const preset of presets) {
        for (const mode of modes) {
          const page = await context.newPage()
          try {
            await waitForSlide(
              page,
              serverByPreset[preset].baseUrl,
              13,
              mode,
              'layout-two-cols',
            )
            const state = await page.locator(
              '.slidev-page-13 .slide-layout-two-cols',
            ).evaluate((root) => {
              const panes = [...root.querySelectorAll(
                '.slide-layout-two-cols__pane',
              )]
              return {
                headingTops: panes.map(pane => pane.querySelector(
                  'h1, h2, h3, h4',
                )?.getBoundingClientRect().top ?? null),
                hiddenOnlyParagraphDisplays: panes.flatMap(pane => (
                  [...pane.querySelectorAll(':scope > p:has(> [hidden]:only-child)')]
                    .map(element => getComputedStyle(element).display)
                )),
              }
            })
            assert.equal(state.headingTops.length, 2)
            assert.ok(state.headingTops.every(top => top !== null))
            assert.ok(
              Math.abs(state.headingTops[0] - state.headingTops[1]) <= 1,
              `${preset}/${mode}: ${JSON.stringify(state)}`,
            )
            assert.ok(
              state.hiddenOnlyParagraphDisplays.every(display => display === 'none'),
              `${preset}/${mode}: ${JSON.stringify(state)}`,
            )
          } finally {
            await page.close()
          }
        }
      }
    })

    await t.test('keyboard navigation and TOC activation remain operable', async () => {
      const page = await context.newPage()
      const baseUrl = serverByPreset.default.baseUrl

      await waitForSlide(page, baseUrl, 2, 'light', 'baseline-default')
      await page.keyboard.press('ArrowRight')
      await page.locator('[data-quality-case="local-default"]').waitFor({ state: 'attached' })

      await waitForSlide(page, baseUrl, 11, 'light', 'layout-toc')
      const buttons = page.locator('.slide-layout-toc__button:not(.slide-layout-toc__button--static)')
      assert.equal(await buttons.count(), 2)

      await page.locator('body').focus()
      let tabReachedToc = false
      for (let index = 0; index < 20; index += 1) {
        await page.keyboard.press('Tab')
        tabReachedToc = await page.evaluate(() => (
          document.activeElement?.classList.contains('slide-layout-toc__button') ?? false
        ))
        if (tabReachedToc) break
      }
      assert.ok(tabReachedToc, 'TOC button is not reachable by Tab')

      const outlineWidth = await page.evaluate(() => getComputedStyle(document.activeElement).outlineWidth)
      assert.notEqual(outlineWidth, '0px', 'focused TOC button has no visible outline')

      await page.keyboard.press('Enter')
      await page.locator('[data-quality-case="layout-center"]').waitFor({ state: 'attached' })

      await waitForSlide(page, baseUrl, 11, 'light', 'layout-toc')
      await buttons.nth(1).click()
      await page.locator('[data-quality-case="layout-two-cols"]').waitFor({ state: 'attached' })
      await page.close()
    })
  } finally {
    await context.close()
    await browser.close()
    await Promise.all(servers.map(server => server.close()))
  }
})

test('US3 content slides remain unbranded across local accents', {
  timeout: 240_000,
}, async (t) => {
  const externalContext = readQualityBuildContext()
  const definitions = externalContext
    ? ['ucas', 'ict'].map(preset => ({
        ...externalContext[`expanded-${preset}`],
        preset,
      }))
    : (await generateExpandedContentBuilds())
        .filter(build => build.preset !== 'default')
  const servers = externalContext
    ? []
    : await Promise.all(definitions.map(build => startStaticServer(build.outDir)))
  const buildByPreset = Object.fromEntries(definitions.map((build, index) => [
    build.preset,
    externalContext ? build : { ...build, baseUrl: servers[index].baseUrl },
  ]))
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-font-subpixel-positioning',
      '--disable-lcd-text',
      '--font-render-hinting=none',
    ],
  })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  const deckAccent = 'color-mix(in srgb, currentColor 72%, #5b4fc4)'
  const localAccent = 'color-mix(in srgb, currentColor 68%, #c2410c)'

  const capture = async ({ baseUrl, marker, mode, page, preset, slide }) => {
    await waitForSlide(page, baseUrl, slide, mode, marker)
    return {
      state: await page.evaluate((caseId) => {
        const marked = document.querySelector(`[data-quality-case="${caseId}"]`)
        const canvas = marked?.closest('.slidev-layout')
        const frame = canvas?.querySelector('.slide-frame')
        if (!(canvas instanceof HTMLElement) || !(frame instanceof HTMLElement)) {
          throw new Error(`${caseId}: branded frame is missing`)
        }
        return {
          frameAccent: frame.style
            .getPropertyValue('--presentation-accent').trim(),
          visibleIdentityCount: [
            ...canvas.querySelectorAll(
              '[class*="slide-frame__ucas"], [class*="slide-frame__ict"]',
            ),
          ].filter((candidate) => {
            const style = getComputedStyle(candidate)
            const rect = candidate.getBoundingClientRect()
            return style.display !== 'none'
              && style.visibility !== 'hidden'
              && rect.width > 0
              && rect.height > 0
          }).length,
          rootAccent: document.documentElement.style
            .getPropertyValue('--presentation-accent').trim(),
        }
      }, marker),
    }
  }

  try {
    for (const preset of ['ucas', 'ict']) {
      for (const mode of modes) {
        await t.test(`${preset}-${mode}`, async () => {
          const page = await context.newPage()
          try {
            const baseUrl = buildByPreset[preset].baseUrl
            const local = await capture({
              baseUrl,
              marker: 'us3-accent-local-a',
              mode,
              page,
              preset,
              slide: 26,
            })
            const fallback = await capture({
              baseUrl,
              marker: 'us3-accent-unaccented',
              mode,
              page,
              preset,
              slide: 27,
            })
            assert.equal(local.state.frameAccent, localAccent)
            assert.equal(fallback.state.frameAccent, deckAccent)
            assert.equal(local.state.rootAccent, '')
            assert.equal(fallback.state.rootAccent, '')
            assert.equal(local.state.visibleIdentityCount, 0)
            assert.equal(fallback.state.visibleIdentityCount, 0)
          } finally {
            await page.close()
          }
        })
      }
    }
  } finally {
    await context.close()
    await browser.close()
    await Promise.all(servers.map(server => server.close()))
  }
})
