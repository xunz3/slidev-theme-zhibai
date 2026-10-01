# slidev-theme-zhubai

朱白 (Zhubai) is a Chinese-first Slidev theme built around paper, ink, and a restrained vermilion signature. Five presets support light and dark mode. Requires Slidev 52.15.2+ and Node.js 20.19+.

![Five Zhubai presets across six page types in light mode](./docs/assets/zhubai/preset-contact-sheet.png)

[Dark mode comparison](./docs/assets/zhubai/preset-contact-sheet-dark.png).

| Preset | Character | Structure |
| --- | --- | --- |
| `zhubai` · 朱白 (default) | Warm rice paper, ink, vermilion title rules and diamond bullets | Centered cover; left aligned content |
| `qingdai` · 青黛 | Moon-white paper and dark blue, centered titles between fine rules | Centered cover and chapter |
| `songmo` · 松墨 | Quiet monochrome typography, with vermilion reserved for seals and focus | Centered cover; left aligned content |
| `ucas` | Scholarly blue and the original bilingual institutional signature | Centered academic cover |
| `ict` | Signal blue, mono labels, and a technical opening grid | Centered cover; left aligned content |

The [design](./docs/zhubai-design.md), [token contract](./docs/zhubai-tokens.md), and [preset identities](./docs/preset-identities.md) describe the theme architecture.

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

Cover titles may come from the frontmatter `title` or a Markdown `#` heading. Add `eyebrow`, `subtitle`, and `date` to a cover as needed. Set `authors` in the deck's frontmatter; the Authors component reads deck-level authors, and per-slide `authors` fields currently have no effect. All five presets center their covers by default. `coverAlign: left` or `coverAlign: center` in `themeConfig.presentation` sets a deck default, while slide-level `presentation: { coverAlign: left }` overrides one slide. The older `presentationCoverAlign` field remains supported.

Collaborative covers keep names and email links together, list shared affiliations once, and connect distinct affiliations with superscript numbers. Larger author lists use a compact composition that leaves room for the headline and institutional signature. The [English gallery](./examples/english-gallery.md) demonstrates three authors across all five presets, along with long English titles, italic emphasis, footnotes, mathematics, tables, and code. See the [authoring guide](./docs/authoring.md) for the author fields and English font settings.

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

Select `zhubai`, `qingdai`, `songmo`, `ucas`, or `ict` under `themeConfig.presentation.preset`, or override a slide with `presentation: { preset: songmo }`. The older `presentationPreset` field remains supported. Each preset provides a complete visual identity and its own default accent. Keep `accent` unset to follow the preset, or supply a CSS color as an optional override. Other deck settings are `coverAlign`, `showFooter`, `pageNumber`, and optional `seal`; use the same names under a slide-level `presentation` object. `accent: auto` restores that slide’s preset accent. Legacy `chrome` settings remain compatible. See the [complete configuration table and inheritance rules](./docs/configuration.md). `title`, `subtitle`, `eyebrow`, `date`, and `footer` are Slidev frontmatter fields; `authors` belongs in deck frontmatter as described above.

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

`plain` follows the preset’s image radius and shadow; `framed` adds raised padding. On covers or section slides, `treatment="bleed"` places the image across the canvas with a subtle edge gradient and a mode-aware translucent veil behind the reading zone. Choose a suitable image and check the overlaid text contrast. Captions receive a per-slide `Fig. n —` prefix. Existing `Fig.`, `Figure`, and `图` numbers are preserved; use `class="presentation-media--caption-custom-number"` when supplying your own reference number. Native fenced code receives its actual language label; an untyped fence has no label.

Native `fact`, `two-cols-header`, `full`, `image`, and iframe text panes inherit the selected preset and standard fonts. `none` remains author-controlled. Both `two-cols` and `two-cols-header` accept `columnRatio: 0.6` for a 60% left column.

Authored charts can use `var(--zhubai-chart-1)` through `var(--zhubai-chart-6)` for structure, vermilion, two ink tones, and two structure tones. See the [token contract](./docs/zhubai-tokens.md).

