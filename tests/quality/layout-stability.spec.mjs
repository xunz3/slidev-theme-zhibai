import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import {
  buildDeck,
  generateExpandedContentDefinitions,
  qualityArtifactRoot,
  readQualityBuildContext,
  repositoryRoot,
  startStaticServer,
} from './helpers.mjs'

test('preset covers keep long titles, author details and images inside the canvas', {
  timeout: 240_000,
}, async () => {
  const supplied = readQualityBuildContext()
  const servers = []
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [preset, id] of [['default', 'default-only'], ['ucas', 'ucas'], ['ict', 'ict']]) {
      let baseUrl = supplied?.[id]?.baseUrl
      if (!baseUrl) {
        const outDir = resolve(qualityArtifactRoot, 'build/cover-layout', preset)
        await buildDeck({ id: `cover-layout-${preset}`, outDir, source: resolve(repositoryRoot, `fixtures/${preset}-preset.md`) })
        const server = await startStaticServer(outDir)
        servers.push(server)
        baseUrl = server.baseUrl
      }
      for (const width of [980, 720]) {
        const page = await browser.newPage({ viewport: { width, height: Math.round(width * 9 / 16) }, reducedMotion: 'reduce' })
        try {
          await page.goto(`${baseUrl}/1`, { waitUntil: 'networkidle' })
          const frame = page.locator('.slidev-page-1 .slide-frame').first()
          await frame.waitFor({ state: 'visible' })
          await page.evaluate(() => document.fonts.ready)
          const clipped = await frame.evaluate(el => {
            const content = el.querySelector('.slide-frame__content').getBoundingClientRect()
            return [...el.querySelectorAll('.slide-cover__title, .slide-cover__subtitle, .slide-cover__author, .slide-cover__visual')]
              .filter(element => {
                const rect = element.getBoundingClientRect()
                return rect.top < content.top - 1 || rect.bottom > content.bottom + 1
                  || rect.left < content.left - 1 || rect.right > content.right + 1
              })
              .map(element => element.className)
          })
          assert.deepEqual(clipped, [], `${preset}/${width}: no cover content is clipped`)
        } finally {
          await page.close()
        }
      }
    }
  } finally {
    await browser.close()
    await Promise.all(servers.map(server => server.close()))
  }
})

