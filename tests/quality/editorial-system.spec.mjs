import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import { buildDeck, qualityArtifactRoot, repositoryRoot, startStaticServer, waitForSlide } from './helpers.mjs'

test('five presets distinguish plain blockquotes from annotated and component citations', { timeout: 240_000 }, async t => {
  const outDir = resolve(qualityArtifactRoot, 'build/editorial-system')
  const output = resolve(qualityArtifactRoot, 'screenshots/editorial-system')
  await mkdir(output, { recursive: true })
  await buildDeck({ id: 'editorial-system', source: resolve(repositoryRoot, 'fixtures/editorial-system.md'), outDir })
  const server = await startStaticServer(outDir)
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    for (const width of [980, 720]) {
      const page = await browser.newPage({ viewport: { width, height: Math.round(width * 9 / 16) }, reducedMotion: 'reduce' })
      for (const mode of ['light', 'dark']) {
        for (let no = 1; no <= 15; no++) {
          await t.test(`${no} / ${mode} / ${width}`, async () => {
            await waitForSlide(page, server.baseUrl, no, mode)
            const layout = page.locator(`.slidev-page-${no} .slidev-layout`)
            await layout.waitFor({ state: 'visible' })
            const state = await layout.evaluate(layout => {
              const frame = layout.querySelector('.slide-frame') ?? layout
              const content = frame.querySelector('.slide-frame__content') ?? layout
              const style = getComputedStyle(frame)
              const footer = layout.querySelector('.slide-frame__footer')
              const footerStyle = getComputedStyle(footer)
              const canvasRect = layout.getBoundingClientRect()
              const footerRect = footer.getBoundingClientRect()
              const scale = canvasRect.width / layout.offsetWidth
              const contentBottom = frame === layout
                ? canvasRect.bottom - parseFloat(style.paddingBottom) * scale
                : content.getBoundingClientRect().bottom
              const citations = [...layout.querySelectorAll('.presentation-callout[data-callout-family="quotation"]')].map(quote => {
                const title = quote.querySelector('.presentation-callout__title')
                const prose = quote.querySelector('.presentation-callout__content')
                return { type: quote.dataset.callout, title: title.textContent.trim(), text: prose.textContent.trim(),
                  label: quote.getAttribute('aria-labelledby'), id: title.id,
                  sourceBelow: title.getBoundingClientRect().top >= prose.getBoundingClientRect().bottom - 1,
                  bodyFont: getComputedStyle(prose).fontFamily,
                  fontSize: parseFloat(getComputedStyle(prose).fontSize),
                  background: getComputedStyle(quote).backgroundColor,
                  x: quote.scrollWidth - quote.clientWidth }
              })
              const paragraph = content.querySelector(':scope > p')
              const plainQuotes = [...layout.querySelectorAll('blockquote:not([data-callout])')].map(quote => ({
                tag: quote.tagName, text: quote.textContent.trim(),
                fontSize: parseFloat(getComputedStyle(quote).fontSize),
                font: getComputedStyle(quote).fontFamily,
                background: getComputedStyle(quote).backgroundColor,
                radius: getComputedStyle(quote).borderRadius,
                borderStart: getComputedStyle(quote).borderInlineStartWidth,
                borderTop: getComputedStyle(quote).borderTopWidth,
                borderBottom: getComputedStyle(quote).borderBottomWidth,
                align: getComputedStyle(quote).textAlign,
                mark: getComputedStyle(quote, '::before').content,
              }))
              return { preset: layout.dataset.presentationPreset, paddingLeft: parseFloat(style.paddingLeft),
                paddingRight: parseFloat(style.paddingRight), x: content.scrollWidth - content.clientWidth,
                paddingTop: parseFloat(style.paddingTop),
                readingWidth: frame === layout
                  ? layout.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
                  : content.clientWidth,
                footer: {
                  borderWidth: footerStyle.borderTopWidth, borderStyle: footerStyle.borderTopStyle,
                  borderColor: footerStyle.borderTopColor,
                  gap: (footerRect.top - contentBottom) / scale,
                  bottom: (canvasRect.bottom - footerRect.bottom) / scale,
                  left: (footerRect.left - canvasRect.left) / scale,
                  right: (canvasRect.right - footerRect.right) / scale,
                  width: footerRect.width / scale,
                },
                y: content.scrollHeight - content.clientHeight,
                paragraphWidth: paragraph?.getBoundingClientRect().width,
                contentWidth: content.getBoundingClientRect().width,
                headingFont: getComputedStyle(layout.querySelector('h1') ?? content).fontFamily,
                citations, plainQuotes, text: layout.textContent }
            })
            records.push({ no, width, mode, ...state })
            await layout.screenshot({ path: resolve(output, `${width}-${mode}-${no}.png`) })
            assert.equal(state.paddingLeft, 36)
            assert.equal(state.paddingRight, 36)
            assert.equal(state.paddingTop, 28, 'all presets share a balanced top inset')
            assert.equal(state.footer.borderWidth, '1px', 'footer has a visible boundary')
            assert.equal(state.footer.borderStyle, 'solid')
            assert.notEqual(state.footer.borderColor, 'rgba(0, 0, 0, 0)')
            assert.ok(Math.abs(state.footer.gap - 12) < 0.1, 'content stays clear of the footer rule')
            assert.ok(Math.abs(state.readingWidth - state.footer.width) < 1, 'reading content and footer share both edges without an unused scrollbar gutter')
            for (const [edge, expected] of [['bottom', 20], ['left', 36], ['right', 36]]) {
              assert.ok(Math.abs(state.footer[edge] - expected) < 0.1, `${edge}: native and theme footer align to the reading grid`)
            }
            assert.ok(state.x <= 1 && state.y <= 1, JSON.stringify(state))
            if (no % 3 === 1) {
              assert.ok(state.paragraphWidth >= state.contentWidth * 0.98, 'prose uses the content grid')
              assert.equal(state.citations.length, 2, 'Markdown and Vue citations both render')
              assert.equal(state.citations[0].title, '陈一 · 研究笔记')
              assert.ok(state.citations[0].text.startsWith('让读者知道结论从哪里来'))
              assert.equal((state.text.match(/让读者知道结论从哪里来/g) ?? []).length, 1, 'quoted content is neither lost nor duplicated')
              assert.match(state.headingFont, ['zhubai', 'qingdai'].includes(state.preset) ? /Source Serif 4/ : /Source Sans 3/)
            }
            if (no % 3 === 0) assert.equal(state.citations.length, 1, 'native columns share citation styling')
            const quoteSize = no % 3 === 0 ? 16 : 18
            if (no % 3 !== 2) {
              assert.equal(state.plainQuotes.length, 1, 'ordinary Markdown quotes retain their blockquote semantics')
              assert.equal(state.plainQuotes[0].fontSize, 16, 'side notes use the smaller secondary reading size')
              assert.equal(state.plainQuotes[0].background, 'rgba(0, 0, 0, 0)')
              assert.equal(state.plainQuotes[0].radius, '0px')
              assert.match(state.plainQuotes[0].font, /Source Sans 3/)
              assert.equal(state.plainQuotes[0].mark, 'none', 'plain quotes do not borrow the citation glyph')
              assert.equal(state.plainQuotes[0].borderStart, '1px')
              assert.equal(state.plainQuotes[0].borderTop, '0px')
              assert.equal(state.plainQuotes[0].borderBottom, '0px')
              assert.ok(['start', 'left'].includes(state.plainQuotes[0].align), 'plain quotes follow the reading axis')
            } else {
              for (const quote of state.plainQuotes) {
                assert.equal(quote.fontSize, 36, 'the standalone quote layout keeps its display hierarchy')
                assert.equal(quote.mark, 'none', 'display quotations do not repeat the inline quotation mark')
              }
            }
            for (const cite of state.citations) {
              assert.equal(cite.fontSize, quoteSize, 'citations retain their reading hierarchy')
              assert.equal(cite.label, cite.id, 'citation keeps its accessible source label')
              assert.ok(cite.sourceBelow, 'source is visually separated below the quotation')
              assert.equal(cite.background, 'rgba(0, 0, 0, 0)')
              assert.ok(cite.x <= 1)
              assert.doesNotMatch(cite.text, /\[!cite\]/)
              assert.match(cite.bodyFont, ['songmo', 'ict'].includes(state.preset) ? /Source Sans 3/ : /Source Serif 4/)
            }
          })
        }
      }
      await page.close()
    }
  } finally {
    await writeFile(resolve(output, 'geometry.json'), JSON.stringify(records, null, 2))
    await browser.close()
    await server.close()
  }
})