The theme opens in light mode and supports a dark palette for every preset. Typography, reading rhythm, tables, quotes, and chart treatments belong to each preset: Zhubai uses warm editorial paper, Qingdai uses ruled serif headings, Songmo uses a clean monochrome sans identity, UCAS uses academic blue rules, and ICT uses technical grids and mono labels. See the [preset design map](./docs/preset-identities.md).

All default fonts now use [Slidev’s standard font loader](https://sli.dev/custom/config-fonts). Your `fonts.sans / serif / mono`, `fonts.local`, and `fonts.provider` settings are respected. `provider: none` disables remote font loading. The defaults request upright 400/600/700 weights for Latin and Chinese families; self-host or install fonts locally for offline use. See [font roles and offline configuration](./docs/configuration.md#标准字体与离线演示).

## Seal, focus, and academic details

`themeConfig.presentation.seal: "陈"` adds a 1–4 character seal to covers, chapters, and closing slides. A slide-level `seal` overrides the deck; `seal: false` hides it. No seal is rendered by default, including institutional presets. An explicitly configured string enables it for institutions too. Keep the author's name in normal text: the seal is a decorative signature, not the sole attribution.

Use `==a key phrase==` for a vermilion annotation, or `.presentation-focus` for text-only emphasis. Marks inside cover and statement headings use pure focus text without a background. Keep focal vermilion to one place per slide; this is an authoring discipline, not a content validator. Small title rules, list markers, and TOC numbers provide the structural rhythm.

Content slides accept optional frontmatter `kicker`. Add `class="presentation-table--booktabs"` to a table for three academic rules. Mark Chinese quotations with `lang="zh"` to select Kaiti. `Figure treatment="framed"` uses a stronger shadow than `plain`.

## Upgrade from Veil to Zhubai 0.5

- Change the package and deck reference to `slidev-theme-zhubai`.
- Change preset `default` to `zhubai`. The old ID resolves to Zhubai with a once-per-session console warning during the 0.5 transition. The `default` **layout** keeps its name.
- Change `--veil-*` pigment and chart references to `--zhubai-*`. Legacy aliases remain for one minor release; all `--presentation-*` semantic names stay stable.
- Layouts, component props, authored visuals, `background`, and institutional signature assets remain supported. Seal, kicker, and booktabs are optional additions.

The former `artwork` / `presentationArtwork` engine remains removed. Use cover `image` plus `imageAlt` for a simple image, or put any authored image, chart, or Vue component in `::visual::`. The visual slot takes precedence over `image`; omit both for a text-only cover. Use `background` for a full-slide image. Composition inside the visual slot belongs to the author, with no theme artwork configuration required.

`header`, `presentationHeader`, and `footerAuthors` have been removed. Keep slide headings in the content. The footer displays `footer` (falling back to the deck title) and optional page numbers; it does not automatically repeat author names. Authors remain available on the cover and through the `Authors` component.

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

The [authoring guide](./docs/authoring.md) maps presentation purposes to layouts, with examples for unequal columns, multiple figures, formulas, footnotes, and references. Start from a complete [technical talk](./examples/technical-talk.md), [research report](./examples/research-report.md), or [course](./examples/course.md).

Run `pnpm run build:preview` to build the interactive preview: five presets on the same content, light/dark mode, six page types, three templates, and Markdown for every page. Serve `dist-preview` with a static server; [preview instructions](./docs/authoring.md#交互预览与逐页源码) include the GitHub Pages workflow. The preview is prepared locally; no public URL is advertised until a deployment exists.

The demo deck is [example.md](./example.md); [preset-gallery.md](./examples/preset-gallery.md) compares all five preset identities with the same content. Build individual examples with `pnpm run build:zhubai`, `build:qingdai`, or `build:songmo`; matching `screenshot:*` commands export PNGs.

CI runs the complete quality gates and validates the npm tarball on pull requests and `master`. GitHub Releases trigger npm publishing through OIDC after the same checks pass. See [release setup and instructions](./docs/releasing.md).

See [testing and workspace maintenance](./docs/testing.md) for the gate coverage, focused checks, fixtures, and generated artifacts.
