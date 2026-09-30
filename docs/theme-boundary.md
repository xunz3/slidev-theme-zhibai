# Zhubai's theme boundary

Zhubai is a presentation theme for Slidev. It supplies slide appearance, layouts, reusable visual components, and default configuration. Slidev's [Writing Themes](https://sli.dev/guide/write-theme) guide describes these as theme capabilities; it recommends addons for features that remain useful independently of a theme. The [Theme and Addons](https://sli.dev/guide/theme-addon) guide explains how projects combine one theme with optional addons.

| Responsibility | Owner |
| --- | --- |
| Preset typography, color, page layout, and institutional signatures | Zhubai |
| Cover, section, content, figure, quote, and closing compositions | Zhubai layouts |
| Callouts, figures, authors, steps, tags, badges, and timelines | Zhubai components |
| Research claims, figure sources, alternative text, and deck-local media | The deck author |
| Markdown compilation, navigation, slide transitions, and export | Slidev |
| Import/conversion workflows, external services, and independent interactions | The producing application or a Slidev addon |

Zhubai follows Slidev's [directory structure conventions](https://sli.dev/custom/directory-structure) for layouts, components, styles, setup, and static institutional assets. These extension directories are optional in Slidev; a theme includes only the ones it uses. The package declares Slidev `>=52.15.2`, the minimum version currently validated for this release.

Latin font families use Slidev's native webfont defaults. The theme separately imports Inter 500 and upright Noto Sans SC and Noto Serif SC through Google CSS2, while keeping them in Slidev's local list to avoid requesting unsupported CJK italics. This is CSS-only and adds no font-loading runtime. The exact roles and sizes are in the [typography specification](./zhubai-design.md#6-字体排印).

The cover's `::visual::` region uses Slidev's [named layout slots](https://sli.dev/guide/write-layout) and [`::name::` slot shorthand](https://sli.dev/features/slot-sugar). The markup inside it remains authored Markdown, Vue components, or HTML. Zhubai does not parse it as a separate document format.

Each deck owns the meaning and source of its content. Put local figures in the deck's `public/` directory and provide their alternative text. Zhubai provides accessible figure handling and visual defaults; it does not download, reinterpret, or validate the underlying research material.

The package includes only the institutional signatures used by its presets. Demonstration and quality-test media live under `fixtures/public/author-fixtures/` and are excluded from the published theme. The sample deck illustrates ordinary Slidev authoring without adding a second runtime or producer protocol.
