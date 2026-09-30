import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import {
  buildDeck,
  qualityArtifactRoot,
  readQualityBuildContext,
  repositoryRoot,
  startStaticServer,
} from './helpers.mjs'

test('preset entry motion respects live, reduced-motion, preview and print contexts', {
  timeout: 240_000,
}, async (t) => {
  const supplied = readQualityBuildContext()
  const servers = []
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    for (const [preset, id] of [['zhubai', 'default-only'], ['ucas', 'ucas'], ['ict', 'ict']]) {
      await t.test(preset, async () => {
        let baseUrl = supplied?.[id]?.baseUrl
        if (!baseUrl) {
          const outDir = resolve(qualityArtifactRoot, 'build/motion', preset)
          await buildDeck({ id: `motion-${preset}`, outDir, source: resolve(repositoryRoot, `fixtures/${preset}-preset.md`) })
          const server = await startStaticServer(outDir)
          servers.push(server)
          baseUrl = server.baseUrl
        }
        const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'no-preference' })
        try {
          await page.goto(`${baseUrl}/1`, { waitUntil: 'domcontentloaded' })
          const frame = page.locator('.slidev-page-1 .slide-frame').first()
          await frame.waitFor({ state: 'visible' })
          await page.waitForFunction(() => document.querySelector('.slidev-page-1 .slide-frame')?.dataset.presentationMotion === 'active')
          const motion = () => frame.evaluate(el => {
            const content = el.querySelector('.slide-cover__title, .slide-cover__body h1')
            const style = getComputedStyle(content)
            return { active: el.dataset.presentationMotion, name: style.animationName, duration: style.animationDuration }
          })
          assert.deepEqual(await motion(), {
            active: 'active', name: 'presentation-enter', duration: '0.52s',
          })
          assert.equal(await frame.locator('.preset-artwork').count(), 0, 'covers have no automatic decoration')
          await page.emulateMedia({ reducedMotion: 'reduce' })
          assert.equal((await motion()).name, 'none')
          await page.emulateMedia({ reducedMotion: 'no-preference' })
          await page.keyboard.press('ArrowRight')
          await page.waitForFunction(() => document.querySelector('.slidev-page-2 .slide-frame')?.dataset.presentationMotion === 'active')
          assert.equal(await page.locator('.slidev-page-1 .slide-frame[data-presentation-motion="active"]').count(), 0)
          await page.keyboard.press('ArrowLeft')
          await page.waitForFunction(() => document.querySelector('.slidev-page-1 .slide-frame')?.dataset.presentationMotion === 'active')
          assert.equal((await motion()).name, 'presentation-enter', 'entry replays on return')
          await page.emulateMedia({ media: 'print' })
          assert.equal((await motion()).name, 'none', 'printing during entry is static')
          await page.emulateMedia({ media: 'screen' })
          for (const path of ['overview', '1?print']) {
            await page.goto(`${baseUrl}/${path}`, { waitUntil: 'domcontentloaded' })
            await page.locator('.slide-frame').first().waitFor({ state: 'attached' })
            assert.equal(await page.locator('.slide-frame[data-presentation-motion="active"]').count(), 0, path)
            const pageNumbers = await page.locator('.slide-frame__page-current').allTextContents()
            assert.ok(new Set(pageNumbers).size > 1, `${path}: each preview retains its own page number`)
          }
        } finally {
          await page.close()
        }
      })
    }
  } finally {
    await browser?.close()
    await Promise.all(servers.map(server => server.close()))
  }
})
