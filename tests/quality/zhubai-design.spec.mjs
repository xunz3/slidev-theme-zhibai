import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { chromium } from 'playwright-chromium'
import { buildDeck, qualityArtifactRoot, repositoryRoot, startStaticServer, waitForSlide } from './helpers.mjs'

const contrast = (a, b) => {
  const luminance = rgb => rgb.map(value => value / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
  const [light, dark] = [luminance(a), luminance(b)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}
const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number)
const hue = ([r, g, b]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  assert.ok(max - min > 50, 'signature vermilion must remain saturated')
  return ((max === r ? (g - b) / (max - min) : max === g ? 2 + (b - r) / (max - min) : 4 + (r - g) / (max - min)) * 60 + 360) % 360
}

test('Zhubai signature, five-preset colors, seal geometry, and refinement contracts', { timeout: 240_000 }, async (t) => {
  const outDir = resolve(qualityArtifactRoot, 'build/zhubai-design')
  const output = resolve(qualityArtifactRoot, 'screenshots/zhubai-design')
  await mkdir(output, { recursive: true })
  await buildDeck({ id: 'zhubai-design', outDir, source: resolve(repositoryRoot, 'fixtures/zhubai-design.md') })
  const server = await startStaticServer(outDir)
  const browser = await chromium.launch({ headless: true })
  const records = []
  try {
    for (const mode of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'reduce' })
      for (const slide of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]) {
        await t.test(`${mode} / slide ${slide}`, async () => {
          await waitForSlide(page, server.baseUrl, slide, mode)
          const frame = page.locator(`.slidev-page-${slide} .slide-frame`)
          const state = await frame.evaluate(frame => {
            const style = getComputedStyle(frame)
            const canvas = frame.closest('.slidev-layout')
            const probeColor = token => {
              const probe = document.createElement('span')
              probe.style.color = `var(${token})`
              frame.append(probe)
              const color = getComputedStyle(probe).color
              probe.remove()
              return color
            }
            const read = (selector, properties, pseudo) => {
              const node = frame.querySelector(selector)
              if (!node) return null
              const css = getComputedStyle(node, pseudo)
              return Object.fromEntries(properties.map(property => [property, css.getPropertyValue(property)]))
            }
            const seal = frame.querySelector('.presentation-seal')
            const content = frame.querySelector('.slide-frame__content')
            const h1 = frame.querySelector('h1')
            return {
              preset: frame.dataset.presentationPreset,
              background: getComputedStyle(canvas).backgroundColor,
              text: style.color,
              zhu: probeColor('--zhubai-zhu'),
              focus: probeColor('--presentation-focus'),
              accent: probeColor('--presentation-accent'),
              chartAliases: [1, 2, 3, 4, 5, 6].map(index => [probeColor(`--zhubai-chart-${index}`), probeColor(`--veil-chart-${index}`)]),
              heading: read('h1', ['font-size', 'text-align', 'border-top-width', 'border-bottom-width', 'margin-bottom']),
              headingWidth: h1?.getBoundingClientRect().width,
              figureVariant: frame.querySelector('[data-figure-variant]')?.dataset.figureVariant,
              rule: read('h1', ['content', 'width', 'height', 'background-color', 'margin-left', 'margin-right'], '::after'),
              marker: read('ul > li', ['content', 'width', 'height', 'transform'], '::before'),
              mark: read('mark', ['color', 'background-color', 'text-decoration-line']),
              markEmphasis: read('mark strong', ['color']),
              link: read('a', ['color', 'text-decoration-line']),
              quote: read('blockquote', ['font-family', 'font-style']),
              booktabs: read('.presentation-table--booktabs', ['border-top-width', 'border-bottom-width']),
              booktabsBodyRow: read('.presentation-table--booktabs tbody tr', ['border-bottom-width']),
              kicker: frame.querySelector('.slide-frame__kicker')?.textContent,
              kickerBeforeHeading: h1?.previousElementSibling?.classList.contains('slide-frame__kicker'),
              seal: seal && {
                label: seal.getAttribute('aria-label'), role: seal.getAttribute('role'),
                fitsContent: (() => {
                  const stamp = seal.getBoundingClientRect(), box = content.getBoundingClientRect()
                  return stamp.left >= box.left - 1 && stamp.right <= box.right + 1
                    && stamp.top >= box.top - 1 && stamp.bottom <= box.bottom + 1
                })(),
                ...read('.presentation-seal', ['width', 'height', 'background-color', 'color', 'font-weight', 'font-family', 'transform', 'animation-name']),
              },
              overflow: { x: content.scrollWidth - content.clientWidth, y: content.scrollHeight - content.clientHeight },
            }
          })
          records.push({ mode, slide, ...state })
          await frame.screenshot({ path: resolve(output, `${mode}-${String(slide).padStart(2, '0')}.png`) })
          assert.ok(state.overflow.x <= 1 && state.overflow.y <= 1, JSON.stringify(state.overflow))
          assert.equal(state.zhu, mode === 'light' ? 'rgb(184, 53, 33)' : 'rgb(217, 100, 76)')
          assert.ok(hue(rgb(state.zhu)) <= 20, 'dark and light vermilion retain their red hue')
          for (const [canonical, legacy] of state.chartAliases) assert.equal(legacy, canonical, 'legacy chart tokens alias the new pigments')
          const sealSlides = { 1: ['陈', 36], 3: ['陈', 24], 4: ['米拉', 36], 7: ['院', 36], 14: ['陈', 36], 15: ['MC', 36], 17: ['陈', 24], 18: ['院', 24] }
          if (sealSlides[slide]) {
            const [name, size] = sealSlides[slide]
            assert.ok(state.seal, 'configured seal renders')
            assert.equal(state.seal.role, 'img')
            assert.ok(state.seal.fitsContent, 'the complete rotated seal stays within the content area')
            assert.equal(state.seal.label, `Seal: ${name}`)
            assert.equal(state.seal.width, `${size}px`)
            assert.equal(state.seal.height, `${size}px`)
            assert.equal(state.seal['background-color'], state.zhu)
            assert.equal(state.seal['font-weight'], '700')
            assert.equal(state.seal['animation-name'], 'none')
            assert.match(state.seal['font-family'], /^"Libertinus Serif", "Noto Serif SC", serif$/, 'Latin initials use Libertinus before the Chinese serif fallback')
          } else assert.equal(state.seal, null, 'unconfigured seal leaves no DOM placeholder')
          if (state.preset === 'zhubai') assert.equal(state.background, mode === 'light' ? 'rgb(250, 248, 243)' : 'rgb(23, 21, 17)')
          if ([2, 9, 10].includes(slide)) {
            assert.equal(state.heading['font-size'], '40px')
            assert.equal(state.mark.color, state.text, 'prose highlights keep ink-colored text')
            assert.notEqual(state.mark['background-color'], 'rgba(0, 0, 0, 0)', 'prose highlights retain their vermilion tint')
            assert.equal(state.mark['text-decoration-line'], 'underline', 'prose highlights retain the red-pencil underline')
            assert.ok(contrast(rgb(state.focus), rgb(state.background)) >= 4.5, 'focus text has AA contrast on preset paper')
            assert.ok(contrast(rgb(state.accent), rgb(state.background)) >= 4.5, 'structural text has AA contrast on preset paper')
          }
          if ([2, 19, 20, 21].includes(slide)) {
            assert.ok(Math.abs(parseFloat(state.heading['margin-bottom']) / parseFloat(state.heading['font-size']) - 0.55) < 0.01, 'signature title spacing keeps the same 0.55em rhythm')
          }
          if (slide === 2) {
            assert.equal(state.rule['margin-left'], '0px', 'ordinary reading titles retain the left signature axis')
            assert.equal(state.markEmphasis.color, state.text, 'bold prose highlights retain ink text')
            assert.equal(state.rule.width, '40px')
            assert.equal(state.rule.height, '1.5px')
            assert.equal(state.rule['background-color'], state.zhu)
            assert.ok(parseFloat(state.marker.width) >= 5, 'diamond list marker remains visible')
            assert.match(state.marker.transform, /^matrix\(/)
            assert.ok(state.kickerBeforeHeading, 'content kicker precedes the authored heading')
            assert.equal(state.kicker, '研究问题 · Research question')
            assert.ok(parseFloat(state.booktabs['border-top-width']) >= 1)
            assert.ok(parseFloat(state.booktabs['border-bottom-width']) >= 1)
            assert.equal(state.booktabsBodyRow['border-bottom-width'], '0px', 'booktabs has no interior body-row rules')
          }
          if (slide === 8) {
            assert.equal(state.mark['background-color'], 'rgba(0, 0, 0, 0)', 'display focus has no rectangle')
            assert.equal(state.mark.color, state.focus)
            assert.equal(state.markEmphasis.color, state.focus, 'bold display focus retains vermilion text')
          }
          if (slide === 9) {
            assert.equal(state.preset, 'qingdai')
            assert.equal(state.heading['text-align'], 'center')
            assert.equal(state.heading['border-top-width'], '1px')
            assert.equal(state.heading['border-bottom-width'], '1px')
          }
          if (slide === 10) {
            assert.equal(state.preset, 'songmo')
            assert.equal(state.link.color, state.text)
            assert.equal(state.link['text-decoration-line'], 'underline')
          }
          if (slide === 11) assert.equal(state.preset, 'zhubai', 'default alias is canonicalized in the browser')
          if (slide === 12) {
            assert.match(state.quote['font-family'], /Kaiti SC.*STKaiti.*KaiTi.*Noto Serif SC/)
            assert.equal(state.quote['font-style'], 'normal')
          }
          if (slide === 13) {
            assert.equal(state.heading['font-size'], '30px')
            assert.ok(Math.abs(parseFloat(state.heading['margin-bottom']) / 30 - 0.5) < 0.01, 'two-column titles retain their compact 0.5em rhythm')
          }
          if ([19, 20, 21].includes(slide)) {
            const left = parseFloat(state.rule['margin-left'])
            const right = parseFloat(state.rule['margin-right'])
            assert.ok(left > 0 && right > 0, 'centered title rules have space on both sides')
            assert.ok(Math.abs(left - right) <= 1, 'the vermilion rule stays centered under the title')
            assert.ok(Math.abs(left + right + parseFloat(state.rule.width) - state.headingWidth) <= 1, 'the rule margins use the complete title width')
          }
          if (slide === 19) assert.equal(state.heading['text-align'], 'center')
          if (slide === 20) assert.equal(state.figureVariant, 'centered')
          if (slide === 21) assert.equal(state.figureVariant, 'editorial')
        })
      }
      await page.close()
    }
    await t.test('cover stamp consumes duration and stagger tokens', async () => {
      const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: 'no-preference' })
      await page.goto(`${server.baseUrl}/1`)
      const seal = page.locator('.slidev-page-1 .presentation-seal')
      await seal.waitFor()
      const animation = await seal.evaluate(node => {
        const style = getComputedStyle(node)
        return { name: style.animationName, duration: style.animationDuration, delay: style.animationDelay }
      })
      assert.equal(animation.name, 'presentation-seal-stamp')
      assert.equal(animation.duration, '0.26s')
      assert.equal(animation.delay, '0.16s')
      await page.close()
    })
    // Do not use waitForSlide here: it deliberately disables all animations for
    // screenshots. These checks exercise actual reduced-motion and print CSS.
    for (const media of [{ reducedMotion: 'reduce' }, { reducedMotion: 'no-preference', media: 'print' }]) {
      await t.test(`seal stays static under ${media.media ?? media.reducedMotion}`, async () => {
        const page = await browser.newPage({ viewport: { width: 980, height: 552 }, reducedMotion: media.reducedMotion })
        if (media.media) await page.emulateMedia({ media: media.media })
        await page.goto(`${server.baseUrl}/1`)
        const seal = page.locator('.slidev-page-1 .presentation-seal')
        await seal.waitFor()
        assert.equal(await seal.evaluate(node => getComputedStyle(node).animationName), 'none')
        await page.close()
      })
    }
  } finally {
    await writeFile(resolve(output, 'report.json'), `${JSON.stringify(records, null, 2)}\n`)
    await browser.close()
    await server.close()
  }
})
