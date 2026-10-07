# Changelog

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
