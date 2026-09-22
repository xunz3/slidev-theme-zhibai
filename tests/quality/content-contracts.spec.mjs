import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import test, { after, describe } from 'node:test'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-chromium'
import {
  buildDeck,
  generateExpandedContentBuilds,
  qualityArtifactRoot,
  readQualityBuildContext,
  repositoryRoot,
  startStaticServer,
  waitForSlide,
} from './helpers.mjs'

export const expandedPresets = Object.freeze(['default', 'ucas', 'ict'])
export const expandedModes = Object.freeze(['light', 'dark'])
export const calloutFamilies = Object.freeze([
  {
    family: 'info',
    marker: 'us1-callouts-info',
    slide: 3,
    types: ['note', 'info', 'todo', 'abstract', 'summary'],
  },
  {
    family: 'positive',
    marker: 'us1-callouts-positive',
    slide: 4,
    types: ['tip', 'success', 'check'],
  },
  {
    family: 'caution',
    marker: 'us1-callouts-caution',
    slide: 5,
    types: ['warning', 'caution', 'attention'],
  },
  {
    family: 'danger',
    marker: 'us1-callouts-danger',
    slide: 6,
    types: ['danger', 'error', 'failure'],
  },
  {
    family: 'question',
    marker: 'us1-callouts-question',
    slide: 7,
    types: ['question', 'help', 'faq'],
  },
  {
    family: 'quotation',
    marker: 'us1-callouts-quotation',
    slide: 8,
    types: ['quote', 'cite'],
  },
])
const calloutTitles = Object.freeze({
  abstract: 'Abstract',
  attention: 'Attention',
  caution: 'Caution',
  check: 'Check',
  cite: 'Citation',
  danger: 'Danger',
  error: 'Error',
  failure: 'Failure',
  faq: 'FAQ',
  help: 'Help',
  info: 'Info',
  note: 'Note',
  question: 'Question',
  quote: 'Quote',
  success: 'Success',
  summary: 'Summary',
  tip: 'Tip',
  todo: 'To do',
  warning: 'Warning',
})

const loadTypeScript = async () => {
  try {
    return (await import('typescript')).default
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error
    const packageDirectory = (await readdir(
      resolve(repositoryRoot, 'node_modules/.pnpm'),
    ))
      .filter(name => /^typescript@[^_]+$/.test(name))
      .sort()
      .at(-1)
    if (!packageDirectory) throw error
    return (await import(pathToFileURL(resolve(
      repositoryRoot,
      'node_modules/.pnpm',
      packageDirectory,
      'node_modules/typescript/lib/typescript.js',
    )).href)).default
  }
}

const loadTypeScriptModule = async (relativePath) => {
  const ts = await loadTypeScript()
  const absolutePath = resolve(repositoryRoot, relativePath)
  const source = await readFile(absolutePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    fileName: relativePath,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  const encoded = Buffer.from(
    `${transpiled.outputText}\n//# sourceURL=${pathToFileURL(absolutePath).href}`,
  ).toString('base64')
  return import(`data:text/javascript;base64,${encoded}`)
}

let fallbackExpandedContentContextPromise

const createFallbackExpandedContentContext = async () => {
  const definitions = await generateExpandedContentBuilds()
  const servers = await Promise.all(
    definitions.map(definition => startStaticServer(definition.outDir)),
  )
  return {
    builds: Object.fromEntries(definitions.map((definition, index) => [
      definition.id,
      {
        ...definition,
        baseUrl: servers[index].baseUrl,
      },
    ])),
    close: () => Promise.all(servers.map(server => server.close())),
  }
}

export const createExpandedContentContext = async () => {
  const supplied = readQualityBuildContext()
  if (supplied) {
    for (const preset of expandedPresets) {
      assert.ok(supplied[`expanded-${preset}`], `missing expanded-${preset} build`)
    }
    return {
      builds: supplied,
      close: async () => {},
    }
  }

  fallbackExpandedContentContextPromise ??= (
    createFallbackExpandedContentContext()
  )
  const fallback = await fallbackExpandedContentContextPromise
  return {
    builds: fallback.builds,
    close: async () => {},
  }
}

after(async () => {
  if (!fallbackExpandedContentContextPromise) return
  const fallback = await fallbackExpandedContentContextPromise
  await fallback.close()
})

export const inspectBuiltCase = async ({
  baseUrl,
  caseId,
  mode = 'light',
  page,
  slide,
}) => {
  await waitForSlide(page, baseUrl, slide, mode, caseId)
  return page.evaluate((marker) => {
    const marked = document.querySelector(`[data-quality-case="${marker}"]`)
    const canvas = marked?.closest('.slidev-layout')
    if (!(marked instanceof HTMLElement) || !(canvas instanceof HTMLElement)) {
      throw new Error(`${marker}: built marker/canvas is missing`)
    }
    return {
      canvasClass: canvas.className,
      density: canvas.dataset.presentationDensity,
      markerText: marked.textContent?.trim() ?? '',
      preset: canvas.dataset.presentationPreset,
    }
  }, caseId)
}

const sampleLocatorPixels = async (page, locator) => {
  const screenshot = await locator.screenshot({ type: 'png' })
  return page.evaluate(async (base64) => {
    const response = await fetch(`data:image/png;base64,${base64}`)
    const bitmap = await createImageBitmap(await response.blob())
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(bitmap, 0, 0)
    const pixels = context.getImageData(
      0,
      0,
      bitmap.width,
      bitmap.height,
    ).data
    const pixelDigest = [...new Uint8Array(await crypto.subtle.digest(
      'SHA-256',
      pixels,
    ))].map(value => value.toString(16).padStart(2, '0')).join('')
    const pixel = (xRatio, yRatio) => {
      const x = Math.max(0, Math.min(bitmap.width - 1, Math.round(
        bitmap.width * xRatio,
      )))
      const y = Math.max(0, Math.min(bitmap.height - 1, Math.round(
        bitmap.height * yRatio,
      )))
      return [...context.getImageData(x, y, 1, 1).data]
    }
    return {
      center: pixel(0.5, 0.5),
      edges: [
        pixel(0.08, 0.08),
        pixel(0.92, 0.08),
        pixel(0.08, 0.92),
        pixel(0.92, 0.92),
      ],
      height: bitmap.height,
      pixelDigest,
      width: bitmap.width,
    }
  }, screenshot.toString('base64'))
}

describe('content contracts', { concurrency: 2 }, () => {
test('theme leaves producer-owned markup and image interactions untouched', async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await waitForSlide(page, buildContext.builds['expanded-default'].baseUrl, 2, 'light')
    const result = await page.evaluate(async () => {
      const host = document.createElement('div')
      host.innerHTML = `
        <aside class="obsidian-slidev-callout obsidian-slidev-callout--warning">
          <div class="obsidian-slidev-callout__title">Producer title</div>
        </aside>
        <figure class="obsidian-slidev-media obsidian-slidev-media--image">
          <img class="obsidian-slidev-media__image" alt="Producer image">
        </figure>
        <ul class="obsidian-slidev-task-list"><li><input type="checkbox">Producer task</li></ul>
      `
      const before = host.innerHTML
      document.querySelector('.slidev-page-2 .slide-frame__content').append(host)
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      host.querySelector('img').click()
      const after = host.innerHTML
      const dialogs = document.querySelectorAll('.presentation-image-viewer').length
      host.remove()
      return { before, after, dialogs }
    })
    assert.equal(result.after, result.before)
    assert.equal(result.dialogs, 0)
  } finally {
    await browser.close()
    await buildContext.close()
  }
})

test('expanded-content production harness', async (t) => {
  const fixture = await readFile(
    resolve(repositoryRoot, 'fixtures/expanded-content.md'),
    'utf8',
  )
  assert.match(fixture, /__EXPANDED_PRESET__/)
  assert.match(fixture, /expanded-control-start/)
  assert.match(fixture, /expanded-control-target/)
  for (const story of ['US1', 'US2', 'US3', 'US4', 'US5']) {
    assert.match(fixture, new RegExp(`EXPANDED-${story}-START`))
    assert.match(fixture, new RegExp(`EXPANDED-${story}-END`))
  }
  assert.doesNotMatch(fixture, /obsidian-slidev.*(?:addon|plugin)/i)

  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  // This shell check validates local bundles and navigation. Keep optional font
  // and favicon services out of its runtime-error assertion; visual tests below
  // continue using the deck's typography.
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    contentType: 'text/css',
    body: '',
  }))
  await context.route('https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png',
    route => route.fulfill({ status: 204 }))
  try {
    for (const preset of expandedPresets) {
      await t.test(`${preset} standalone shell`, async () => {
        const page = await context.newPage()
        const runtimeErrors = []
        page.on('console', (message) => {
          const text = message.text()
          if (message.type() === 'error'
            && text !== 'Wake Lock permission request denied'
            && !/^Failed to load resource: the server responded with a status of \d+ \(\)$/.test(text)) {
            runtimeErrors.push(message.text())
          }
        })
        page.on('response', (response) => {
          const url = new URL(response.url())
          if (url.hostname === '127.0.0.1' && response.status() >= 400) {
            runtimeErrors.push(`${response.status()} ${response.url()}`)
          }
        })
        page.on('pageerror', (error) => {
          if (error.message !== 'Wake Lock permission request denied') {
            runtimeErrors.push(error.message)
          }
        })
        try {
          const state = await inspectBuiltCase({
            baseUrl: buildContext.builds[`expanded-${preset}`].baseUrl,
            caseId: 'expanded-control-target',
            page,
            slide: 2,
          })
          assert.equal(state.preset, preset)
          assert.equal(state.density, undefined)
          assert.match(state.markerText, /Stable navigation control/)
          assert.deepEqual(runtimeErrors, [])
        } finally {
          await page.close()
        }
      })
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US1 callout and author normalization is closed, ordered, and empty-safe', async () => {
  const [callouts, authors] = await Promise.all([
    loadTypeScriptModule('setup/callouts.ts'),
    loadTypeScriptModule('setup/authors.ts'),
  ])
  assert.equal(callouts.CALLOUT_TYPES.length, 19)
  assert.ok(Object.isFrozen(callouts.CALLOUT_TYPES))
  assert.equal(callouts.normalizeCalloutType(' WARNING '), 'warning')
  assert.equal(callouts.normalizeCalloutType('unsupported'), null)
  assert.deepEqual(callouts.resolveCallout('', ''), {
    family: 'neutral',
    title: 'Callout',
    type: null,
  })

  const normalized = authors.resolveDeckAuthors({
    authors: [
      'Ada',
      { institution: 'Research Lab' },
      { email: 'valid@example.org' },
      { email: 'not actionable' },
      { name: 'Duplicate' },
      { name: 'Duplicate' },
      {},
      '',
    ],
    author: 'Legacy fallback must not be used',
  })
  assert.deepEqual(normalized.map(author => author.primary), [
    'Ada',
    'Research Lab',
    'valid@example.org',
    'not actionable',
    'Duplicate',
    'Duplicate',
  ])
  assert.equal(normalized[2].primaryHref, 'mailto:valid@example.org')
  assert.equal(normalized[2].emailHref, undefined)
  assert.equal(normalized[3].primaryHref, undefined)
  assert.deepEqual(authors.resolveDeckAuthors({
    authors: [{}],
    author: 'Legacy fallback',
  }).map(author => author.primary), ['Legacy fallback'])
  assert.deepEqual(authors.resolveDeckAuthors({
    authors: ['', {}],
    author: {},
  }), [])
})

