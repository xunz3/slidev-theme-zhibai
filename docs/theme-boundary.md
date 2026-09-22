# Lilas and obsidian-slidev boundaries

Lilas is a standalone Slidev theme. Its three presets (`default`, `ucas`, `ict`) share a public layout and component API and supply visual differences through scoped styles and artwork. Deck configuration stays at `themeConfig.presentation`; per-slide overrides keep their documented frontmatter names.

This follows [Writing Themes](https://sli.dev/guide/write-theme) and [Theme and Addons](https://sli.dev/guide/theme-addon). Slidev supplies Markdown compilation, navigation, click sequencing, and export. Theme defaults live in `package.json` under `slidev.defaults`.

| Concern | Owner |
| --- | --- |
| Typography, light/dark colors, artwork, branding, chrome | Lilas theme/presets |
| Layouts and visual components such as Callout and Figure | Lilas |
| Standard Markdown task-list appearance and heading typography | Lilas |
| Vault note selection, wiki links, embeds, Markdown conversion, asset copying | obsidian-slidev |
| Generated HTML rendering and compatibility across themes | Producer or independent Slidev addon |
| Protocol declarations, support manifest, compatibility events and diagnostics | Producer or independent addon |
| Optional fullscreen image viewer | Deck customization or independent addon |

## Producer-side handoff

The theme no longer ships `obsidianSlidev.support`, the protocol runtime/compatibility bridge, generated-callout or generated-image normalizers, `.obsidian-slidev-*` selectors, protocol fixtures, or vendored protocol releases. Theme components use their own `presentation-*` classes; these are implementation details, not a replacement producer protocol.

An independent producer should emit standard Slidev Markdown and native components where possible. If it needs custom HTML or Obsidian-specific semantics, it must provide rendering/styles itself, for example through a separately selected addon. That output must work when Lilas is replaced by another theme. Producing `<Callout>` or `<Figure>` from Lilas is an explicit choice to use Lilas's component API, not a requirement for obsidian-slidev.

The producer should copy vault assets into its generated deck's `public/` directory and generate deck-local URLs. It should own unresolved-link diagnostics and any protocol checks, without inspecting this theme's package metadata.

This repository change does not implement or publish an addon and does not modify the separate obsidian-slidev repository. Its consumer-side migration must be completed there before relying on legacy generated HTML with this theme version. Removed implementation remains recoverable from Git history.

## Validation

Theme checks cover ordinary Slidev decks, public component behavior, three-preset isolation, dark/light modes, assets, layout stability, accessibility, and motion. Producer conformance fixtures belong with the producer/addon. The source-boundary check rejects Obsidian runtime hooks in shipped theme source.
