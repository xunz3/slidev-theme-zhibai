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

Latin and Chinese families both use Slidev's native font loader. The theme maps the resolved `fonts.sans / serif / mono` stacks onto preset typography roles and does not import remote font CSS. `fonts.local` and `fonts.provider: none` keep font requests under the author's control. The defaults request upright weights supported by all five families. See the [font and offline configuration](./configuration.md#标准字体与离线演示).

The cover's `::visual::` region uses Slidev's [named layout slots](https://sli.dev/guide/write-layout) and [`::name::` slot shorthand](https://sli.dev/features/slot-sugar). The markup inside it remains authored Markdown, Vue components, or HTML. Zhubai does not parse it as a separate document format.

Each deck owns the meaning and source of its content. Put local figures in the deck's `public/` directory and provide their alternative text. Zhubai provides accessible figure handling and visual defaults; it does not download, reinterpret, or validate the underlying research material.

The package includes only the institutional signatures used by its presets. Demonstration and quality-test media live under `fixtures/public/author-fixtures/` and are excluded from the published theme. The sample deck illustrates ordinary Slidev authoring without adding a second runtime or producer protocol.

## Institutional sources

- [UCAS identity resources](https://onestop.ucas.edu.cn/home/info/6b9e95dc-5785-4eee-b25f-1f884698cfc3) provide the reference for preserving the existing official bilingual signature without redrawing it.
- [UCAS presentation resources](https://onestop.ucas.edu.cn/Home/Info/e1e7b553-14c1-42f3-910a-88d25ebf9c48) are the official template resource index.
- The ICT horizontal signature comes from the [official site](https://www.ict.ac.cn/); its original URL, retrieval details, and ownership notes remain in [the asset source record](../assets/ICT/SOURCES.md).

Theme palettes and compositions are design choices, not official institutional brand specifications. Institutional marks retain their original proportions and ownership.
