import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import axe from 'axe-core'
import { chromium } from 'playwright-chromium'
import { buildDeck, mapConcurrent, qualityArtifactRoot, repositoryRoot, startStaticServer } from './helpers.mjs'

const presets = ['zhubai', 'qingdai', 'songmo', 'ucas', 'ict']
const names = ['Alexandra Morgan', 'Daniel Kim', 'Sofia Martínez', 'Wei Zhang', 'Priya Raman', 'Christopher Williams', 'Emma Thompson', 'Noah Lee']
const institutions = ['Institute for Computational Systems, Example University', 'Centre for Reliable Machine Learning, Example Institute']
const intersects = (a, b) => Boolean(a && b && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
  && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1)

test('collaborative covers retain every author, contact and affiliation within the canvas', { timeout: 480_000 }, async (t) => {
  const selectedCounts = process.env.QUALITY_AUTHOR_COUNTS?.split(',').map(Number)
  if (selectedCounts) assert.ok(selectedCounts.every(count => Number.isInteger(count) && count >= 0 && count <= 8), 'select author counts between 0 and 8')
  const suffix = selectedCounts ? `-${selectedCounts.join('-')}` : ''
  const output = resolve(qualityArtifactRoot, `screenshots/cover-authors${suffix}`)
  const generated = resolve(qualityArtifactRoot, 'generated/cover-authors')
  await mkdir(output, { recursive: true })
  await mkdir(generated, { recursive: true })
  const profiles = [
    ...Array.from({ length: 9 }, (_, count) => ({ count, fontProfile: 'local' })),
    ...[6, 8].map(count => ({ count, fontProfile: 'theme' })),
  ]
  const definitions = await Promise.all(profiles.filter(profile => !selectedCounts || selectedCounts.includes(profile.count)).map(async ({ count, fontProfile }) => {
    const authors = names.slice(0, count).map((name, index) => ({
      name,
      institution: institutions[count < 3 ? 0 : index % 2],
      email: `${name.toLowerCase().replaceAll(' ', '.')}@example.org`,
    }))
    const cases = presets.flatMap(preset => ['left', 'center'].map(coverAlign => ({ preset, coverAlign })))
    cases.push({ preset: 'ucas', coverAlign: 'center', visual: true, long: true })
    cases.push({ preset: 'zhubai', coverAlign: 'center', long: true, seal: true, noDate: true })
    const source = resolve(generated, `${fontProfile}-${count}.md`)
    const outDir = resolve(qualityArtifactRoot, `build/cover-authors/${fontProfile}-${count}`)
    let markdown = ''
    for (const [index, item] of cases.entries()) {
      const fields = {
        ...(!index ? {
          theme: repositoryRoot, authors,
          ...(fontProfile === 'local' ? { fonts: { provider: 'none', sans: 'Arial', serif: 'Georgia', mono: 'Courier New' } } : {}),
        } : {}),
        layout: 'cover',
        title: item.long ? 'Reliable Decisions under Distribution Shift: Measuring Uncertainty across Domains' : 'Reliable Decisions under Distribution Shift',
        subtitle: 'A reproducible workflow for comparing methods, measuring uncertainty, and explaining tradeoffs.',
        eyebrow: 'RESEARCH SEMINAR · SYSTEMS & EVIDENCE',
        ...(!item.noDate ? { date: 'October 2026' } : {}),
        presentation: { preset: item.preset, coverAlign: item.coverAlign, ...(item.seal ? { seal: '共研' } : {}) },
      }
      markdown += `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`
      if (!item.visual && !item.long) markdown += 'State the question, the method, and the operating boundary.\n\n'
      if (item.visual) markdown += '::visual::\n\n<svg viewBox="0 0 500 200" role="img" aria-label="A comparison of an observed signal and a smoother estimate"><path d="M20 180L140 120 260 140 380 40 480 60" fill="none" stroke="var(--presentation-chart-1)" stroke-width="4" /><path d="M20 180L480 50" fill="none" stroke="currentColor" stroke-dasharray="8 6" stroke-width="2" /></svg>\n\n'
    }
    await writeFile(source, markdown)
    return { id: `cover-authors-${fontProfile}-${count}`, source, outDir, authors, cases, count, fontProfile }
  }))
  await mapConcurrent(definitions, 2, buildDeck)
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    for (const definition of definitions) {
      const server = await startStaticServer(definition.outDir)
      try {
        for (const width of [980, 720]) for (const mode of ['light', 'dark']) {
          const page = await browser.newPage({ viewport: { width, height: Math.round(width * 9 / 16) }, reducedMotion: 'reduce' })
          await page.addInitScript(() => localStorage.setItem('slidev-wake-lock', 'false'))
          const errors = []
          page.on('pageerror', error => errors.push(error.message))
          const cdp = definition.fontProfile === 'theme' ? await page.context().newCDPSession(page) : null
          if (cdp) {
            await cdp.send('DOM.enable')
            await cdp.send('CSS.enable')
          }
          try {
            for (const [index, item] of definition.cases.entries()) {
              const no = index + 1
              await t.test(`${definition.fontProfile} / ${definition.count} authors / ${item.preset} / ${item.coverAlign} / ${no} / ${mode} / ${width}`, async () => {
                await page.goto(`${server.baseUrl}/${no}`, { waitUntil: 'domcontentloaded' })
                const layout = page.locator(`.slidev-page-${no} .slidev-layout`)
                await layout.waitFor({ state: 'visible' })
                await page.evaluate(async dark => { document.documentElement.classList.toggle('dark', dark); await document.fonts.ready }, mode === 'dark')
                const state = await layout.evaluate(el => {
                  const content = el.querySelector('.slide-frame__content')
                  const rect = element => {
                    if (!element) return null
                    const r = element.getBoundingClientRect()
                    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
                  }
                  const nodes = [...el.querySelectorAll('h1, .slide-cover__eyebrow, .slide-cover__subtitle, .slide-cover__body p, .slide-cover__author, .slide-cover__institution, .slide-cover__date, .presentation-seal, .slide-cover__visual')]
                  const ink = []
                  for (const element of nodes) {
                    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
                    while (walker.nextNode()) {
                      if (!walker.currentNode.textContent.trim()) continue
                      const range = document.createRange()
                      range.selectNodeContents(walker.currentNode)
                      for (const r of range.getClientRects()) if (r.width && r.height) ink.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })
                    }
                  }
                  return {
                    content: rect(content), heading: rect(el.querySelector('h1')), meta: rect(el.querySelector('.slide-cover__meta')),
                    brand: rect(el.querySelector('.slide-frame__ucas-rail, .slide-frame__ict-lockup')),
                    overflow: [content.scrollWidth - content.clientWidth, content.scrollHeight - content.clientHeight], ink,
                    names: [...el.querySelectorAll('.slide-cover__author-primary')].map(a => a.textContent.trim()),
                    emails: [...el.querySelectorAll('.slide-cover__author-email')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
                    institutions: [...el.querySelectorAll('.slide-cover__author-institution')].map(a => a.textContent.trim()),
                    mappings: [...el.querySelectorAll('.slide-cover__author')].map(author => {
                      const institution = author.querySelector('.slide-cover__author-institution')
                        ?? document.getElementById(author.getAttribute('aria-describedby'))?.querySelector('.slide-cover__author-institution')
                      return institution?.textContent.trim() ?? null
                    }),
                    marks: el.querySelectorAll('.slide-cover__author-byline .slide-cover__affiliation-mark').length,
                  }
                })
                const evidence = { count: definition.count, fontProfile: definition.fontProfile, no, ...item, mode, width, ...state }
                records.push(evidence)
                const prefix = definition.fontProfile === 'theme' ? 'theme-' : ''
                await layout.screenshot({ path: resolve(output, `${prefix}${definition.count}-${item.preset}-${item.coverAlign}-${no}-${mode}-${width}.png`) })
                if (definition.fontProfile === 'theme' && width === 980 && mode === 'light') {
                  const { root } = await cdp.send('DOM.getDocument')
                  const fontsFor = async selector => {
                    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `.slidev-page-${no} ${selector}` })
                    assert.ok(nodeId, selector)
                    return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts
                  }
                  const fonts = { heading: await fontsFor('h1'), author: await fontsFor('.slide-cover__author-primary'), email: await fontsFor('.slide-cover__author-email') }
                  const uses = (faces, family) => faces.some(face => face.isCustomFont && face.familyName.startsWith(family) && face.glyphCount > 0)
                  assert.ok(uses(fonts.heading, ['songmo', 'ict'].includes(item.preset) ? 'Source Sans 3' : 'Source Serif 4'), JSON.stringify(fonts))
                  assert.ok(uses(fonts.author, 'Source Sans 3') && uses(fonts.email, 'Source Sans 3'), JSON.stringify(fonts))
                  evidence.renderedFonts = fonts
                }
                assert.deepEqual(state.names, definition.authors.map(author => author.name))
                assert.deepEqual(state.emails, definition.authors.map(author => ({ text: author.email, href: `mailto:${author.email}` })))
                assert.deepEqual(state.mappings, definition.authors.map(author => author.institution))
                assert.equal(state.institutions.length, new Set(definition.authors.map(author => author.institution)).size)
                if (definition.count === 2) assert.equal(state.marks, 0, 'a shared affiliation needs no repeated number')
                assert.ok(state.overflow.every(value => value <= 1), JSON.stringify(evidence))
                for (const ink of state.ink) {
                  assert.ok(ink.left >= state.content.left - 1.5 && ink.right <= state.content.right + 1.5
                    && ink.top >= state.content.top - 1.5 && ink.bottom <= state.content.bottom + 1.5,
                  `text remains visible: ${JSON.stringify({ ...item, count: definition.count, ink, content: state.content })}`)
                  assert.equal(intersects(ink, state.brand), false, 'cover text never overlaps an institutional signature')
                }
                assert.equal(intersects(state.heading, state.meta), false, 'authors never displace or cover the headline')
                if (width === 980 && no % 2 === 1) {
                  await page.evaluate(axe.source)
                  const result = await page.evaluate(selector => window.axe.run(selector, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }), `.slidev-page-${no} .slidev-layout`)
                  assert.deepEqual(result.violations, [], JSON.stringify(result.violations))
                }
              })
            }
            assert.deepEqual(errors, [])
          } finally { await page.close() }
        }
      } finally { await server.close() }
    }
  } finally {
    await writeFile(resolve(output, 'review.json'), `${JSON.stringify(records, null, 2)}\n`)
    await browser.close()
  }
})
