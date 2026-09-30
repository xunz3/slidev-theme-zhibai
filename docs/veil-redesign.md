# Veil 0.4 — Paper, Folio, Blueprint

The selected [design proposal](./veil-design-proposal.md) supersedes 0.3's pure-white pages and serif body text. [Implementation decisions](./veil-0.4-implementation.md) document practical adaptations for Slidev's fixed 980 × 552 canvas.

## Surfaces and color

| Preset | Paper | Accent | Highlight | Composition |
| --- | --- | --- | --- | --- |
| Default / Paper | `#faf9f6` | `#2f3b46` | `#c2572e` | Editorial left axis, short fine eyebrow rule |
| UCAS / Folio | `#f9fafc` | `#1d4e8e` | `#b3352c` | Centered ceremonial cover and oldstyle folio |
| ICT / Blueprint | `#f7f9fb` | `#0b6bcb` | `#d9730d` | Technical labels, engineering section numbers, faint 8px grid |

Highlight colors are theme design choices, not claims of official institutional color standards. Original signatures retain their proportions. ICT uses an 8px grid at 2.5% on covers/chapters and 1.5% on content layouts; statements and closings stay untextured. The old artwork registry, placement engine and watermark controls remain removed.

Canvas → tonal surface → raised surface is the shared hierarchy. Muted surfaces derive from paper and accent; raised media use an 8px radius and soft ambient shadow. Neutral ink-derived edges replace accent-colored chrome. Dark mode uses near-neutral ink with a small institutional hue influence.

`--veil-chart-1` through `--veil-chart-4` expose accent, highlight and two neutrals to authored SVGs and chart libraries. Use highlight for a single meaningful focal point; the theme cannot infer which datum matters in arbitrary user content.

## Typography

Libertinus Serif 600 and Noto Serif SC 600 carry covers, chapters and statements. Inter and Noto Sans SC 400 carry 18px reading text. Inter 600 provides in-slide headings; labels use 500. JetBrains Mono remains for code, page numbers and technical indices. See [typography](./veil-typography.md).

The scale is 12/14/16/18/21/28/36/48/64/96px. Short covers are 64px, chapters 48px, and short statements reach 96px. Long bilingual display text adapts to the available canvas. Body text remains readable rather than being globally reduced to force content into place. Statement subtitles use 18px with a single 16px gap below the title.

## Composition

Covers rise toward a full-width tonal author/date band. Authored visuals occupy five columns opposite seven columns of text; the band spans both. Explicit centered covers center titles within the text region and authors within the full-width information band. UCAS centers by default; Default and ICT align left.

Chapter numbers become pale 144px folios, with an explicit `SEC.` prefix in ICT. Footer chrome defaults to a deck label and page number, with no separator rule. Author footers remain an explicit legacy opt-in. Two-column pages use a 4rem gutter without a decorative divider. Content uses generous horizontal insets and a 68ch reading measure where applicable.

Existing layouts, preset overrides, named slots, authored Markdown headings, accessibility and media fallbacks remain supported. Native Slidev layouts retain their semantics, colors and full-bleed behavior.

## Components and media

Callouts use borderless tonal surfaces, 8px corners and semantic shape markers. Tables retain a header separator without zebra striping. Code uses a borderless muted surface and a compact language label. Tags and badges share a pill silhouette. Quotations use large hanging quote marks. Steps and timelines retain real ordering and connected nodes. Figures use raised surfaces with numbered captions and additive plain/framed/bleed treatments. Existing Fig./Figure/图 reference numbers remain author-owned; an explicit custom-number class also opts out of automatic numbering.

Meaningful media stays author-owned through `image`, `imageAlt`, native `::visual::` content, and `Figure`. The theme does not invent scientific graphics or replace institutional signatures.

## Motion and verification

Entry uses a 16px rise and fade over 520ms. Cover/chapter/statement children sequence at 40ms. Native click reveals use an 8px rise over 300ms. Reduced motion, inactive previews and printing remain static.

Use `node scripts/run-quality-gates.mjs` to verify configuration, preset isolation, actual fonts, accessibility, media geometry, cover composition, keyboard interaction and rendered galleries. Keep meaningful bounds and semantic assertions; update only contracts superseded by the selected visual design. The [implementation review](./veil-review.md) records verification status and final contact sheets.
