# slidev-theme-zhubai

朱白 (Zhubai) is a Chinese-first Slidev theme built around paper, ink, and a restrained vermilion signature. Five presets support light and dark mode. Requires Slidev 52.15.2+ and Node.js 20.19+.

![Five Zhubai presets in light and dark modes](./docs/assets/zhubai/preset-contact-sheet.png)

| Preset | Character | Structure |
| --- | --- | --- |
| `zhubai` · 朱白 (default) | Warm rice paper, ink, vermilion title rules and diamond bullets | Left aligned |
| `qingdai` · 青黛 | Moon-white paper and dark blue, centered titles between fine rules | Centered cover and chapter |
| `songmo` · 松墨 | Quiet monochrome typography, with vermilion reserved for seals and focus | Left aligned |
| `ucas` | Scholarly blue and the original bilingual institutional signature | Centered academic cover |
| `ict` | Signal blue, mono labels, and a technical opening grid | Left aligned |

The [design](./docs/zhubai-design.md), [token contract](./docs/zhubai-tokens.md), and [implementation notes](./docs/zhubai-implementation.md) describe the 0.5 architecture. Historical `veil-*.md` documents remain archived design records.

## Start a deck

Install the theme in a Slidev project:

```sh
pnpm add slidev-theme-zhubai
```

Select it in `slides.md`:

```md
---
theme: slidev-theme-zhubai
layout: cover
title: Make room for the idea.
subtitle: A clear opening for a thoughtful talk.
eyebrow: Research colloquium
date: September 2026
authors:
  - name: Your Name
    institution: Your Institution
themeConfig:
  presentation:
    preset: zhubai
    seal: 陈
---

Your argument starts here.

---
layout: default
---

# A useful title

Write ordinary Slidev Markdown.
```

Slidev's [theme and addon guide](https://sli.dev/guide/theme-addon) explains how themes are selected. The [theme guide](https://sli.dev/guide/write-theme) documents theme defaults and package conventions.

## Covers and visuals

Cover titles may come from the frontmatter `title` or a Markdown `#` heading. Add `eyebrow`, `subtitle`, and `date` to a cover as needed. Set `authors` in the deck's frontmatter; the Authors component reads deck-level authors, and per-slide `authors` fields currently have no effect. Zhubai, Songmo, and ICT align covers left; Qingdai and UCAS center their covers by default. `coverAlign: left` or `coverAlign: center` in `themeConfig.presentation` sets a deck default, while `presentationCoverAlign` overrides one slide.

Use a meaningful image when a figure supports the argument:

```md
---
layout: cover
title: The signal after recalibration
image: /figures/calibration.svg
imageAlt: Observed and recalibrated confidence across four test batches.
imageFit: contain
imagePosition: center
---
```

Or place authored Markdown or components in the cover's native named slot. Slidev documents named slots and the `::name::` shorthand in [Writing Layouts](https://sli.dev/guide/write-layout) and [Slot Sugar](https://sli.dev/features/slot-sugar). When the slot is present, it takes precedence over `image`.

```md
---
layout: cover
title: Question, method, evidence
---

One visual can make the relationship clear.

::visual::

<Figure
  src="/figures/research-flow.svg"
  alt="A research question connected to its method and supporting evidence."
  caption="Question → method → evidence"
/>
```

The cover's `background` prop applies a full-slide background image. `image` reserves a visual region in the cover composition; `imageAlt` supplies its accessible description. A failed image retains an accessible text fallback.

## Presets, layouts, and components

Select `zhubai`, `qingdai`, `songmo`, `ucas`, or `ict` under `themeConfig.presentation.preset`, or override a slide with `presentationPreset`. Common deck settings are `coverAlign`, `accent`, `chrome`, `header`, `footerAuthors`, and `pageNumber`; corresponding slide overrides are available where applicable. `title`, `subtitle`, `eyebrow`, `date`, and `footer` are Slidev frontmatter fields; `authors` belongs in deck frontmatter as described above.

Zhubai provides `cover`, `intro`, `section`, `toc`, `default`, `center`, `two-cols`, `statement`, `quote`, `figure`, `image-left`, `image-right`, `code`, `references`, and `end` layouts. It also provides the `Authors`, `Badge`, `Callout`, `Figure`, `Kbd`, `Seal`, `Steps`, `Tag`, and `Timeline` components.

```md
<Callout type="note" title="Decision rule">

State what the result supports and where it stops applying.

</Callout>

<Figure src="/figures/result.png" alt="The measured result across four cohorts." />
<Tag>methods</Tag>
<Badge tone="positive" marker>reviewed</Badge>
```