test('US1 same-source media fit, fallback, caption, and closing-logo contracts', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })

  try {
    for (const preset of expandedPresets) {
      const page = await context.newPage()
      const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      try {
        for (const mode of expandedModes) {
          await waitForSlide(
            page,
            baseUrl,
            45,
            mode,
            'visual-media-figure-fits',
          )
          const figures = page.locator(
            '[data-quality-case="visual-media-figure-fits"] > figure',
          )
          assert.equal(await figures.count(), 4)
          const geometry = await figures.evaluateAll(elements => elements.map(
            (figure) => {
              const viewport = figure.querySelector(
                '.presentation-media__viewport',
              )
              const image = figure.querySelector('img')
              const caption = figure.querySelector('figcaption')
              const viewportRect = viewport?.getBoundingClientRect()
              const captionRect = caption?.getBoundingClientRect()
              return {
                captionBelowViewport: Boolean(
                  captionRect && viewportRect
                  && captionRect.top >= viewportRect.bottom,
                ),
                captionText: caption?.textContent?.trim() ?? '',
                computedFit: image ? getComputedStyle(image).objectFit : null,
                naturalHeight: image?.naturalHeight ?? 0,
                naturalWidth: image?.naturalWidth ?? 0,
                rootFit: figure.getAttribute('data-media-fit'),
                state: figure.getAttribute('data-media-state'),
                viewportFit: viewport?.getAttribute('data-media-fit') ?? null,
                viewportHeight: viewportRect?.height ?? 0,
                viewportWidth: viewportRect?.width ?? 0,
              }
            },
          ))
          assert.deepEqual(
            geometry.map(item => item.rootFit),
            ['contain', 'cover', 'contain', 'cover'],
          )
          assert.deepEqual(
            geometry.map(item => item.viewportFit),
            ['contain', 'cover', 'contain', 'cover'],
          )
          assert.deepEqual(
            geometry.map(item => item.computedFit),
            ['contain', 'cover', 'contain', 'cover'],
          )
          assert.ok(geometry.every(item => item.state === 'ready'))
          assert.ok(geometry.every(item => item.captionBelowViewport))
          assert.ok(geometry.every(item => item.captionText))
          assert.ok(geometry.every(item => (
            item.naturalHeight > 0
            && item.naturalWidth > 0
            && item.viewportHeight > 0
            && item.viewportWidth > 0
          )), `${preset}/${mode}: ${JSON.stringify(geometry)}`)
          assert.equal(
            geometry[0].naturalWidth / geometry[0].naturalHeight,
            geometry[1].naturalWidth / geometry[1].naturalHeight,
          )
          assert.equal(
            geometry[2].naturalWidth / geometry[2].naturalHeight,
            geometry[3].naturalWidth / geometry[3].naturalHeight,
          )

          const probes = []
          for (let index = 0; index < 4; index += 1) {
            probes.push(await sampleLocatorPixels(
              page,
              figures.nth(index).locator('.presentation-media__viewport'),
            ))
          }
          assert.notEqual(
            probes[0].pixelDigest,
            probes[1].pixelDigest,
            `${preset}/${mode}: portrait contain and cover painted extents`,
          )
          assert.notEqual(
            probes[2].pixelDigest,
            probes[3].pixelDigest,
            `${preset}/${mode}: landscape contain and cover painted extents`,
          )

          const imageLayouts = [
            {
              fit: 'contain',
              marker: 'visual-image-left-contain',
              mediaRatio: '50',
              orientation: 'left',
              position: 'center',
              renderedPosition: '50% 50%',
              slide: 46,
            },
            {
              fit: 'cover',
              marker: 'visual-image-left-cover',
              mediaRatio: '60',
              orientation: 'left',
              position: '35% 45%',
              renderedPosition: '35% 45%',
              slide: 47,
            },
            {
              fit: 'contain',
              marker: 'visual-image-right-contain',
              mediaRatio: '50',
              orientation: 'right',
              position: 'center',
              renderedPosition: '50% 50%',
              slide: 48,
            },
            {
              fit: 'cover',
              marker: 'visual-image-right-cover',
              mediaRatio: '40',
              orientation: 'right',
              position: '65% 55%',
              renderedPosition: '65% 55%',
              slide: 49,
            },
          ]
          const layoutGeometry = []
          for (const definition of imageLayouts) {
            await waitForSlide(
              page,
              baseUrl,
              definition.slide,
              mode,
              definition.marker,
            )
            layoutGeometry.push(await page.locator(
              `.slidev-page-${definition.slide} .presentation-image-text`,
            ).evaluate((root) => {
              const figure = root.querySelector(
                '.presentation-image-text__figure',
              )
              const viewport = figure?.querySelector(
                '.presentation-media__viewport',
              )
              const image = figure?.querySelector('img')
              const caption = figure?.querySelector('figcaption')
              const narrative = root.querySelector(
                '.presentation-image-text__narrative',
              )
              const rect = element => element?.getBoundingClientRect()
              return {
                captionAlign: caption
                  ? getComputedStyle(caption).textAlign
                  : null,
                childClasses: [...root.children].map(child => child.className),
                computedFit: image ? getComputedStyle(image).objectFit : null,
                computedPosition: image
                  ? getComputedStyle(image).objectPosition
                  : null,
                figure: rect(figure),
                mediaPosition: root.getAttribute('data-media-position'),
                mediaRatio: root.getAttribute('data-media-ratio'),
                narrative: rect(narrative),
                orientation: root.getAttribute('data-orientation'),
                rootFit: figure?.getAttribute('data-media-fit') ?? null,
                viewport: rect(viewport),
                viewportFit: viewport?.getAttribute('data-media-fit') ?? null,
                caption: rect(caption),
              }
            }))
          }
          for (const [index, definition] of imageLayouts.entries()) {
            const layout = layoutGeometry[index]
            assert.deepEqual(layout.childClasses, [
              'presentation-image-text__narrative',
              'presentation-media presentation-media--image presentation-image-text__figure',
            ])
            assert.equal(layout.orientation, definition.orientation)
            assert.equal(layout.rootFit, definition.fit)
            assert.equal(layout.viewportFit, definition.fit)
            assert.equal(layout.computedFit, definition.fit)
            assert.equal(layout.mediaPosition, definition.position)
            assert.equal(layout.computedPosition, definition.renderedPosition)
            assert.equal(layout.mediaRatio, definition.mediaRatio)
            assert.ok(['left', 'start'].includes(layout.captionAlign))
            assert.ok(layout.caption.top >= layout.viewport.bottom)
          }
          assert.ok(
            layoutGeometry[1].figure.width
              > layoutGeometry[1].narrative.width,
          )
          assert.ok(
            layoutGeometry[3].figure.width
              < layoutGeometry[3].narrative.width,
          )
          assert.equal(
            Math.round(layoutGeometry[0].viewport.height),
            Math.round(layoutGeometry[1].viewport.height),
          )
          assert.notEqual(
            Math.round(layoutGeometry[0].viewport.width),
            Math.round(layoutGeometry[1].viewport.width),
          )
          assert.equal(
            Math.round(layoutGeometry[2].viewport.height),
            Math.round(layoutGeometry[3].viewport.height),
          )
          assert.notEqual(
            Math.round(layoutGeometry[2].viewport.width),
            Math.round(layoutGeometry[3].viewport.width),
          )

          for (const definition of [
            { marker: 'visual-closing-logo-wide', slide: 50 },
            { marker: 'visual-closing-logo-tall', slide: 51 },
          ]) {
            await waitForSlide(
              page,
              baseUrl,
              definition.slide,
              mode,
              definition.marker,
            )
            const logo = page.locator(
              `.slidev-page-${definition.slide} .presentation-closing-logo`,
            )
            assert.equal(await logo.count(), 1)
            assert.equal(
              await logo.locator('.presentation-media').count(),
              0,
            )
            const logoState = await logo.evaluate((element) => {
              const image = element.querySelector('img')
              const style = getComputedStyle(element)
              return {
                background: style.backgroundColor,
                borderWidth: style.borderWidth,
                boxShadow: style.boxShadow,
                fit: image ? getComputedStyle(image).objectFit : null,
                state: element.getAttribute('data-logo-state'),
              }
            })
            assert.equal(logoState.fit, 'contain')
            assert.equal(logoState.state, 'ready')
            assert.equal(logoState.borderWidth, '0px')
            assert.equal(logoState.background, 'rgba(0, 0, 0, 0)')
            assert.equal(logoState.boxShadow, 'none')
          }
        }
      } finally {
        await page.close()
      }
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('Figure layout variants preserve media semantics and expose distinct compositions', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })

  try {
    for (const preset of expandedPresets) {
      const page = await context.newPage()
      const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      try {
        const results = []
        for (const definition of [
          { marker: 'figure-variant-stage', slide: 62, variant: 'stage' },
          { marker: 'figure-variant-minimal', slide: 63, variant: 'minimal' },
          { marker: 'figure-variant-editorial', slide: 64, variant: 'editorial' },
        ]) {
          await waitForSlide(
            page,
            baseUrl,
            definition.slide,
            'light',
            definition.marker,
          )
          results.push(await page.locator(
            `.slidev-page-${definition.slide} .slide-layout-figure`,
          ).evaluate((layout) => {
            const figure = layout.querySelector('.presentation-media')
            const viewport = figure?.querySelector(
              '.presentation-media__viewport',
            )
            const image = figure?.querySelector('img')
            const caption = figure?.querySelector('figcaption')
            const rect = element => element?.getBoundingClientRect()
            const viewportStyle = viewport ? getComputedStyle(viewport) : null
            const captionStyle = caption ? getComputedStyle(caption) : null
            return {
              caption: rect(caption),
              captionBorderTopWidth: captionStyle?.borderTopWidth ?? null,
              figureDisplay: figure ? getComputedStyle(figure).display : null,
              fit: image ? getComputedStyle(image).objectFit : null,
              imageBackground: image
                ? getComputedStyle(image).backgroundColor
                : null,
              layoutClass: layout.className,
              trayBackground: viewportStyle?.backgroundColor ?? null,
              trayBorderWidth: viewportStyle?.borderTopWidth ?? null,
              variant: layout.getAttribute('data-figure-variant'),
              viewport: rect(viewport),
            }
          }))
        }

        assert.deepEqual(results.map(result => result.variant), [
          'stage',
          'minimal',
          'editorial',
        ])
        for (const [index, variant] of ['stage', 'minimal', 'editorial'].entries()) {
          assert.match(results[index].layoutClass, new RegExp(`--${variant}(?:\\s|$)`))
          assert.ok(results[index].viewport.width > 0)
          assert.ok(results[index].viewport.height > 0)
        }
        assert.equal(results[0].fit, 'contain')
        assert.equal(results[1].fit, 'contain')
        assert.equal(results[2].fit, 'cover')
        assert.equal(results[1].trayBorderWidth, '0px')
        assert.equal(results[1].trayBackground, 'rgba(0, 0, 0, 0)')
        assert.equal(results[1].imageBackground, 'rgba(0, 0, 0, 0)')
        assert.equal(results[2].figureDisplay, 'grid')
        assert.equal(results[2].captionBorderTopWidth, '2px')
        assert.ok(results[2].caption.left >= results[2].viewport.right)
        assert.ok(results[0].viewport.width > results[1].viewport.width)

        await page.setViewportSize({ height: 720, width: 640 })
        await waitForSlide(
          page,
          baseUrl,
          64,
          'light',
          'figure-variant-editorial',
        )
        const compactEditorial = await page.locator(
          '.slidev-page-64 .slide-layout-figure--editorial',
        ).evaluate((layout) => {
          const figure = layout.querySelector('.presentation-media')
          const viewport = figure?.querySelector(
            '.presentation-media__viewport',
          )
          const caption = figure?.querySelector('figcaption')
          const viewportRect = viewport?.getBoundingClientRect()
          const captionRect = caption?.getBoundingClientRect()
          return {
            captionBelow: Boolean(
              viewportRect
              && captionRect
              && captionRect.top >= viewportRect.bottom,
            ),
            columns: figure ? getComputedStyle(figure).gridTemplateColumns : '',
          }
        })
        assert.ok(compactEditorial.captionBelow)
        assert.doesNotMatch(compactEditorial.columns, /\s/)
      } finally {
        await page.close()
      }
    }
  } finally {
    await context.close()
    await browser.close()
  }
})

