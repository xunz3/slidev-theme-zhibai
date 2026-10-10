# Changelog

## 0.6.2 — 2026-10-10

- Calibrate all five presets to 36px side margins, a 28px top inset and a 20px bottom inset. Remove unused scrollbar space so headings, content and footers share both reading edges.
- Separate footers from content with a consistent 1px rule, 12px content gap and 8px padding below the rule. Apply the same geometry to native Slidev layouts and optional cover footers.
- Use symmetric vertical insets for centered pages without footers, and align UCAS and ICT marks with the shared reading axes while preserving centered UCAS covers. Add browser regression coverage for these spacing and alignment contracts.

## 0.6.1 — 2026-10-07

- Widen the shared content grid with 44px side margins, 32px column gaps, and aligned prose, tables, callouts and code across all five presets.
- Pair Source Sans 3 and Source Serif 4 with the standard Noto Chinese families; give Zhubai serif content titles and use the configured quote face without relying on local Kai fonts.
- Compose citations with quotation marks, rules and separate source labels. Support `[!cite]` and `[!quote]` through the existing Callout component, and refresh the standalone quote layouts and visual galleries.
- Keep content citations at the 18px reading size (16px in columns). Style plain blockquotes as compact 16px sans-serif side notes with secondary text and a faint 1px rail; reserve quotation marks and source labels for citations.

## 0.6.0 — 2026-10-07

- Rename the theme brand to 知白 (Zhibai), the npm package to `slidev-theme-zhibai`, and the GitHub repository to `xunz3/slidev-theme-zhibai`.
- Update installation, examples, portable preview sources, and release automation to the new package name.
- Keep 朱白 (`zhubai`) as the default preset, with all preset IDs, CSS tokens, layouts, and component APIs unchanged.

## 0.5.1 — 2026-10-02

- Default all five cover presets to centered alignment. Unify vertical spacing for text-only Zhubai, Qingdai and Songmo covers while retaining institutional logo and image-cover spacing.
- Fix long English titles, footnote spacing and multi-author covers. Share repeated affiliations, retain accessible author associations, and allow email addresses to wrap.
- Apply preset and footer configuration consistently to native Slidev layouts, preserve `none`, and honor standard font configuration without forced remote font CSS.
- Consolidate page-level presentation options and compatibility aliases; support unequal two-column layouts and refine preset typography and content styles.
- Add Chinese and English preset galleries, three scenario templates, authoring/configuration guides and an interactive source preview with a manual Pages workflow.
- Remove obsolete Veil design records, screenshots and duplicate gallery tests; retain current coverage and document the quality gates.

## 0.5.0 — 2026-09-30

- Introduce Zhubai, Qingdai, Songmo, UCAS and ICT presets, optional seals, shared presentation tokens and compatibility aliases.
- Rename the package to `slidev-theme-zhubai` and add quality-gated GitHub/npm release automation.
