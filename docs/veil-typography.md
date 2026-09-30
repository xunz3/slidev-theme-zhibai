# Veil 0.4 typography

The selected [design proposal](./veil-design-proposal.md) reverses 0.3's font roles: serif is for display, sans is for reading. The previous ACM-inspired serif-body adaptation is historical and no longer the implementation target.

| Role | Latin | Chinese | Size / weight |
| --- | --- | --- | --- |
| Cover | Libertinus Serif | Noto Serif SC | 64px / 600; long titles adapt |
| Chapter | Libertinus Serif | Noto Serif SC | 48px / 600 |
| Statement | Libertinus Serif | Noto Serif SC | Up to 96px / 600; length-aware |
| Content heading | Inter | Noto Sans SC | 36px / 600; 28px in columns |
| Subheads H2 / H3 / H4 | Inter | Noto Sans SC | 28 / 21 / 18px, weight 600 |
| Reading | Inter | Noto Sans SC | 18px / 400, leading 1.55 |
| Labels / metadata | Inter | Noto Sans SC | 12–16px / 500 |
| Quote | Libertinus Serif italic | Noto Serif SC upright | 28px |
| Code / technical index | JetBrains Mono | Sans fallback | 12–14px for code/labels |

Explicit Chinese language runs use 1.6 body leading and upright glyphs without added tracking. Progressive hanging punctuation and text autospace enhance browsers that support them. CJK optical compensation must remain small and must not inflate paragraph or line boxes unpredictably.

Use sentence-case eyebrows with 0.02em tracking. Runtime does not rewrite authored text. Demo copy follows this style; authors can choose their own wording. Page numbers retain tabular monospaced numerals in muted ink.

Latin 400/600/700 and italics use Slidev's native Google Fonts mechanism. An additional CSS request loads Inter 500 and upright Noto Sans SC 400/500/600/700 and Noto Serif SC 400/600/700. Libertinus uses its supported 600 display weight; an unsupported 500 request is not sent to every family. For offline delivery install or self-host the same families before export.

The six-slide typography fixture checks actual Chromium-rendered custom font glyphs for Latin and Chinese, not only CSS family declarations. The gallery additionally checks short display text, bilingual covers, equations, code, data tables and semantic notes in both modes.

The earlier reference survey remains useful for role contrast and font delivery: [ACM source](https://github.com/borisveytsman/acmart/blob/primary/acmart.dtx), [Libertinus](https://github.com/alerque/libertinus), [Inter](https://rsms.me/inter/), [Distill](https://github.com/distillpub/template), [Gwern](https://gwern.net/design), [Monotype presentation guidance](https://cms.myfonts.com/sites/default/files/2024-08/manual-typography-for-presentation-graphics.pdf), and [MIT CSAIL templates](https://www.csail.mit.edu/logo_asset_suite). The 0.4 role assignments are the user's selected design direction, not a claim that these references all use the same pairing.

## Post-review spacing refinement

Statement subtitles use 18px (Chinese leading 1.6), separated from the title by one 16px margin. The previous title bottom margin plus subtitle top margin totaled about 46px on the 96px example.

UCAS cover titles retain `text-wrap: balance`. Screenshot comparison showed that switching to `pretty` or `wrap` split the word “可信” in the reference title without addressing the full-width comma spacing. The heading now enables OpenType [`halt` (Alternate Half Widths)](https://learn.microsoft.com/en-us/typography/opentype/spec/featurelist), retaining `kern`, `liga` and `calt`; in the configured Noto Serif SC font this compacts punctuation while preserving the authored characters. This is scoped to UCAS cover headings, including native Markdown H1. The [CSS Text spacing-trim specification](https://www.w3.org/TR/css-text-4/#text-spacing-trim-property) was consulted, but the tested Chromium does not accept `trim-all`, so the theme does not depend on it.