test('ordinary Figure variants stay local and compact', {
  timeout: 240_000,
}, async () => {
  const build = {
    id: 'figure-component-variants',
    outDir: resolve(
      qualityArtifactRoot,
      'build/content-contracts/figure-component-variants',
    ),
    source: resolve(repositoryRoot, 'fixtures/figure-component-variants.md'),
  }
  await buildDeck(build)
  const server = await startStaticServer(build.outDir)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  const page = await context.newPage()

  try {
    const results = []
    for (const definition of [
      { marker: 'figure-component-centered', slide: 1, variant: 'centered' },
      { marker: 'figure-component-stage', slide: 2, variant: 'stage' },
      { marker: 'figure-component-minimal', slide: 3, variant: 'minimal' },
      { marker: 'figure-component-editorial', slide: 4, variant: 'editorial' },
    ]) {
      await waitForSlide(
        page,
        server.baseUrl,
        definition.slide,
        'light',
        definition.marker,
      )
      results.push(await page.locator(
        `.slidev-page-${definition.slide} .presentation-media`,
      ).evaluate((figure) => {
        const canvas = figure.closest('.slidev-layout')
        const viewport = figure.querySelector(
          '.presentation-media__viewport',
        )
        const image = figure.querySelector('img')
        const caption = figure.querySelector('figcaption')
        const rect = element => element?.getBoundingClientRect()
        return {
          canvasClass: canvas?.className ?? '',
          caption: rect(caption),
          captionBorder: caption
            ? getComputedStyle(caption).borderTopWidth
            : null,
          display: getComputedStyle(figure).display,
          figure: rect(figure),
          imageBackground: image
            ? getComputedStyle(image).backgroundColor
            : null,
          modifier: figure.className,
          trayBackground: viewport
            ? getComputedStyle(viewport).backgroundColor
            : null,
          trayBorder: viewport
            ? getComputedStyle(viewport).borderTopWidth
            : null,
          variant: figure.getAttribute('data-figure-variant'),
          viewport: rect(viewport),
        }
      }))
    }

    assert.deepEqual(results.map(result => result.variant), [
      'centered',
      'stage',
      'minimal',
      'editorial',
    ])
    for (const [index, variant] of [
      'centered',
      'stage',
      'minimal',
      'editorial',
    ].entries()) {
      assert.doesNotMatch(results[index].canvasClass, /(?:^|\s)figure(?:\s|$)/)
      assert.match(
        results[index].modifier,
        new RegExp(`(?:^|\\s)presentation-media--figure-${variant}(?:\\s|$)`),
      )
      assert.ok(results[index].viewport.height > 0)
    }
    assert.ok(results[1].figure.width > results[2].figure.width)
    assert.ok(results[1].viewport.height > results[2].viewport.height)
    assert.equal(results[2].trayBorder, '0px')
    assert.equal(results[2].trayBackground, 'rgba(0, 0, 0, 0)')
    assert.equal(results[2].imageBackground, 'rgba(0, 0, 0, 0)')
    assert.equal(results[3].display, 'grid')
    assert.equal(results[3].captionBorder, '2px')
    assert.ok(results[3].caption.left >= results[3].viewport.right)

    await page.setViewportSize({ height: 720, width: 640 })
    await waitForSlide(
      page,
      server.baseUrl,
      4,
      'light',
      'figure-component-editorial',
    )
    const responsive = await page.locator(
      '.slidev-page-4 .presentation-media--figure-editorial',
    ).evaluate((figure) => {
      const viewport = figure.querySelector(
        '.presentation-media__viewport',
      )
      const caption = figure.querySelector('figcaption')
      const viewportRect = viewport?.getBoundingClientRect()
      const captionRect = caption?.getBoundingClientRect()
      return {
        captionBelow: Boolean(
          viewportRect
          && captionRect
          && captionRect.top >= viewportRect.bottom,
        ),
        columns: getComputedStyle(figure).gridTemplateColumns,
      }
    })
    assert.ok(responsive.captionBelow)
    assert.doesNotMatch(responsive.columns, /\s/)
  } finally {
    await page.close()
    await context.close()
    await browser.close()
    await server.close()
  }
})