test('delayed media state transitions preserve reserved geometry', {
  timeout: 240_000,
}, async (t) => {
  const external = readQualityBuildContext()
  let server
  let protocolServer
  let builds = external

  if (!builds) {
    const expandedDefinitions = await generateExpandedContentDefinitions()
    const build = expandedDefinitions.find(definition => definition.preset === 'default')
    assert.ok(build)
    const protocolBuild = {
      id: 'protocol',
      outDir: resolve(qualityArtifactRoot, 'build/layout-stability/protocol'),
      source: resolve(repositoryRoot, 'fixtures/obsidian-protocol.md'),
    }
    await Promise.all([buildDeck(build), buildDeck(protocolBuild)])
    ;[server, protocolServer] = await Promise.all([
      startStaticServer(build.outDir),
      startStaticServer(protocolBuild.outDir),
    ])
    builds = {
      'expanded-default': {
        ...build,
        baseUrl: server.baseUrl,
        preset: 'default',
      },
      protocol: {
        ...protocolBuild,
        baseUrl: protocolServer.baseUrl,
        preset: 'default',
      },
    }
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    // Measure resource-driven layout changes independently of slide entry motion.
    reducedMotion: 'reduce',
    viewport: { height: 552, width: 980 },
  })

  const verifyDelayedMedia = async ({
    asset,
    buildId = 'expanded-default',
    expectedStateAttribute,
    expectedStateValue,
    fromSlide,
    id,
    outcome,
    targetSelector,
    stateSelector = targetSelector,
    targetSlide,
  }) => {
    await t.test(id, async () => {
      const page = await context.newPage()
      let releaseRoute
      let routeSeenResolve
      const routeSeen = new Promise((resolveSeen) => {
        routeSeenResolve = resolveSeen
      })
      const routeRelease = new Promise((resolveRoute) => {
        releaseRoute = resolveRoute
      })
      await page.route(url => url.pathname.endsWith(`/${asset}`), async (route) => {
        routeSeenResolve()
        await routeRelease
        if (outcome === 'failed') await route.abort('failed')
        else await route.continue()
      })

      try {
        const build = builds[buildId]
        assert.ok(build, `${id}: missing ${buildId} build`)
        await page.goto(`${build.baseUrl}/${fromSlide}`, {
          waitUntil: 'domcontentloaded',
        })
        await Promise.race([
          routeSeen,
          new Promise((_, reject) => setTimeout(
            () => reject(new Error(`${id}: delayed asset request was not observed`)),
            5_000,
          )),
        ])
        await page.locator(
          `.slidev-page-${fromSlide} .slidev-layout`,
        ).waitFor({ state: 'visible' })
        await page.keyboard.press('ArrowRight')
        const target = page.locator(
          `.slidev-page-${targetSlide} ${targetSelector}`,
        )
        await target.waitFor({ state: 'visible' })
        const before = await target.evaluate(async (root) => {
          await document.fonts?.ready
          await new Promise(resolveFrame => requestAnimationFrame(
            () => requestAnimationFrame(resolveFrame),
          ))
          const rect = (element) => {
            const bounds = element.getBoundingClientRect()
            return {
              height: Math.round(bounds.height * 1000) / 1000,
              left: Math.round(bounds.left * 1000) / 1000,
              top: Math.round(bounds.top * 1000) / 1000,
              width: Math.round(bounds.width * 1000) / 1000,
            }
          }
          const regions = [
            root,
            ...root.querySelectorAll(
              'figure, figcaption, .obsidian-slidev-media__viewport, .presentation-closing-logo, .presentation-closing__message',
            ),
          ]
          const shifts = []
          if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const attributable = entry.sources?.some((source) => {
                  const node = source.node
                  return node instanceof Node
                    && (root === node
                      || root.contains(node)
                      || node.contains?.(root))
                })
                if (attributable) shifts.push({ value: entry.value })
              }
            })
            observer.observe({ type: 'layout-shift' })
            window.__delayedMediaShiftObserver = observer
          }
          window.__delayedMediaShifts = shifts
          return regions.map(rect)
        })

        releaseRoute()
        await page.waitForFunction(
          ({ attribute, selector, value }) => (
            document.querySelector(selector)?.getAttribute(attribute) === value
          ),
          {
            attribute: expectedStateAttribute,
            selector: `.slidev-page-${targetSlide} ${stateSelector}`,
            value: expectedStateValue,
          },
        )
        await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(
          () => requestAnimationFrame(resolveFrame),
        )))
        const after = await target.evaluate((root) => {
          const rect = (element) => {
            const bounds = element.getBoundingClientRect()
            return {
              height: Math.round(bounds.height * 1000) / 1000,
              left: Math.round(bounds.left * 1000) / 1000,
              top: Math.round(bounds.top * 1000) / 1000,
              width: Math.round(bounds.width * 1000) / 1000,
            }
          }
          const regions = [
            root,
            ...root.querySelectorAll(
              'figure, figcaption, .obsidian-slidev-media__viewport, .presentation-closing-logo, .presentation-closing__message',
            ),
          ]
          window.__delayedMediaShiftObserver?.disconnect()
          return {
            geometry: regions.map(rect),
            shifts: window.__delayedMediaShifts ?? [],
          }
        })
        assert.deepEqual(after.geometry, before, `${id}: stable geometry`)
        assert.deepEqual(after.shifts, [], `${id}: target-attributed layout shifts`)
      } finally {
        releaseRoute?.()
        await page.close()
      }
    })
  }

  try {
    for (const outcome of ['ready', 'failed']) {
      await verifyDelayedMedia({
        asset: 'media-portrait.svg',
        expectedStateAttribute: 'data-media-state',
        expectedStateValue: outcome,
        fromSlide: 44,
        id: `delayed-figure-${outcome}`,
        outcome,
        targetSelector: '[data-quality-case="visual-media-figure-fits"] > figure:first-child',
        targetSlide: 45,
      })
      await verifyDelayedMedia({
        asset: 'transparent-logo-wide.svg',
        expectedStateAttribute: 'data-logo-state',
        expectedStateValue: outcome,
        fromSlide: 49,
        id: `delayed-closing-logo-${outcome}`,
        outcome,
        stateSelector: '.presentation-closing-logo',
        targetSelector: '.presentation-closing',
        targetSlide: 50,
      })
      await verifyDelayedMedia({
        asset: 'media-portrait.svg',
        buildId: 'protocol',
        expectedStateAttribute: 'data-media-state',
        expectedStateValue: outcome,
        fromSlide: 25,
        id: `delayed-generated-image-${outcome}`,
        outcome,
        stateSelector: '[data-generated-state-case="delayed"]',
        targetSelector: '[data-quality-case="protocol-generated-image-states"]',
        targetSlide: 26,
      })
    }
  } finally {
    await context.close()
    await browser.close()
    await server?.close()
    await protocolServer?.close()
  }
})