Figure treatments are additive to the existing `variant` prop:

```md
<Figure src="/figures/result.png" alt="Measured results." caption="Fixed evaluation budget." treatment="plain" />
<Figure src="/figures/result.png" alt="Measured results." treatment="framed" />
```

`plain` uses an 8px radius and a soft shadow; `framed` adds raised padding. On covers or section slides, `treatment="bleed"` places the image across the canvas with a subtle edge gradient and a mode-aware translucent veil behind the reading zone. Choose a suitable image and check the overlaid text contrast. Captions receive a per-slide `Fig. n —` prefix. Existing `Fig.`, `Figure`, and `图` numbers are preserved; use `class="presentation-media--caption-custom-number"` when supplying your own reference number. Native fenced code receives its actual language label; an untyped fence has no label.

Authored charts can use `var(--zhubai-chart-1)` through `var(--zhubai-chart-6)` for structure, vermilion, two ink tones, and two structure tones. See the [token contract](./docs/zhubai-tokens.md).

The theme opens in light mode and remains switchable to an ink-dark palette. Libertinus Serif and Noto Serif SC carry display headings; Inter and Noto Sans SC carry 18px reading text and compact labels. JetBrains Mono marks code, page numbers, and technical numbering. Chinese text remains upright. Label weight 500 is loaded separately from the serif family’s supported weights. Content headings are 40px (30px in two-column layouts); Chinese display text marked with `lang="zh"` uses weight 700. Chinese quotations use a local Kaiti stack with Noto Serif SC as fallback.

Latin webfonts use Slidev’s font loader; Chinese webfonts load through the theme stylesheet. Both use Google Fonts. For offline presentations, install these families locally or self-host them before exporting.

## Seal, focus, and academic details

`themeConfig.presentation.seal: "陈"` adds a 1–4 character seal to covers, chapters, and closing slides. A slide-level `seal` overrides the deck; `seal: false` hides it. No seal is rendered by default, including institutional presets. An explicitly configured string enables it for institutions too. Keep the author's name in normal text: the seal is a decorative signature, not the sole attribution.

Use `==a key phrase==` for a vermilion annotation, or `.presentation-focus` for text-only emphasis. Marks inside cover and statement headings use pure focus text without a background. Keep focal vermilion to one place per slide; this is an authoring discipline, not a content validator. Small title rules, list markers, and TOC numbers provide the structural rhythm.

Content slides accept optional frontmatter `kicker`. Add `class="presentation-table--booktabs"` to a table for three academic rules. Mark Chinese quotations with `lang="zh"` to select Kaiti. `Figure treatment="framed"` uses a stronger shadow than `plain`.

## Upgrade from Veil to Zhubai 0.5

- Change the package and deck reference to `slidev-theme-zhubai`.
- Change preset `default` to `zhubai`. The old ID resolves to Zhubai with a once-per-session console warning during the 0.5 transition. The `default` **layout** keeps its name.
- Change `--veil-*` pigment and chart references to `--zhubai-*`. Legacy aliases remain for one minor release; all `--presentation-*` semantic names stay stable.
- Layouts, component props, authored visuals, `background`, and institutional signature assets remain supported. Seal, kicker, and booktabs are optional additions.

The former `artwork` / `presentationArtwork` engine remains removed. Use cover `image` plus `imageAlt`, author `::visual::`, or use `background` for a full-slide image.

## Theme boundary and development

Zhubai provides slide appearance, layouts, components, and default configuration. Slidev's official guidance recommends addons for features that can operate independently of a theme. See [the boundary and source notes](./docs/theme-boundary.md), [the Zhubai design contract](./docs/zhubai-design.md), and the [cover composition fixture](./fixtures/cover-composition.md).

To work on this repository, use Node.js 24 (`.nvmrc`) and pnpm 11.13.1 (`packageManager`). The published theme supports Node.js 20.19+ through Slidev:

```sh
pnpm install --frozen-lockfile
pnpm run dev
pnpm run build
pnpm run quality
pnpm run test:release
pnpm run package:check
```

The demo deck is [example.md](./example.md); [preset-design.md](./fixtures/preset-design.md) compares the preset identities with the same content. Build individual examples with `pnpm run build:zhubai`, `build:qingdai`, or `build:songmo`; matching `screenshot:*` commands export PNGs.

CI runs the complete quality gates and validates the npm tarball on pull requests and `master`. GitHub Releases trigger npm publishing through OIDC after the same checks pass. See [release setup and instructions](./docs/releasing.md).