test('US2 114-case callout matrix and standalone semantic component contracts', { timeout: 240_000 }, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  let canonicalCases = 0
  try {
    const page = await context.newPage()
    try {
      for (const preset of expandedPresets) {
        const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
        for (const mode of expandedModes) {
          for (const family of calloutFamilies) {
            await waitForSlide(page, baseUrl, family.slide, mode, family.marker)
            const callouts = page.locator(
              `[data-quality-case="${family.marker}"] > .presentation-callout`,
            )
            assert.equal(await callouts.count(), family.types.length)
            for (const [index, type] of family.types.entries()) {
              const callout = callouts.nth(index)
              assert.equal(await callout.getAttribute('data-callout'), type)
              assert.equal(await callout.getAttribute('role'), 'note')
              assert.ok(
                (await callout.getAttribute('aria-labelledby'))?.trim(),
                `${preset}/${mode}/${type}: labelled note`,
              )
              assert.ok(
                await callout.evaluate((element, modifier) => (
                  element.classList.contains(modifier)
                ), `presentation-callout--${type}`),
              )
              assert.equal(
                (await callout.locator('.presentation-callout__title')
                  .textContent())?.trim(),
                calloutTitles[type],
              )
              const style = await callout.evaluate((element) => {
                const computed = getComputedStyle(element)
                const title = element.querySelector(
                  '.presentation-callout__title',
                )
                const titleStyle = getComputedStyle(title)
                const cue = getComputedStyle(title, '::before')
                const family = element.getAttribute('data-callout-family')
                const roleProbe = document.createElement('span')
                roleProbe.style.color = `var(--presentation-family-${family})`
                element.append(roleProbe)
                const roleColor = getComputedStyle(roleProbe).color
                roleProbe.remove()
                const cueWidth = Number.parseFloat(cue.width)
                const cueHeight = Number.parseFloat(cue.height)
                const cueBorderWidth = Number.parseFloat(cue.borderTopWidth)
                const transparentCue = cue.backgroundColor === 'transparent'
                  || cue.backgroundColor === 'rgba(0, 0, 0, 0)'
                  || cue.backgroundColor.endsWith('/ 0)')
                const cueShape = cue.clipPath !== 'none'
                  ? 'triangle'
                  : cueBorderWidth > 0 && transparentCue
                    ? 'ring'
                    : cueWidth < cueHeight * 0.6
                      ? 'bar'
                      : cue.transform !== 'none'
                        ? 'diamond'
                        : Number.parseFloat(cue.borderRadius) <= 2
                          ? 'square'
                          : 'circle'
                return {
                  backgroundColor: computed.backgroundColor,
                  borderLeftColor: computed.borderLeftColor,
                  borderLeftWidth: computed.borderLeftWidth,
                  cueBackground: cue.backgroundColor,
                  cueBorderWidth: cue.borderTopWidth,
                  cueColor: family === 'question'
                    ? cue.borderTopColor
                    : cue.backgroundColor,
                  cueShape,
                  family,
                  roleColor,
                  titleColor: titleStyle.color,
                  titleTransform: titleStyle.textTransform,
                }
              })
              const expectedShape = {
                caution: 'triangle',
                danger: 'square',
                info: 'circle',
                positive: 'diamond',
                question: 'ring',
                quotation: 'bar',
              }[family.family]
              assert.notEqual(style.backgroundColor, 'rgba(0, 0, 0, 0)')
              assert.notEqual(style.borderLeftWidth, '0px')
              assert.notEqual(style.borderLeftColor, 'rgba(0, 0, 0, 0)')
              assert.ok(
                style.cueBackground !== 'rgba(0, 0, 0, 0)'
                || style.cueBorderWidth !== '0px',
              )
              assert.equal(style.family, family.family)
              assert.equal(style.cueShape, expectedShape)
              assert.equal(style.titleTransform, 'none')
              const styleContext = `${preset}/${mode}/${type}: ${JSON.stringify(style)}`
              assert.equal(style.borderLeftColor, style.roleColor, styleContext)
              assert.equal(style.cueColor, style.roleColor, styleContext)
              assert.equal(style.titleColor, style.roleColor, styleContext)
              canonicalCases += 1
            }
          }

          await waitForSlide(
            page,
            baseUrl,
            52,
            mode,
            'visual-callout-authored-compact',
          )
          const compact = page.locator(
            '[data-quality-case="visual-callout-authored-compact"]',
          )
          const authoredTitles = compact.locator(
            ':scope > .presentation-callout > .presentation-callout__title',
          )
          assert.deepEqual(
            (await authoredTitles.allTextContents()).map(title => title.trim()),
            [
              'API note',
              'mixedCase success',
              'Caution · 注意事项',
              'DO NOT recase',
              'Why this result?',
              'Quoted evidence · 引用',
              'Neutral fallback',
            ],
          )
          assert.ok(await authoredTitles.evaluateAll(titles => titles.every(
            title => getComputedStyle(title).textTransform === 'none',
          )))
          assert.equal(
            await compact.evaluate(root => (
              root.scrollHeight <= root.clientHeight + 1
              && root.scrollWidth <= root.clientWidth + 1
            )),
            true,
            `${preset}/${mode}: compact callout gallery overflow`,
          )
        }
      }
      assert.equal(canonicalCases, 114)

      const defaultUrl = buildContext.builds['expanded-default'].baseUrl
      await waitForSlide(
        page,
        defaultUrl,
        9,
        'light',
        'us1-callout-fallbacks',
      )
      const fallbacks = page.locator(
        '[data-quality-case="us1-callout-fallbacks"] > .presentation-callout',
      )
      assert.equal(await fallbacks.count(), 4)
      for (const index of [0, 1, 2]) {
        const callout = fallbacks.nth(index)
        assert.equal(await callout.getAttribute('data-callout'), 'neutral')
        assert.doesNotMatch(
          await callout.getAttribute('class') ?? '',
          /presentation-callout--/,
        )
      }
      assert.equal(
        (await fallbacks.nth(0).locator('.presentation-callout__title')
          .textContent())?.trim(),
        'Callout',
      )
      assert.equal(
        (await fallbacks.nth(1).locator('.presentation-callout__title')
          .textContent())?.trim(),
        'Authored neutral',
      )
      const normalized = fallbacks.nth(3)
      assert.equal(await normalized.getAttribute('data-callout'), 'warning')
      assert.ok(await normalized.locator('strong').count())
      assert.ok(await normalized.locator('code').count())
      assert.ok(await normalized.locator('a[href]').count())
      assert.equal(await normalized.locator('ol > li').count(), 2)

      await waitForSlide(
        page,
        defaultUrl,
        10,
        'light',
        'us1-callout-equivalence',
      )
      const fingerprints = await page.locator(
        '[data-quality-case="us1-callout-equivalence"] > .presentation-callout',
      ).evaluateAll(elements => elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          backgroundColor: style.backgroundColor,
          borderLeftColor: style.borderLeftColor,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          padding: style.padding,
        }
      }))
      assert.equal(fingerprints.length, 2)
      assert.deepEqual(fingerprints[0], fingerprints[1])

      await waitForSlide(
        page,
        defaultUrl,
        11,
        'light',
        'us1-figures-alternatives',
      )
      const figures = page.locator(
        '[data-quality-case="us1-figures-alternatives"] > figure',
      )
      assert.equal(await figures.count(), 5)
      assert.equal(
        await figures.nth(0).locator('img').getAttribute('alt'),
        'Lilas card connected to a presentation',
      )
      assert.equal(
        await figures.nth(1).locator('img').getAttribute('alt'),
        'Caption supplies the omitted alternative.',
      )
      assert.equal(await figures.nth(2).locator('img').getAttribute('alt'), '')
      for (const index of [3, 4]) {
        assert.equal(await figures.nth(index).locator('img').count(), 0)
        assert.ok(
          (await figures.nth(index)
            .locator('.presentation-media__fallback').textContent())?.trim(),
        )
      }

      await waitForSlide(
        page,
        defaultUrl,
        12,
        'light',
        'us1-figures-geometry',
      )
      assert.equal(
        await page.locator(
          '[data-quality-case="us1-figures-geometry"] > figure img',
        ).count(),
        3,
      )

      await waitForSlide(
        page,
        defaultUrl,
        13,
        'light',
        'us1-authors-mixed',
      )
      const authors = page.locator(
        '[data-quality-case="us1-authors-mixed"] .presentation-author',
      )
      assert.equal(await authors.count(), 9)
      assert.deepEqual(
        await authors.locator('.presentation-author__name').allTextContents(),
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
      assert.deepEqual(
        await authors.locator('a[href^="mailto:"]').evaluateAll(links => (
          links.map(link => link.getAttribute('href'))
        )),
        [
          'mailto:grace@example.org',
          'mailto:contributor@example.org',
          'mailto:equal@example.org',
        ],
      )
    } finally {
      await page.close()
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US3 link decoration and distinct author value, action, and order contract', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  const expectedAuthors = [
    {
      details: [],
      primary: 'Ada Lovelace',
      primaryHref: null,
    },
    {
      details: [
        { href: null, kind: 'institution', text: 'US Navy' },
        {
          href: 'mailto:grace@example.org',
          kind: 'email',
          text: 'grace@example.org',
        },
      ],
      primary: 'Grace Hopper',
      primaryHref: null,
    },
    {
      details: [],
      primary: 'Institute for Reproducible Research',
      primaryHref: null,
    },
    {
      details: [],
      primary: 'contributor@example.org',
      primaryHref: 'mailto:contributor@example.org',
    },
    {
      details: [],
      primary: 'not-an-email',
      primaryHref: null,
    },
    {
      details: [
        {
          href: 'mailto:equal@example.org',
          kind: 'email',
          text: 'equal@example.org',
        },
      ],
      primary: 'Equal Value',
      primaryHref: null,
    },
    {
      details: [],
      primary: 'Duplicate Fields',
      primaryHref: null,
    },
    {
      details: [],
      primary: 'Intentional Duplicate',
      primaryHref: null,
    },
    {
      details: [],
      primary: 'Intentional Duplicate',
      primaryHref: null,
    },
  ]
  const inspectLinks = locator => locator.evaluateAll(links => links.map(
    (link) => {
      const style = getComputedStyle(link)
      return {
        borderBottomWidth: style.borderBottomWidth,
        boxShadow: style.boxShadow,
        display: style.display,
        form: link.getAttribute('data-link-form'),
        href: link.getAttribute('href'),
        text: link.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        underlineCount: style.textDecorationLine
          .split(/\s+/)
          .filter(value => value === 'underline')
          .length,
      }
    },
  ))
  const inspectAuthorCards = locator => locator.evaluateAll(cards => cards.map(
    (card) => {
      const primary = card.querySelector('.presentation-author__primary')
      const details = [...card.querySelectorAll(
        '.presentation-author__institution, .presentation-author__email',
      )].map(detail => ({
        href: detail.getAttribute('href'),
        kind: detail.classList.contains('presentation-author__institution')
          ? 'institution'
          : 'email',
        text: detail.textContent?.trim() ?? '',
      }))
      return {
        details,
        primary: primary?.textContent?.trim() ?? null,
        primaryHref: primary?.getAttribute('href') ?? null,
      }
    },
  ))

  try {
    for (const preset of expandedPresets) {
      const page = await context.newPage()
      const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      try {
        for (const mode of expandedModes) {
          await waitForSlide(
            page,
            baseUrl,
            53,
            mode,
            'visual-links-authors',
          )
          const authoredLinks = await inspectLinks(page.locator(
            '[data-quality-case="visual-links-authors"] a[href^="https://example.com/"]',
          ))
          assert.equal(authoredLinks.length, 3)
          assert.ok(authoredLinks.every(link => (
            link.underlineCount === 1
            && link.borderBottomWidth === '0px'
            && link.boxShadow === 'none'
          )))
          assert.deepEqual(
            authoredLinks.map(link => link.display),
            ['inline', 'inline', 'block'],
          )
          assert.deepEqual(
            await inspectAuthorCards(page.locator(
              '[data-quality-case="visual-links-authors"] .presentation-author',
            )),
            expectedAuthors,
          )

          await waitForSlide(
            page,
            baseUrl,
            16,
            mode,
            'us2-closing-metadata',
          )
          assert.deepEqual(
            await inspectAuthorCards(page.locator(
              '.slidev-page-16 .presentation-closing .presentation-author',
            )),
            expectedAuthors,
          )
          const contact = await inspectLinks(page.locator(
            '.slidev-page-16 .presentation-closing__contact[href]',
          ))
          assert.equal(contact.length, 1)
          assert.equal(contact[0].underlineCount, 1)
          assert.equal(contact[0].borderBottomWidth, '0px')

          await waitForSlide(
            page,
            baseUrl,
            1,
            mode,
            'expanded-control-start',
          )
          const coverAuthors = await page.locator(
            '.slidev-page-1 .slide-cover__author',
          ).evaluateAll(cards => cards.map((card) => {
            const primary = card.querySelector('.slide-cover__author-primary')
            return {
              details: [...card.querySelectorAll(
                '.slide-cover__author-institution, .slide-cover__author-email',
              )].map(detail => ({
                href: detail.getAttribute('href'),
                kind: detail.classList.contains(
                  'slide-cover__author-institution',
                ) ? 'institution' : 'email',
                text: detail.textContent?.trim() ?? '',
              })),
              primary: primary?.textContent?.trim() ?? null,
              primaryHref: primary?.getAttribute('href') ?? null,
            }
          }))
          assert.deepEqual(coverAuthors, expectedAuthors)

          await waitForSlide(
            page,
            baseUrl,
            2,
            mode,
            'expanded-control-target',
          )
          assert.equal(
            (await page.locator(
              '.slidev-page-2 .slide-frame__footer-left',
            ).textContent())?.trim(),
            expectedAuthors.map(author => author.primary).join(', '),
          )
        }
      } finally {
        await page.close()
      }
    }

  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US4 42-case Badge, task-weight, and flat-highlight contract', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  const tones = [
    'neutral',
    'info',
    'positive',
    'caution',
    'danger',
    'question',
    'quotation',
  ]

  try {
    for (const preset of expandedPresets) {
      const page = await context.newPage()
      const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      try {
        for (const mode of expandedModes) {
          await waitForSlide(
            page,
            baseUrl,
            54,
            mode,
            'visual-badge-matrix',
          )
          const badges = page.locator(
            '[data-quality-case="visual-badge-matrix"] > .presentation-badge',
          )
          assert.equal(await badges.count(), 16)
          const states = await badges.evaluateAll(elements => elements.map(
            (badge) => {
              const tone = badge.getAttribute('data-badge-tone')
              const style = getComputedStyle(badge)
              const marker = badge.querySelector(
                '.presentation-badge__marker',
              )
              const markerStyle = marker ? getComputedStyle(marker) : null
              const roleProbe = document.createElement('span')
              roleProbe.style.color = `var(--presentation-family-${tone})`
              // Resolve currentColor-based accents from the same parent as the label.
              badge.after(roleProbe)
              const roleColor = getComputedStyle(roleProbe).color
              roleProbe.remove()
              const shape = markerStyle
                ? markerStyle.clipPath !== 'none'
                  ? 'triangle'
                  : Number.parseFloat(markerStyle.borderTopWidth) > 0
                    && markerStyle.backgroundColor === 'rgba(0, 0, 0, 0)'
                    ? 'ring'
                    : Number.parseFloat(markerStyle.width)
                      < Number.parseFloat(markerStyle.height) * 0.6
                      ? 'bar'
                      : markerStyle.transform !== 'none'
                        ? 'diamond'
                        : Number.parseFloat(markerStyle.borderRadius) <= 2
                          ? 'square'
                          : 'circle'
                : null
              return {
                textColor: style.color,
                markerAriaHidden: marker?.getAttribute('aria-hidden') ?? null,
                markerCount: badge.querySelectorAll(
                  '.presentation-badge__marker',
                ).length,
                markerRequested: badge.getAttribute('data-badge-marker'),
                roleColor,
                shape,
                tabIndex: badge.getAttribute('tabindex'),
                text: badge.textContent?.replace(/\s+/g, ' ').trim() ?? '',
                tone,
              }
            },
          ))
          assert.deepEqual(states.slice(0, 7).map(state => state.tone), tones)
          assert.ok(states.slice(0, 7).every(state => (
            state.markerCount === 0
            && state.markerRequested === 'false'
            // The label carries the semantic color; its outline is intentionally quieter.
            && state.textColor === state.roleColor
            && state.tabIndex === null
          )))
          assert.deepEqual(
            states.slice(0, 7).map(state => state.text),
            ['Neutral', 'Info', 'Positive', 'Caution', 'Danger', 'Question', 'Quotation'],
          )
          assert.deepEqual(
            {
              markerAriaHidden: states[7].markerAriaHidden,
              markerCount: states[7].markerCount,
              markerRequested: states[7].markerRequested,
              shape: states[7].shape,
              tone: states[7].tone,
            },
            {
              markerAriaHidden: 'true',
              markerCount: 1,
              markerRequested: 'true',
              shape: 'diamond',
              tone: 'positive',
            },
          )
          assert.equal(states[8].tone, 'neutral')
          assert.equal(states[8].markerCount, 0)
          assert.equal(states[9].text, '⚠ Authored icon only')
          assert.equal(states[9].markerCount, 0)
          assert.equal(states[10].text, '⚠ Marker plus authored icon')
          assert.equal(states[10].markerCount, 1)
          assert.equal(states[10].shape, 'triangle')
          assert.deepEqual(
            states.slice(11).map(state => ({
              markerCount: state.markerCount,
              markerRequested: state.markerRequested,
              text: state.text,
            })),
            [
              {
                markerCount: 0,
                markerRequested: 'false',
                text: 'Text false',
              },
              {
                markerCount: 0,
                markerRequested: 'false',
                text: 'Text off',
              },
              {
                markerCount: 1,
                markerRequested: 'true',
                text: 'Text true',
              },
              {
                markerCount: 1,
                markerRequested: 'true',
                text: 'Text on',
              },
              {
                markerCount: 0,
                markerRequested: 'false',
                text: 'Invalid marker',
              },
            ],
          )

          const inspectTasks = async (slide, marker) => {
            await waitForSlide(page, baseUrl, slide, mode, marker)
            return page.locator(
              `.slidev-page-${slide} input[type="checkbox"]`,
            ).evaluateAll(inputs => inputs.map((input) => {
              const item = input.closest('li')
              const style = getComputedStyle(item)
              const labelledBy = input.getAttribute('aria-labelledby')
                ?.split(/\s+/)
                .map(id => document.getElementById(id)?.textContent ?? '')
                .join(' ')
                .trim()
              const associatedLabel = [...(input.labels ?? [])]
                .map(label => label.textContent ?? '')
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()
              return {
                accessibleName: input.getAttribute('aria-label')?.trim()
                  || labelledBy
                  || associatedLabel,
                checked: input.checked,
                checkedClass: item.classList.contains(
                  'presentation-task-item--checked',
                ),
                color: style.color,
                dataChecked: input.getAttribute(
                  'data-presentation-task-checked',
                ),
                disabled: input.disabled,
                fontWeight: Number.parseInt(style.fontWeight, 10),
                nestedInChecked: Boolean(
                  item.parentElement?.closest(
                    '.presentation-task-item--checked',
                  ),
                ),
                tabIndex: input.tabIndex,
              }
            }))
          }
          const tasks = [
            ...await inspectTasks(42, 'us5-tasks-native'),
            ...await inspectTasks(43, 'us5-tasks-generated'),
          ]
          assert.ok(tasks.length > 0)
          assert.ok(tasks.every(task => (
            task.disabled
            && task.tabIndex === -1
            && task.accessibleName
            && task.checkedClass === task.checked
            && task.dataChecked === String(task.checked)
          )), JSON.stringify(tasks, null, 2))
          assert.ok(tasks.filter(task => task.checked).every(
            task => task.fontWeight <= 400,
          ))
          assert.ok(tasks.filter(task => !task.checked).every(
            task => task.fontWeight >= 600,
          ))
          assert.ok(tasks.some(task => !task.checked && task.nestedInChecked))

          await waitForSlide(
            page,
            baseUrl,
            44,
            mode,
            'us5-highlights',
          )
          const highlightStyles = await page.locator(
            '.slidev-page-44 [data-highlight-case]',
          ).evaluateAll(elements => elements.map((element) => {
            const style = getComputedStyle(element)
            return {
              background: style.backgroundColor,
              borderRadius: style.borderRadius,
              borderWidth: style.borderWidth,
              boxDecorationBreak: style.boxDecorationBreak,
              boxShadow: style.boxShadow,
              padding: style.padding,
            }
          }))
          assert.equal(highlightStyles.length, 2)
          assert.deepEqual(highlightStyles[0], highlightStyles[1])
          assert.notEqual(
            highlightStyles[0].background,
            'rgba(0, 0, 0, 0)',
          )
          assert.equal(highlightStyles[0].borderWidth, '0px')
          assert.equal(highlightStyles[0].borderRadius, '0px')
          assert.equal(highlightStyles[0].boxShadow, 'none')
          assert.equal(highlightStyles[0].boxDecorationBreak, 'clone')
          assert.notEqual(highlightStyles[0].padding, '0px')
          assert.ok(await page.locator(
            '.slidev-page-44 [data-highlight-code-scope] mark',
          ).evaluateAll(elements => elements.every((element) => {
            const style = getComputedStyle(element)
            return style.backgroundColor === 'rgba(0, 0, 0, 0)'
              && style.borderWidth === '0px'
              && style.borderRadius === '0px'
              && style.boxShadow === 'none'
              && style.padding === '0px'
          })))
        }
      } finally {
        await page.close()
      }
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US2 canonical closing and image/text layouts preserve their contracts', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  try {
    const page = await context.newPage()
    const baseUrl = buildContext.builds['expanded-default'].baseUrl
    try {
      const onSlide = (slide, selector) => (
        page.locator(`.slidev-page-${slide} ${selector}`)
      )
      const structure = async (slide, marker) => {
        await waitForSlide(page, baseUrl, slide, 'light', marker)
        return onSlide(slide, '.presentation-closing').evaluate((root) => (
          [...root.querySelectorAll('*')].map(element => ({
            ariaHidden: element.getAttribute('aria-hidden'),
            className: element.className,
            role: element.getAttribute('role'),
            tagName: element.tagName.toLowerCase(),
          }))
        ))
      }
      assert.deepEqual(
        await structure(14, 'us2-end-minimal'),
        await structure(15, 'us2-thanks-minimal'),
      )
      await waitForSlide(page, baseUrl, 14, 'light', 'us2-end-minimal')
      assert.ok(await onSlide(14, '.slide-frame--closing').count())
      assert.equal(await onSlide(14, '.slide-frame__footer').count(), 0)

      await waitForSlide(page, baseUrl, 16, 'light', 'us2-closing-metadata')
      const closingOrder = await onSlide(16, '.presentation-closing')
        .evaluate(root => [...root.children].map(element => element.className))
      assert.deepEqual(closingOrder, [
        'presentation-closing__message',
        'presentation-closing__contact',
        'presentation-closing__authors',
        'presentation-closing-logo presentation-closing__logo',
      ])
      assert.equal(
        await onSlide(16, '.presentation-closing__contact').getAttribute('href'),
        'mailto:research@example.org',
      )
      assert.equal(await onSlide(16,
        '.presentation-closing__authors .presentation-author',
      ).count(), 9)
      assert.equal(
        await onSlide(16, '.presentation-closing__logo img').getAttribute('alt'),
        'Lilas presentation research mark',
      )

      await waitForSlide(
        page,
        baseUrl,
        17,
        'light',
        'us2-closing-decorative-logo',
      )
      const decorativeLogo = onSlide(17, '.presentation-closing__logo img')
      assert.equal(await decorativeLogo.getAttribute('alt'), '')
      assert.equal(await decorativeLogo.getAttribute('aria-hidden'), 'true')

      await waitForSlide(
        page,
        baseUrl,
        18,
        'light',
        'us2-closing-failed-logo',
      )
      assert.equal(await onSlide(18, '.presentation-closing__logo img').count(), 0)
      assert.match(
        await onSlide(18,
          '.presentation-closing__logo .presentation-closing-logo__fallback',
        ).textContent(),
        /Research group logo unavailable/,
      )
      assert.equal(
        await onSlide(18, '.presentation-closing__contact').getAttribute('href'),
        null,
      )

      await waitForSlide(page, baseUrl, 19, 'light', 'us2-closing-omitted')
      assert.equal(await onSlide(19, '.presentation-closing__contact').count(), 0)
      assert.equal(await onSlide(19, '.presentation-closing__authors').count(), 0)
      assert.equal(await onSlide(19, '.presentation-closing__logo').count(), 0)

      const inspectImageLayout = async (slide, marker) => {
        await waitForSlide(page, baseUrl, slide, 'light', marker)
        return onSlide(slide, '.presentation-image-text').evaluate((root) => {
          const children = [...root.children]
          const narrative = root.querySelector('.presentation-image-text__narrative')
          const figure = root.querySelector('.presentation-image-text__figure')
          const rect = element => element?.getBoundingClientRect()
          return {
            childClasses: children.map(element => element.className),
            figureLeft: rect(figure)?.left ?? null,
            narrativeLeft: rect(narrative)?.left ?? null,
            orientation: root.getAttribute('data-orientation'),
          }
        })
      }
      const left = await inspectImageLayout(20, 'us2-image-left')
      const right = await inspectImageLayout(21, 'us2-image-right')
      assert.deepEqual(left.childClasses, [
        'presentation-image-text__narrative',
        'presentation-media presentation-media--image presentation-image-text__figure',
      ])
      assert.deepEqual(right.childClasses, left.childClasses)
      assert.equal(left.orientation, 'left')
      assert.equal(right.orientation, 'right')
      assert.ok(left.figureLeft < left.narrativeLeft)
      assert.ok(right.figureLeft > right.narrativeLeft)
      assert.equal(
        await onSlide(20, '.presentation-image-text')
          .getAttribute('data-background-size'),
        'contain',
      )
      assert.equal(
        await onSlide(20, '.presentation-image-text__figure img')
          .evaluate(element => getComputedStyle(element).objectFit),
        'contain',
      )
      assert.equal(
        await onSlide(21, '.presentation-image-text')
          .getAttribute('data-background-size'),
        'auto 72%',
      )
      assert.equal(
        await onSlide(21, '.presentation-image-text__figure')
          .getAttribute('data-media-rendering'),
        'background',
      )
      assert.equal(
        await onSlide(21, '.presentation-media__viewport')
          .evaluate(element => getComputedStyle(element).backgroundSize),
        'auto 72%',
      )

      await waitForSlide(page, baseUrl, 22, 'light', 'us2-image-legacy')
      assert.ok(await onSlide(22, '.slidev-layout.legacy-image-layout').count())
      assert.equal(
        await onSlide(22, '.presentation-image-text__figure img')
          .getAttribute('alt'),
        'Caption fallback supplies the omitted image alternative.',
      )
      assert.equal(
        await onSlide(22, '.presentation-image-text__figure')
          .getAttribute('data-media-rendering'),
        'background',
      )
      assert.equal(
        await onSlide(22, '.presentation-image-text')
          .getAttribute('data-background-size'),
        '80%',
      )
      assert.equal(
        await onSlide(22, '.presentation-media__viewport')
          .evaluate(element => getComputedStyle(element).backgroundSize),
        '80%',
      )

      await waitForSlide(page, baseUrl, 23, 'light', 'us2-image-missing')
      assert.equal(await onSlide(23, '.presentation-image-text__figure').count(), 0)
      assert.ok(await onSlide(23,
        '.presentation-image-text--narrative-only',
      ).count())

      await waitForSlide(page, baseUrl, 24, 'light', 'us2-image-failed')
      assert.equal(
        await onSlide(24, '.presentation-image-text__figure img').count(),
        0,
      )
      assert.match(
        await onSlide(24,
          '.presentation-image-text__figure .presentation-media__fallback',
        ).textContent(),
        /Failed experimental figure/,
      )

      await assert.rejects(
        readFile(resolve(repositoryRoot, 'layouts/thanks.vue'), 'utf8'),
        error => error?.code === 'ENOENT',
      )
    } finally {
      await page.close()
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US3 slide accents are local, first-valid, consumer-complete, and protected', {
  timeout: 240_000,
}, async () => {
  const deckAccent = 'color-mix(in srgb, currentColor 72%, #5b4fc4)'
  const localAccentA = 'color-mix(in srgb, currentColor 68%, #c2410c)'
  const localAccentB = 'color-mix(in srgb, currentColor 68%, #047857)'
  const definitions = [
    { accent: localAccentA, marker: 'us3-accent-local-a', slide: 26 },
    { accent: deckAccent, marker: 'us3-accent-unaccented', slide: 27 },
    { accent: deckAccent, marker: 'us3-accent-empty', slide: 28 },
    { accent: deckAccent, marker: 'us3-accent-invalid', slide: 29 },
    { accent: localAccentB, marker: 'us3-accent-local-b', slide: 30 },
    { accent: deckAccent, marker: 'us3-accent-equal-deck', slide: 31 },
  ]
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })

  const inspect = async ({ baseUrl, marker, mode, page, slide }) => {
    await waitForSlide(page, baseUrl, slide, mode, marker)
    return page.evaluate((caseId) => {
      const marked = document.querySelector(`[data-quality-case="${caseId}"]`)
      const canvas = marked?.closest('.slidev-layout')
      if (!(canvas instanceof HTMLElement)) {
        throw new Error(`${caseId}: canvas is missing`)
      }
      const frame = canvas.querySelector('.slide-frame')
      if (!(frame instanceof HTMLElement)) {
        throw new Error(`${caseId}: frame is missing`)
      }
      const style = (element, property, pseudo) => (
        element instanceof Element
          ? getComputedStyle(element, pseudo).getPropertyValue(property)
          : null
      )
      const calloutStyle = (type) => {
        const callout = canvas.querySelector(`[data-callout="${type}"]`)
        const title = callout?.querySelector('.presentation-callout__title')
        return callout
          ? {
              background: style(callout, 'background-color'),
              border: style(callout, 'border-left-color'),
              marker: style(title, 'background-color', '::before'),
              title: style(title, 'color'),
            }
          : null
      }
      const link = canvas.querySelector('a')
      const inlineCode = canvas.querySelector(':not(pre) > code')
      const listItem = canvas.querySelector('li')
      const tableHeader = canvas.querySelector('th')
      const info = calloutStyle('info')
      const header = canvas.querySelector('.slide-frame__header')
      const footer = canvas.querySelector('.slide-frame__footer')
      return {
        brand: [...canvas.querySelectorAll(
          '[class*="slide-frame__ucas"], [class*="slide-frame__ict"]',
        )].map(element => ({
          className: element.className,
          filter: style(element, 'filter'),
          height: style(element, 'height'),
          opacity: style(element, 'opacity'),
          src: element instanceof HTMLImageElement ? element.currentSrc : null,
          width: style(element, 'width'),
        })),
        frameAccent: getComputedStyle(frame)
          .getPropertyValue('--presentation-accent').trim(),
        framePrimary: getComputedStyle(frame)
          .getPropertyValue('--slidev-theme-primary').trim(),
        consumers: {
          footerBorder: style(footer, 'border-top-color'),
          headerBorder: style(header, 'border-bottom-color'),
          info,
          inlineCodeBackground: style(inlineCode, 'background-color'),
          inlineCodeColor: style(inlineCode, 'color'),
          linkColor: style(link, 'color'),
          listMarkerColor: style(listItem, 'color', '::marker'),
          tableHeaderBackground: style(tableHeader, 'background-color'),
          tableHeaderBorder: style(tableHeader, 'border-bottom-color'),
        },
        canvasInlineAccent: canvas.style
          .getPropertyValue('--presentation-accent').trim(),
        canvasInlinePrimary: canvas.style
          .getPropertyValue('--slidev-theme-primary').trim(),
        inlineAccent: frame.style.getPropertyValue('--presentation-accent').trim(),
        inlinePrimary: frame.style.getPropertyValue('--slidev-theme-primary').trim(),
        protectedSemantic: Object.fromEntries(
          ['success', 'warning', 'danger', 'question']
            .map(type => [type, calloutStyle(type)]),
        ),
        rootAccent: document.documentElement.style
          .getPropertyValue('--presentation-accent').trim(),
        rootPrimary: document.documentElement.style
          .getPropertyValue('--slidev-theme-primary').trim(),
      }
    }, marker)
  }

  try {
    for (const preset of expandedPresets) {
      const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      for (const mode of expandedModes) {
        const page = await context.newPage()
        try {
          const states = []
          for (const definition of definitions) {
            states.push(await inspect({
              baseUrl,
              marker: definition.marker,
              mode,
              page,
              slide: definition.slide,
            }))
          }

          for (const [index, definition] of definitions.entries()) {
            const state = states[index]
            assert.equal(state.inlineAccent, definition.accent)
            assert.equal(state.inlinePrimary, definition.accent)
            assert.equal(state.frameAccent, definition.accent)
            assert.equal(state.framePrimary, definition.accent)
            assert.equal(state.canvasInlineAccent, '')
            assert.equal(state.canvasInlinePrimary, '')
            assert.equal(state.rootAccent, '')
            assert.equal(state.rootPrimary, deckAccent)
          }

          const local = states[0]
          const fallback = states[1]
          for (const role of [
            'footerBorder',
            'headerBorder',
            'inlineCodeBackground',
            'inlineCodeColor',
            'linkColor',
            'listMarkerColor',
            'tableHeaderBackground',
            'tableHeaderBorder',
          ]) {
            assert.notEqual(
              local.consumers[role],
              fallback.consumers[role],
              `${preset}/${mode}: ${role} ignored the local accent`,
            )
          }
          assert.notDeepEqual(local.consumers.info, fallback.consumers.info)
          assert.deepEqual(
            local.protectedSemantic,
            fallback.protectedSemantic,
            `${preset}/${mode}: semantic colors changed with accent`,
          )
          assert.deepEqual(
            local.brand,
            fallback.brand,
            `${preset}/${mode}: protected brand styles changed with accent`,
          )

          await waitForSlide(
            page,
            baseUrl,
            26,
            mode,
            'us3-accent-local-a',
          )
          await page.keyboard.press('ArrowRight')
          await page.locator('[data-quality-case="us3-accent-unaccented"]')
            .waitFor({ state: 'attached' })
          const mounted = await page.evaluate(() => {
            const accent = slide => document.querySelector(
              `.slidev-page-${slide} .slide-frame`,
            )?.style.getPropertyValue('--presentation-accent').trim() ?? null
            return {
              local: accent(26),
              next: accent(27),
              root: document.documentElement.style
                .getPropertyValue('--presentation-accent').trim(),
            }
          })
          assert.deepEqual(mounted, {
            local: localAccentA,
            next: deckAccent,
            root: '',
          })
        } finally {
          await page.close()
        }
      }
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US5 source order, authored numbering, and sequence rails share exact geometry', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })

  const inspectSequence = async ({
    marker,
    mode,
    page,
    rootSelector,
    slide,
  }) => {
    await waitForSlide(
      page,
      page.__qualityBaseUrl,
      slide,
      mode,
      marker,
    )
    return page.locator(
      `.slidev-page-${slide} ${rootSelector}`,
    ).evaluate((root) => {
      const list = root.querySelector(':scope > ol')
      if (!list) {
        return {
          itemCount: 0,
          list: null,
          listAfterContent: 'none',
          listBeforeContent: 'none',
        }
      }

      const toNumber = value => Number.parseFloat(value)
      const pseudoGeometry = (item, pseudo) => {
        const itemRect = item.getBoundingClientRect()
        const style = getComputedStyle(item, pseudo)
        const left = toNumber(style.left)
        const top = toNumber(style.top)
        const width = toNumber(style.width)
        const height = toNumber(style.height)
        const bottom = toNumber(style.bottom)
        return {
          backgroundColor: style.backgroundColor,
          borderLeftWidth: style.borderLeftWidth,
          centerX: Number.isFinite(left) && Number.isFinite(width)
            ? itemRect.left + left + width / 2
            : null,
          centerY: Number.isFinite(top) && Number.isFinite(height)
            ? itemRect.top + top + height / 2
            : null,
          content: style.content,
          endY: Number.isFinite(bottom)
            ? itemRect.bottom - bottom
            : null,
          height: Number.isFinite(height) ? height : null,
          startY: Number.isFinite(top) ? itemRect.top + top : null,
          width: Number.isFinite(width) ? width : null,
        }
      }
      const items = [...list.querySelectorAll(':scope > li')].map((item) => {
        const itemRect = item.getBoundingClientRect()
        const itemStyle = getComputedStyle(item)
        const label = item.querySelector(
          ':scope > :is(time, strong):first-child',
        )
        const labelRect = label?.getBoundingClientRect()
        const labelStyle = label ? getComputedStyle(label) : null
        return {
          after: pseudoGeometry(item, '::after'),
          before: pseudoGeometry(item, '::before'),
          borderLeftWidth: itemStyle.borderLeftWidth,
          label: label && labelRect && labelStyle
            ? {
                borderRadius: labelStyle.borderRadius,
                borderWidth: labelStyle.borderWidth,
                datetime: label.getAttribute('datetime'),
                display: labelStyle.display,
                height: labelRect.height,
                lineHeight: labelStyle.lineHeight,
                relativeLeft: labelRect.left - itemRect.left,
                relativeTop: labelRect.top - itemRect.top,
                tagName: label.tagName.toLowerCase(),
                text: label.textContent?.replace(/\s+/g, ' ').trim(),
              }
            : null,
          listStyleType: itemStyle.listStyleType,
          text: item.textContent?.replace(/\s+/g, ' ').trim(),
          value: item.getAttribute('value'),
        }
      })
      return {
        itemCount: items.length,
        items,
        list: {
          role: list.getAttribute('role'),
          start: list.getAttribute('start'),
          tagName: list.tagName.toLowerCase(),
        },
        listAfterContent: getComputedStyle(list, '::after').content,
        listBeforeContent: getComputedStyle(list, '::before').content,
      }
    })
  }

  const assertNoOrphanConnector = (state, label) => {
    assert.ok(state.itemCount <= 1, label)
    assert.ok(state.items?.every(
      item => item.after.content === 'none',
    ) ?? true, JSON.stringify({ label, state }, null, 2))
  }

  const assertCenterToCenter = (state, label) => {
    assert.ok(state.itemCount >= 2, label)
    for (let index = 0; index < state.items.length; index += 1) {
      const item = state.items[index]
      assert.notEqual(item.before.content, 'none', `${label}: node ${index}`)
      assert.ok(
        item.before.width > 0 && item.before.height > 0,
        JSON.stringify({ label, item }, null, 2),
      )
      if (index === state.items.length - 1) {
        assert.equal(item.after.content, 'none', `${label}: last connector`)
        continue
      }
      const next = state.items[index + 1]
      assert.notEqual(item.after.content, 'none', `${label}: connector ${index}`)
      assert.ok(
        Math.abs(item.after.centerX - item.before.centerX) <= 1,
        JSON.stringify({ label, item }, null, 2),
      )
      assert.ok(
        Math.abs(item.after.startY - item.before.centerY) <= 1,
        JSON.stringify({ label, item }, null, 2),
      )
      assert.ok(
        Math.abs(item.after.endY - next.before.centerY) <= 1,
        JSON.stringify({ label, item, next }, null, 2),
      )
    }
  }

  try {
    for (const preset of expandedPresets) {
      const page = await context.newPage()
      page.__qualityBaseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      try {
        for (const mode of expandedModes) {
          const stepsZero = await inspectSequence({
            marker: 'us4-steps-zero',
            mode,
            page,
            rootSelector: '.presentation-steps',
            slide: 34,
          })
          assert.equal(stepsZero.itemCount, 0)
          assert.equal(stepsZero.list, null)

          const stepsOne = await inspectSequence({
            marker: 'us4-steps-one',
            mode,
            page,
            rootSelector: '.presentation-steps',
            slide: 35,
          })
          assert.equal(stepsOne.list.tagName, 'ol')
          assert.equal(stepsOne.list.role, null)
          assert.equal(stepsOne.items[0].text, 'Freeze the reviewed dataset.')
          assertNoOrphanConnector(stepsOne, `${preset}/${mode}/steps-one`)

          const stepsMany = await inspectSequence({
            marker: 'us4-steps-many',
            mode,
            page,
            rootSelector: '.presentation-steps',
            slide: 36,
          })
          assert.deepEqual(
            stepsMany.items.map(item => item.text),
            [
              'Collect · 采集 raw observations and environment details.',
              'Normalize · 规范化 measurements without discarding provenance.',
              'Validate · 验证 assumptions, uncertainty, and exclusions.',
              'Publish · 发布 evidence with a rerunnable audit trail.',
            ],
          )
          assert.ok(stepsMany.items.every(
            item => item.listStyleType === 'none',
          ))
          assertCenterToCenter(stepsMany, `${preset}/${mode}/steps-many`)

          const timelineZero = await inspectSequence({
            marker: 'us4-timeline-zero',
            mode,
            page,
            rootSelector: '.presentation-timeline',
            slide: 37,
          })
          assert.equal(timelineZero.itemCount, 0)
          assert.equal(timelineZero.list, null)

          const timelineOne = await inspectSequence({
            marker: 'us4-timeline-one',
            mode,
            page,
            rootSelector: '.presentation-timeline',
            slide: 38,
          })
          assert.equal(timelineOne.list.tagName, 'ol')
          assert.equal(timelineOne.list.role, null)
          assertNoOrphanConnector(
            timelineOne,
            `${preset}/${mode}/timeline-one`,
          )

          const timelineMany = await inspectSequence({
            marker: 'us4-timeline-many',
            mode,
            page,
            rootSelector: '.presentation-timeline',
            slide: 39,
          })
          assert.ok(timelineMany.items.every(item => (
            item.listStyleType === 'none'
            && item.borderLeftWidth === '0px'
          )))
          assert.deepEqual(
            timelineMany.items.map(item => item.text),
            [
              'Sep 2024 — Dataset frozen.',
              'Feb 2025 — Evaluation completed.',
              'Today · 今天 — Results and uncertainty released.',
              'Next — Independent replication and bilingual documentation.',
            ],
          )
          assert.deepEqual(
            timelineMany.items.slice(0, 2).map(item => item.label?.datetime),
            ['2024-09', '2025-02'],
          )
          const [dated, , undated] = timelineMany.items.map(
            item => item.label,
          )
          assert.equal(dated.tagName, 'time')
          assert.equal(undated.tagName, 'strong')
          assert.equal(dated.display, 'inline-flex')
          assert.equal(undated.display, 'inline-flex')
          assert.equal(dated.borderRadius, undated.borderRadius)
          assert.equal(dated.borderWidth, undated.borderWidth)
          assert.equal(dated.lineHeight, undated.lineHeight)
          assert.ok(Math.abs(dated.relativeLeft - undated.relativeLeft) <= 1)
          assert.ok(Math.abs(dated.relativeTop - undated.relativeTop) <= 1)
          assert.ok(Math.abs(dated.height - undated.height) <= 1)
          assertCenterToCenter(
            timelineMany,
            `${preset}/${mode}/timeline-many`,
          )

          const customSteps = await inspectSequence({
            marker: 'visual-sequences-custom',
            mode,
            page,
            rootSelector: '[data-quality-case="visual-sequences-custom"] .presentation-steps',
            slide: 55,
          })
          assert.equal(customSteps.list.start, '4')
          assert.deepEqual(
            customSteps.items.map(item => item.value),
            [null, '8', null],
          )
          assert.ok(customSteps.items.every((item, index) => {
            const expected = ['4', '8', '9'][index]
            return [
              expected,
              `"${expected}"`,
              'counter(list-item)',
            ].includes(item.before.content)
          }), JSON.stringify(customSteps, null, 2))
          assertCenterToCenter(
            customSteps,
            `${preset}/${mode}/steps-custom`,
          )

          const customTimeline = await inspectSequence({
            marker: 'visual-sequences-custom',
            mode,
            page,
            rootSelector: '[data-quality-case="visual-sequences-custom"] .presentation-timeline',
            slide: 55,
          })
          assert.deepEqual(
            customTimeline.items.map(item => item.label?.tagName ?? null),
            ['time', 'strong', null],
          )
          assertCenterToCenter(
            customTimeline,
            `${preset}/${mode}/timeline-custom`,
          )
          assert.equal(customTimeline.listBeforeContent, 'none')
          assert.equal(customTimeline.listAfterContent, 'none')
        }
      } finally {
        await page.close()
      }
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US4 code, sequence, status, and keyboard contracts preserve native meaning', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  try {
    const page = await context.newPage()
    const baseUrl = buildContext.builds['expanded-default'].baseUrl
    const onSlide = (slide, selector) => (
      page.locator(`.slidev-page-${slide} ${selector}`)
    )
    try {
      await waitForSlide(page, baseUrl, 32, 'light', 'us4-code-titled')
      assert.equal(await onSlide(32, '.presentation-code-layout h1').count(), 1)
      assert.match(
        await onSlide(32, '.presentation-code-layout h1').textContent(),
        /Solver implementation/,
      )
      const titledCode = await onSlide(
        32,
        '.presentation-code-layout .slidev-code-wrapper',
      ).evaluate((wrapper) => {
        const content = wrapper.closest('.slide-frame__content')
        const pre = wrapper.querySelector('pre')
        const code = wrapper.querySelector('code')
        const wrapperRect = wrapper.getBoundingClientRect()
        const style = getComputedStyle(wrapper)
        return {
          codeSpanCount: code?.querySelectorAll('span').length ?? 0,
          contentWidth: content?.clientWidth ?? 0,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          preCount: pre ? 1 : 0,
          scrollHeight: wrapper.scrollHeight,
          scrollWidth: wrapper.scrollWidth,
          width: wrapperRect.width,
        }
      })
      assert.equal(titledCode.preCount, 1)
      assert.ok(titledCode.codeSpanCount > 0)
      assert.ok(
        Math.abs(titledCode.width - titledCode.contentWidth) <= 2,
        JSON.stringify(titledCode),
      )
      assert.match(titledCode.overflowX, /auto|scroll/)
      assert.ok(titledCode.scrollWidth > titledCode.width)

      await waitForSlide(page, baseUrl, 33, 'light', 'us4-code-titleless')
      assert.equal(await onSlide(33, '.presentation-code-layout h1').count(), 0)
      const titlelessCode = await onSlide(
        33,
        '.presentation-code-layout .slidev-code-wrapper',
      ).evaluate((wrapper) => {
        const content = wrapper.closest('.slide-frame__content')
        const frame = wrapper.closest('.slide-frame')
        return {
          clientHeight: wrapper.clientHeight,
          contentOverflow: content
            ? {
                clientHeight: content.clientHeight,
                scrollHeight: content.scrollHeight,
              }
            : null,
          frameOverflow: frame
            ? {
                clientHeight: frame.clientHeight,
                clientWidth: frame.clientWidth,
                scrollHeight: frame.scrollHeight,
                scrollWidth: frame.scrollWidth,
              }
            : null,
          overflowY: getComputedStyle(wrapper).overflowY,
          scrollHeight: wrapper.scrollHeight,
        }
      })
      assert.match(titlelessCode.overflowY, /auto|scroll/)
      assert.ok(titlelessCode.scrollHeight > titlelessCode.clientHeight)
      assert.ok(
        titlelessCode.contentOverflow.scrollHeight
          <= titlelessCode.contentOverflow.clientHeight + 1,
      )
      assert.ok(
        titlelessCode.frameOverflow.scrollHeight
          <= titlelessCode.frameOverflow.clientHeight + 1,
      )
      assert.ok(
        titlelessCode.frameOverflow.scrollWidth
          <= titlelessCode.frameOverflow.clientWidth + 1,
      )

      await waitForSlide(page, baseUrl, 34, 'light', 'us4-steps-zero')
      assert.equal(await onSlide(34, '.presentation-steps').count(), 1)
      assert.equal(await onSlide(34, '.presentation-steps ol').count(), 0)
      assert.match(
        await onSlide(34, '.presentation-steps').textContent(),
        /receives no sequence decoration/,
      )

      await waitForSlide(page, baseUrl, 35, 'light', 'us4-steps-one')
      assert.equal(await onSlide(35, '.presentation-steps ol').count(), 1)
      assert.equal(await onSlide(35, '.presentation-steps li').count(), 1)
      assert.equal(
        await onSlide(35, '.presentation-steps li')
          .evaluate(element => getComputedStyle(element, '::after').content),
        'none',
      )

      await waitForSlide(page, baseUrl, 36, 'light', 'us4-steps-many')
      const stepItems = onSlide(36, '.presentation-steps > ol > li')
      assert.equal(await stepItems.count(), 4)
      assert.deepEqual(
        (await stepItems.allTextContents()).map(value => value.trim()),
        [
          'Collect · 采集 raw observations and environment details.',
          'Normalize · 规范化 measurements without discarding provenance.',
          'Validate · 验证 assumptions, uncertainty, and exclusions.',
          'Publish · 发布 evidence with a rerunnable audit trail.',
        ],
      )
      assert.notEqual(
        await stepItems.first()
          .evaluate(element => getComputedStyle(element, '::after').content),
        'none',
      )
      assert.equal(
        await stepItems.last()
          .evaluate(element => getComputedStyle(element, '::after').content),
        'none',
      )

      await waitForSlide(page, baseUrl, 37, 'light', 'us4-timeline-zero')
      assert.equal(await onSlide(37, '.presentation-timeline ol').count(), 0)

      await waitForSlide(page, baseUrl, 38, 'light', 'us4-timeline-one')
      assert.equal(await onSlide(38, '.presentation-timeline li').count(), 1)
      assert.equal(await onSlide(38, '.presentation-timeline time').count(), 0)

      await waitForSlide(page, baseUrl, 39, 'light', 'us4-timeline-many')
      const timelineItems = onSlide(39, '.presentation-timeline > ol > li')
      assert.equal(await timelineItems.count(), 4)
      assert.deepEqual(
        await onSlide(39, '.presentation-timeline time')
          .evaluateAll(elements => elements.map(element => ({
            datetime: element.getAttribute('datetime'),
            text: element.textContent,
          }))),
        [
          { datetime: '2024-09', text: 'Sep 2024' },
          { datetime: '2025-02', text: 'Feb 2025' },
        ],
      )
      assert.notEqual(
        await timelineItems.first()
          .evaluate(element => getComputedStyle(element, '::after').content),
        'none',
      )
      assert.equal(
        await timelineItems.last()
          .evaluate(element => getComputedStyle(element, '::after').content),
        'none',
      )

      await waitForSlide(page, baseUrl, 40, 'light', 'us4-status-labels')
      const labels = await onSlide(
        40,
        '.presentation-tag, .presentation-badge',
      ).evaluateAll(elements => elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          borderRadius: style.borderRadius,
          className: element.className,
          pseudo: getComputedStyle(element, '::before').content,
          role: element.getAttribute('role'),
          tabIndex: element.getAttribute('tabindex'),
          tagName: element.tagName.toLowerCase(),
        }
      }))
      assert.equal(labels.length, 4)
      assert.deepEqual(labels.map(label => label.tagName), [
        'span',
        'span',
        'span',
        'span',
      ])
      assert.ok(labels.every(label => label.role === null))
      assert.ok(labels.every(label => label.tabIndex === null))
      assert.notEqual(labels[0].borderRadius, labels[2].borderRadius)
      assert.notEqual(labels[0].background, labels[2].background)
      assert.equal(labels[0].pseudo, 'none')
      assert.equal(labels[2].pseudo, 'none')

      await waitForSlide(page, baseUrl, 41, 'light', 'us4-keyboard')
      const single = onSlide(41, '.presentation-kbd--single')
      assert.equal(await single.count(), 2)
      assert.deepEqual(
        (await single.allTextContents()).map(value => value.trim()),
        ['Esc', 'Fallback key'],
      )
      const chords = onSlide(41, '.presentation-kbd-sequence:visible')
      assert.equal(await chords.count(), 2)
      assert.deepEqual(
        await chords.evaluateAll(elements => elements.map(element => ({
          ariaLabel: element.getAttribute('aria-label'),
          accessibleText: element.querySelector(
            '.presentation-kbd-accessible',
          )?.textContent,
          innerKeys: [...element.querySelectorAll(':scope > kbd')]
            .map(key => key.textContent),
          separators: [...element.querySelectorAll(
            ':scope > .presentation-kbd-separator',
          )].map(separator => separator.textContent),
          tabIndex: element.getAttribute('tabindex'),
          tagName: element.tagName.toLowerCase(),
        }))),
        [
          {
            ariaLabel: null,
            accessibleText: 'Ctrl plus Shift plus P',
            innerKeys: ['Ctrl', 'Shift', 'P'],
            separators: ['+', '+'],
            tabIndex: null,
            tagName: 'span',
          },
          {
            ariaLabel: null,
            accessibleText: '⌘ plus K plus 语言',
            innerKeys: ['⌘', 'K', '语言'],
            separators: ['+', '+'],
            tabIndex: null,
            tagName: 'span',
          },
        ],
      )
      const guardedChord = onSlide(
        41,
        '[data-quality-kbd-runtime-guard] .presentation-kbd-sequence',
      )
      assert.equal(await guardedChord.count(), 1)
      assert.deepEqual(
        await guardedChord.locator('.presentation-kbd-key').allTextContents(),
        ['Ctrl', 'P'],
      )
      assert.equal(await onSlide(41, 'button').count(), 0)
      // Keycaps are descriptive text. The surrounding slide may be keyboard-scrollable.
      assert.equal(await onSlide(41, '[data-quality-case="us4-keyboard"] [tabindex]').count(), 0)
    } finally {
      await page.close()
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US5 tasks stay presentation-only and prose highlights stay code-scoped', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  try {
    const page = await context.newPage()
    const baseUrl = buildContext.builds['expanded-default'].baseUrl
    const onSlide = (slide, selector) => (
      page.locator(`.slidev-page-${slide} ${selector}`)
    )
    const inspectTasks = async (slide, marker) => {
      await waitForSlide(page, baseUrl, slide, 'light', marker)
      return onSlide(slide, 'input[type="checkbox"]').evaluateAll(inputs => (
        inputs.map((input) => {
          const item = input.closest('li')
          const itemStyle = item ? getComputedStyle(item) : null
          const before = item ? getComputedStyle(item, '::before') : null
          const after = item ? getComputedStyle(item, '::after') : null
          return {
            afterBorderBottomWidth: after?.borderBottomWidth,
            afterBorderLeftWidth: after?.borderLeftWidth,
            afterContent: after?.content,
            checked: input.checked,
            dataPresentationTask: input.dataset.presentationTask,
            disabled: input.disabled,
            itemFontWeight: itemStyle?.fontWeight,
            itemPaddingLeft: itemStyle?.paddingLeft,
            markerBorderStyle: before?.borderStyle,
            markerContent: before?.content,
            tabIndex: input.tabIndex,
          }
        })
      ))
    }

    try {
      const nativeTasks = await inspectTasks(42, 'us5-tasks-native')
      assert.deepEqual(
        nativeTasks.map(task => task.checked),
        [false, true, false, true, false, true],
      )
      assert.ok(nativeTasks.every(task => task.disabled))
      assert.ok(nativeTasks.every(task => task.tabIndex === -1))
      assert.ok(nativeTasks.every(
        task => task.dataPresentationTask === 'true',
      ))
      assert.ok(nativeTasks.every(task => task.markerContent !== 'none'))
      assert.ok(nativeTasks.every(task => task.markerBorderStyle !== 'none'))
      assert.ok(nativeTasks.every(
        task => Number.parseFloat(task.itemPaddingLeft) > 0,
      ))
      assert.equal(nativeTasks[0].afterContent, 'none')
      assert.notEqual(nativeTasks[1].afterContent, 'none')
      assert.notEqual(nativeTasks[1].afterBorderLeftWidth, '0px')
      assert.notEqual(nativeTasks[1].afterBorderBottomWidth, '0px')
      assert.notEqual(nativeTasks[1].itemFontWeight, nativeTasks[0].itemFontWeight)

      const beforeAttempt = await onSlide(42, 'input[type="checkbox"]')
        .evaluateAll(inputs => inputs.map(input => input.checked))
      await onSlide(42, 'input[type="checkbox"]').first()
        .evaluate((input) => {
          input.click()
          input.focus()
          input.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true,
            key: ' ',
          }))
        })
      assert.deepEqual(
        await onSlide(42, 'input[type="checkbox"]')
          .evaluateAll(inputs => inputs.map(input => input.checked)),
        beforeAttempt,
      )
      assert.equal(
        await page.evaluate(() => document.activeElement?.matches(
          'input[type="checkbox"]',
        )),
        false,
      )

      const nestedGeometry = await onSlide(
        42,
        'li:has(> ul input[type="checkbox"])',
      ).first().evaluate((parent) => {
        const nested = parent.querySelector('ul li')
        const longLabel = parent.closest('ul')?.querySelectorAll(':scope > li')[2]
        return {
          longLabelHeight: longLabel?.getBoundingClientRect().height ?? 0,
          nestedLeft: nested?.getBoundingClientRect().left ?? 0,
          parentLeft: parent.getBoundingClientRect().left,
        }
      })
      assert.ok(nestedGeometry.nestedLeft > nestedGeometry.parentLeft)
      assert.ok(nestedGeometry.longLabelHeight > 24)

      const generatedTasks = await inspectTasks(43, 'us5-tasks-generated')
      assert.deepEqual(
        generatedTasks.map(task => task.checked),
        [false, true, false],
      )
      assert.ok(generatedTasks.every(task => task.disabled))
      assert.ok(generatedTasks.every(task => task.tabIndex === -1))

      await page.evaluate(() => {
        const canvas = document.querySelector(
          '.slidev-page-43 .slidev-layout',
        )
        const list = document.createElement('ul')
        list.dataset.qualityDynamicTasks = 'true'
        list.className = 'contains-task-list'
        list.innerHTML = `
          <li class="task-list-item">
            <input type="checkbox" checked>
            Later-added checked task.
          </li>
        `
        canvas?.querySelector('.slide-frame__content')?.append(list)
      })
      await page.waitForFunction(() => {
        const input = document.querySelector(
          '[data-quality-dynamic-tasks] input',
        )
        return input instanceof HTMLInputElement
          && input.disabled
          && input.tabIndex === -1
          && input.checked
          && input.dataset.presentationTask === 'true'
      })

      await page.evaluate(() => {
        const canvas = document.querySelector(
          '.slidev-page-43 .slidev-layout',
        )
        const list = document.createElement('ul')
        list.dataset.qualityInteractiveCheckbox = 'true'
        list.innerHTML = `
          <li>
            <label>
              <input type="checkbox">
              Interactive form control
            </label>
          </li>
        `
        canvas?.querySelector('.slide-frame__content')?.append(list)
      })
      await page.evaluate(() => new Promise(resolve => (
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )))
      const interactiveCheckbox = await onSlide(
        43,
        '[data-quality-interactive-checkbox] input',
      ).evaluate((input) => {
        const style = getComputedStyle(input)
        return {
          dataPresentationTask: input.dataset.presentationTask ?? null,
          disabled: input.disabled,
          opacity: style.opacity,
          pointerEvents: style.pointerEvents,
          tabIndex: input.tabIndex,
        }
      })
      assert.deepEqual(interactiveCheckbox, {
        dataPresentationTask: null,
        disabled: false,
        opacity: '1',
        pointerEvents: 'auto',
        tabIndex: 0,
      })

      await waitForSlide(page, baseUrl, 44, 'light', 'us5-highlights')
      const highlightStyles = await onSlide(
        44,
        '[data-highlight-case]',
      ).evaluateAll(elements => elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          borderBottomColor: style.borderBottomColor,
          borderBottomWidth: style.borderBottomWidth,
          boxShadow: style.boxShadow,
          color: style.color,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          paddingTop: style.paddingTop,
        }
      }))
      assert.equal(highlightStyles.length, 2)
      assert.deepEqual(highlightStyles[0], highlightStyles[1])
      assert.notEqual(highlightStyles[0].background, 'rgba(0, 0, 0, 0)')
      assert.equal(highlightStyles[0].borderBottomWidth, '0px')
      assert.equal(highlightStyles[0].boxShadow, 'none')

      const adjacent = await onSlide(
        44,
        '[data-quality-case="us5-highlights"]',
      ).evaluate((root) => {
        const style = element => getComputedStyle(element)
        const link = root.querySelector('a')
        const emphasis = root.querySelector('em')
        const inlineCode = root.querySelector(':not(pre) > code')
        const highlight = root.querySelector('[data-highlight-case="native"]')
        return {
          emphasisFontStyle: style(emphasis).fontStyle,
          highlightBackground: style(highlight).backgroundColor,
          inlineCodeBackground: style(inlineCode).backgroundColor,
          inlineCodeFont: style(inlineCode).fontFamily,
          linkBackground: style(link).backgroundColor,
          linkDecoration: style(link).textDecorationLine,
        }
      })
      assert.equal(adjacent.emphasisFontStyle, 'italic')
      assert.match(adjacent.linkDecoration, /underline/)
      assert.notEqual(
        adjacent.inlineCodeBackground,
        adjacent.highlightBackground,
      )
      assert.notEqual(adjacent.linkBackground, adjacent.highlightBackground)
      assert.match(adjacent.inlineCodeFont, /JetBrains Mono|monospace/i)

      const codeScope = await onSlide(
        44,
        '[data-highlight-code-scope] mark',
      ).evaluateAll(elements => elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          borderBottomWidth: style.borderBottomWidth,
          boxShadow: style.boxShadow,
          padding: style.padding,
        }
      }))
      assert.equal(codeScope.length, 2)
      for (const style of codeScope) {
        assert.equal(style.background, 'rgba(0, 0, 0, 0)')
        assert.equal(style.borderBottomWidth, '0px')
        assert.equal(style.boxShadow, 'none')
        assert.equal(style.padding, '0px')
      }
      assert.equal(
        await onSlide(
          44,
          'pre:not([data-highlight-code-scope]) mark',
        ).count(),
        0,
      )

      const taskSetupSource = await readFile(
        resolve(repositoryRoot, 'setup/task-lists.ts'),
        'utf8',
      )
      assert.doesNotMatch(
        taskSetupSource,
        /markdown-it|remark|unified|parser|converter/i,
      )
      assert.doesNotMatch(taskSetupSource, /(['"`])==.*==\1/)
    } finally {
      await page.close()
    }
  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})

test('US6 closing, chrome, section branding, and bilingual text converge', {
  timeout: 240_000,
}, async () => {
  const buildContext = await createExpandedContentContext()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })

  const inspectClosing = page => page.locator(
    '.slidev-layout:visible .presentation-closing',
  ).evaluate((root) => {
    const content = root.closest('.slide-frame__content')
    const message = root.querySelector('.presentation-closing__message')
    const rect = (element) => {
      const bounds = element.getBoundingClientRect()
      return {
        bottom: bounds.bottom,
        centerX: bounds.left + bounds.width / 2,
        centerY: bounds.top + bounds.height / 2,
        height: bounds.height,
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        width: bounds.width,
      }
    }
    return {
      childClasses: [...root.children].map(element => element.className),
      className: root.className,
      content: rect(content),
      message: rect(message),
      messageTextAlign: getComputedStyle(message).textAlign,
      root: rect(root),
      state: root.getAttribute('data-closing-state'),
    }
  })

  const intersects = (left, right) => !(
    left.right <= right.left
    || left.left >= right.right
    || left.bottom <= right.top
    || left.top >= right.bottom
  )

  try {
    for (const preset of expandedPresets) {
      const page = await context.newPage()
      const baseUrl = buildContext.builds[`expanded-${preset}`].baseUrl
      try {
        for (const mode of expandedModes) {
          await waitForSlide(page, baseUrl, 14, mode, 'us2-end-minimal')
          const minimal = await inspectClosing(page)
          assert.equal(minimal.state, 'minimal')
          assert.match(minimal.className, /presentation-closing--minimal/)
          assert.deepEqual(
            minimal.childClasses,
            ['presentation-closing__message'],
          )
          assert.equal(minimal.messageTextAlign, 'left')
          assert.ok(Math.abs(
            minimal.message.left - minimal.content.left,
          ) <= 1, JSON.stringify(minimal))
          assert.ok(Math.abs(
            minimal.message.centerY - minimal.content.centerY,
          ) <= 1, JSON.stringify(minimal))
          assert.ok(minimal.message.width <= minimal.content.width)

          await waitForSlide(
            page,
            baseUrl,
            16,
            mode,
            'us2-closing-metadata',
          )
          const rich = await inspectClosing(page)
          assert.equal(rich.state, 'rich')
          assert.match(rich.className, /presentation-closing--rich/)
          assert.deepEqual(
            rich.childClasses.map(className => (
              className.split(/\s+/).find(value => (
                value.startsWith('presentation-closing__')
              ))
            )),
            [
              'presentation-closing__message',
              'presentation-closing__contact',
              'presentation-closing__authors',
              'presentation-closing__logo',
            ],
          )
          assert.ok(rich.root.left >= rich.content.left - 1)
          assert.ok(rich.root.right <= rich.content.right + 1)
          assert.ok(rich.root.top >= rich.content.top - 1)
          assert.ok(rich.root.bottom <= rich.content.bottom + 1)

          await waitForSlide(page, baseUrl, 19, mode, 'us2-closing-omitted')
          const omitted = await inspectClosing(page)
          assert.equal(omitted.state, 'minimal')
          assert.deepEqual(
            omitted.childClasses,
            ['presentation-closing__message'],
          )

          await waitForSlide(
            page,
            baseUrl,
            56,
            mode,
            'visual-chrome-safe-zone',
          )
          const chrome = await page.locator(
            '.slidev-page-56 .slide-frame',
          ).evaluate((frame) => {
            const header = frame.querySelector('.slide-frame__header')
            const footer = frame.querySelector('.slide-frame__footer')
            const item = frame.querySelector(
              '[data-quality-case="visual-chrome-safe-zone"] li',
            )
            const headerCell = frame.querySelector(
              '[data-quality-case="visual-chrome-safe-zone"] th',
            )
            const frameStyle = getComputedStyle(frame)
            const headerStyle = getComputedStyle(header)
            const inspect = () => {
              const roleProbe = document.createElement('span')
              roleProbe.style.color = 'var(--presentation-chrome-accent)'
              frame.append(roleProbe)
              const roleColor = getComputedStyle(roleProbe).color
              roleProbe.remove()
              return {
                frameAccent: frameStyle.getPropertyValue(
                  '--presentation-accent',
                ),
                frameChrome: frameStyle.getPropertyValue(
                  '--presentation-chrome-accent',
                ),
                footerCap: getComputedStyle(
                  footer,
                  '::before',
                ).backgroundColor,
                footerRule: getComputedStyle(footer).borderTopColor,
                headerAccent: headerStyle.getPropertyValue(
                  '--presentation-accent',
                ),
                headerChrome: headerStyle.getPropertyValue(
                  '--presentation-chrome-accent',
                ),
                headerRule: getComputedStyle(header).borderBottomColor,
                marker: getComputedStyle(item, '::marker').color,
                roleColor,
                tableHeaderRule: getComputedStyle(
                  headerCell,
                ).borderBottomColor,
              }
            }
            frame.style.setProperty('--presentation-accent', '#5b4fc4')
            const initial = inspect()
            frame.style.setProperty('--presentation-accent', '#c2410c')
            const changed = inspect()
            return { changed, initial }
          })
          for (const state of [chrome.initial, chrome.changed]) {
            assert.equal(
              state.headerRule,
              state.roleColor,
              JSON.stringify(chrome, null, 2),
            )
            assert.equal(state.footerRule, state.roleColor)
            assert.equal(state.tableHeaderRule, state.roleColor)
            assert.equal(state.marker, state.roleColor)
            if (preset === 'ict') {
              assert.equal(state.footerCap, state.roleColor)
            }
          }
          assert.notEqual(chrome.changed.roleColor, chrome.initial.roleColor)

          await waitForSlide(
            page,
            baseUrl,
            58,
            mode,
            'visual-brand-collision',
          )
          const safeZone = await page.locator(
            '.slidev-page-58 .slide-frame',
          ).evaluate((frame) => {
            const visible = element => {
              if (!element) return false
              const style = getComputedStyle(element)
              const rect = element.getBoundingClientRect()
              return style.display !== 'none'
                && style.visibility !== 'hidden'
                && rect.width > 0
                && rect.height > 0
            }
            const toRect = (element) => {
              const rect = element.getBoundingClientRect()
              return {
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                top: rect.top,
              }
            }
            const mark = [
              ...frame.querySelectorAll(
                '.slide-frame__ucas-wordmark, .slide-frame__ict-lockup',
              ),
            ].find(visible)
            const probes = [
              ...frame.querySelectorAll(
                '[data-quality-case="visual-brand-collision"] :is(h1, figure, figcaption, a, button)',
              ),
            ].filter(visible)
            return {
              backgroundColor: getComputedStyle(frame).backgroundColor,
              identityImageCount: frame.querySelectorAll(
                'img[class*="slide-frame__ucas"], img[class*="slide-frame__ict"]',
              ).length,
              isSection: frame.closest('.slidev-layout')?.classList.contains(
                'section',
              ) ?? false,
              mark: mark ? toRect(mark) : null,
              probes: probes.map(element => ({
                rect: toRect(element),
                tagName: element.tagName.toLowerCase(),
              })),
            }
          })
          assert.equal(safeZone.isSection, true)
          assert.ok(safeZone.probes.length >= 5, JSON.stringify(safeZone))
          if (preset === 'default') {
            assert.equal(safeZone.identityImageCount, 0)
            assert.equal(safeZone.mark, null)
          } else {
            assert.equal(
              safeZone.backgroundColor,
              mode === 'dark'
                ? (preset === 'ucas' ? 'rgb(18, 61, 105)' : 'rgb(16, 31, 43)')
                : (preset === 'ucas' ? 'rgb(237, 242, 246)' : 'rgb(245, 249, 250)'),
            )
            assert.equal(safeZone.identityImageCount, 1)
            assert.ok(safeZone.mark, JSON.stringify(safeZone))
            assert.ok(
              safeZone.probes.every(
                probe => !intersects(safeZone.mark, probe.rect),
              ),
              JSON.stringify(safeZone, null, 2),
            )
          }

          await waitForSlide(
            page,
            baseUrl,
            61,
            mode,
            'visual-section-header',
          )
          const headerSafeBrand = await page.locator(
            '.slidev-page-61 .slide-frame',
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
            const toRect = (element) => {
              const rect = element.getBoundingClientRect()
              return {
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                top: rect.top,
              }
            }
            const header = frame.querySelector('.slide-frame__header')
            const lockups = [...frame.querySelectorAll(
              '.slide-frame__ucas-wordmark, .slide-frame__ict-lockup--section',
            )]
            return {
              header: visible(header) ? toRect(header) : null,
              identityImageCount: frame.querySelectorAll(
                'img[class*="slide-frame__ucas"], img[class*="slide-frame__ict"]',
              ).length,
              lockupCount: lockups.length,
            }
          })
          assert.ok(headerSafeBrand.header, JSON.stringify(headerSafeBrand))
          assert.equal(headerSafeBrand.lockupCount, 0)
          assert.equal(headerSafeBrand.identityImageCount, 0)

          await waitForSlide(
            page,
            baseUrl,
            57,
            mode,
            'visual-bilingual-heading',
          )
          const bilingual = await page.locator(
            '.slidev-page-57 [data-quality-case="visual-bilingual-heading"]',
          ).evaluate(async (root) => {
            const separatorState = element => {
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
              )
              const records = []
              let node
              while ((node = walker.nextNode())) {
                for (
                  let index = node.data.indexOf('·');
                  index >= 0;
                  index = node.data.indexOf('·', index + 1)
                ) {
                  const preceding = document.createRange()
                  preceding.setStart(node, Math.max(0, index - 1))
                  preceding.setEnd(node, index)
                  const separator = document.createRange()
                  separator.setStart(node, index)
                  separator.setEnd(node, index + 1)
                  records.push({
                    preceding: node.data[index - 1],
                    precedingTop: preceding.getBoundingClientRect().top,
                    separatorTop: separator.getBoundingClientRect().top,
                  })
                }
              }
              return {
                records,
                text: element.textContent,
              }
            }
            const dynamic = document.createElement('h3')
            dynamic.dataset.dynamicBilingual = 'true'
            dynamic.textContent = 'Dynamic evidence · 动态证据'
            root.append(dynamic)
            await new Promise(resolveFrame => requestAnimationFrame(
              () => requestAnimationFrame(resolveFrame),
            ))
            const first = dynamic.textContent
            dynamic.remove()
            root.append(dynamic)
            await new Promise(resolveFrame => requestAnimationFrame(
              () => requestAnimationFrame(resolveFrame),
            ))
            return {
              dynamicFirst: first,
              dynamicSecond: dynamic.textContent,
              headings: [...root.querySelectorAll('h1, h2')]
                .map(separatorState),
            }
          })
          assert.ok(bilingual.headings.every(heading => (
            heading.records.length > 0
            && heading.records.every(record => (
              record.preceding === '\u00a0'
              && Math.abs(record.precedingTop - record.separatorTop) <= 1
            ))
          )), JSON.stringify(bilingual, null, 2))
          assert.equal(
            bilingual.dynamicFirst,
            'Dynamic evidence\u00a0· 动态证据',
          )
          assert.equal(bilingual.dynamicSecond, bilingual.dynamicFirst)
        }
      } finally {
        await page.close()
      }
    }

  } finally {
    await context.close()
    await browser.close()
    await buildContext.close()
  }
})
})
