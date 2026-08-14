# Implementation Plan: Fix Theme Visual Semantics

**Branch**: `003-fix-theme-visuals` | **Date**: 2026-07-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-fix-theme-visuals/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

**Agent context update**: Not applicable in this Spec Kit checkout. The repository does not
contain `.specify/scripts/bash/update-agent-context.sh`, an `AGENTS.md`, or another generated
agent-context file. This was verified after Phase 1, matching the limitation already recorded
for feature 002; no substitute context file was invented.

## Summary

Correct the reviewed visual-semantic regressions while simplifying the pre-1.0 public surface
to one canonical route per concept and preserving configuration precedence and the Obsidian
conversion boundary.
The implementation will consolidate callout and Badge tones in shared semantic tokens, correct
media and sequence geometry, normalize generated image presentation in the renderer, deduplicate
author display values, isolate fixture-only CSS, and reserve section brand regions. `Badge`
gains only additive `tone` and `marker` props, while closing logos use a private unframed
contained treatment. Existing Node/Playwright quality infrastructure will gain deterministic
geometry assertions, a targeted compact viewport, delayed-media layout-stability coverage, and
reviewed replacement of only those visual baselines that encode the known defects.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Vue 3.5.34 single-file components, CSS, and ESM on
Node.js `>=20.19.0`

**Primary Dependencies**: Slidev `52.15.2` (`@slidev/client`, `@slidev/types`,
`@slidev/cli`), Vue supplied by Slidev, Vite `8.0.13`, and the existing `slidev-pane` addon;
no new runtime dependency is planned

**Storage**: N/A; state is derived from deck/slide frontmatter, Vue props/slots,
Markdown/generated semantic markup, DOM render state, and retained visual/asset evidence

**Testing**: Node's built-in test runner, production Slidev builds, Playwright Chromium
`1.61.1`, Axe `4.12.1`, exact DPR-2 pixel baselines, computed-style and geometry assertions,
asset checks, and deterministic delayed-media layout-shift assertions

**Target Platform**: Slidev 52 browser presentations and static production output in the
maintained Chromium environment; canonical review is 980 × 552 logical pixels and targeted
compact review is 720 × 405, both 16:9 at DPR 2 and in light/dark modes

**Project Type**: Published npm Slidev theme/library with Vue layouts/components, shared CSS,
and optional generated Obsidian semantic markup

**Performance Goals**: N/A. Build duration, output size, bundle size, and navigation timing are
not requirements. Theme-owned media and fonts must still avoid post-visibility layout shift,
and new shipped assets remain subject to the 250 KiB review threshold.

**Constraints**: Preserve canonical component/layout names, ordinary Markdown,
`.obsidian-slidev-*` markup, `themeConfig.presentation` precedence, source order, focus
behavior, and the three-preset shared render tree. Because the package is pre-1.0, remove
unused aliases and duplicate compatibility inputs when a documented canonical replacement
exists. Add no unjustified shipped asset over 250 KiB; keep quality commands bounded against
hangs without treating elapsed build time as a product requirement.

**Scale/Scope**: 15 traceable review findings; 19 callout types in 7 families; 7 Badge tones;
Figure, generated image, two image/text orientations, and closing-logo media roles; author/link,
task/highlight, Steps/Timeline, chrome, section-brand, and bilingual-heading corrections;
3 presets × 2 modes with targeted canonical and compact viewport coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Maintainable Preset Architecture**: Identify affected shared layouts, `SlideFrame`,
  semantic markup, and tokens. Confirm the design does not fork layout or component behavior
  solely for a preset and keeps Obsidian conversion outside the theme.
  **PASS (pre-design)** — Corrections are owned by the existing shared components, private
  layout shells, renderer normalizers, semantic classes, and `--presentation-*` tokens.
  Presets supply token values and narrow typography/brand placement only; they do not receive
  family-specific component or layout forks. Generated-image enhancement consumes existing
  semantic markup after conversion and does not parse or convert Obsidian syntax.
- **Tests Are Release Gates**: Name the affected build commands, protocol fixture coverage,
  regression fixture or test, and light/dark 16:9 visual-review matrix.
  **PASS (pre-design)** — `pnpm run quality` remains blocking, with `pnpm run build`,
  `pnpm run build:fixture`, preset builds, and focused Node tests available for diagnosis.
  `fixtures/expanded-content.md` and `fixtures/obsidian-protocol.md` gain deterministic
  regression cases; all affected surfaces run in three presets and two modes at 980 × 552,
  while collision-prone cases also run at 720 × 405. Semantic/geometry gates must pass before
  reviewed visual baselines are replaced.
- **Consistent Presentation Experience**: Document public configuration or semantic-contract
  effects, cross-preset behavior, accessibility, overflow, and bilingual typography.
  **PASS (pre-design)** — `Badge.tone` and `Badge.marker` default to neutral and off. Canonical
  names, props, markup classes, and reading order remain valid. The explicitly removed pre-1.0
  aliases have direct migration notes. Shared family shapes, single link decoration, distinct
  author values, static task/Badge semantics, contrast/focus checks, section brand regions, and
  heading-separator normalization apply across all presets.
- **Stable Projection Behavior**: Identify theme-owned async media/font geometry and any new
  shipped asset over 250 KiB.
  **PASS (pre-design)** — Figure, closing-logo, and generated-media ready/failed transitions
  receive deterministic geometry checks. No performance baseline or raw-sample workflow is
  created because performance is not a specified outcome.

Any failed gate MUST be recorded in Complexity Tracking with an approved exception before
implementation proceeds.

**Pre-design gate result**: PASS. No exception is required to begin Phase 0.

### Post-design Constitution Re-check

- **Maintainable Preset Architecture — PASS**: The design keeps one semantic family registry,
  one Figure/generated-image vocabulary, one author normalizer, and one Steps/Timeline source
  model. A private closing-logo renderer reuses media state without exposing another public
  component. Preset files cannot redefine family marker geometry or authored casing, and a
  static source gate removes fixture selectors from shipped code.
- **Tests Are Release Gates — PASS**: Contracts define 114 callout and 42 Badge tone checks,
  geometric media and sequence assertions, link/author/task/highlight checks, generated
  protocol cases, canonical all-preset/mode review, targeted compact review, delayed-media
  stability, and reviewed baseline governance. Existing build and aggregate commands remain
  authoritative.
- **Consistent Presentation Experience — PASS**: The component, layout, and generated-content
  contracts preserve canonical names and inputs, logical source order, visible wording, native
  links/lists/images, valid email actions, non-color cues, code/highlight separation, bilingual
  content, and no-overlap safe regions. Removed pre-1.0 aliases map directly to `end`, `author`,
  and `fit`.
- **Stable Projection Behavior — PASS**: Delayed public/generated media tests require stable
  geometry and zero target-attributed layout shift. Asset checks retain the shipped-asset
  limit; no output or timing baseline is retained.

**Post-design gate result**: PASS with no exception.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-theme-visuals/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── components.md
│   ├── layouts.md
│   ├── generated-content.md
│   └── quality-gates.md
└── tasks.md             # Created later by /speckit-tasks, not by this workflow
```

### Source Code (repository root)

```text
components/
├── Authors.vue
├── Badge.vue
├── Callout.vue
├── Figure.vue
├── PresetBranding.vue
├── SlideFrame.vue
├── Steps.vue
└── Timeline.vue

internals/
├── ClosingLayout.vue
├── ClosingLogo.vue
└── ImageTextLayout.vue

setup/
├── authors.ts
├── callouts.ts
├── media.ts
├── presentation-config.ts
├── render-normalization.ts
├── task-lists.ts
└── main.ts

styles/
├── base.css
├── components.css
├── content-layouts.css
├── layouts.css
├── obsidian.css
├── tokens.css
└── presets/
    ├── shared.css
    ├── default.css
    ├── ucas.css
    └── ict.css

fixtures/
├── expanded-content.md
├── expanded-content.css
└── obsidian-protocol.md

fixtures/public/author-fixtures/
├── media-portrait.svg
├── media-landscape.svg
└── transparent-logo.svg

tests/quality/
├── accessibility.spec.mjs
├── content-contracts.spec.mjs
├── layout-stability.spec.mjs
├── visual-baselines.mjs
├── visual.spec.mjs
└── baselines/

scripts/
├── capture-visual-review.mjs
├── check-presentation-css.mjs
└── run-quality-gates.mjs

qa/fix-theme-visuals/
└── visual-review.md

README.md
package.json
```

**Structure Decision**: Extend the existing single-package theme and quality harness in place.
Canonical public APIs stay in the current component and layout trees. `ClosingLogo.vue` is
private under `internals/`; pure media/author/callout rules and idempotent render enhancement
stay under `setup/`; semantic geometry stays in shared CSS, with presets limited to tokens and
narrowly scoped identity refinements. Global component/layout styles load once through
`styles/index.ts`. Existing expanded/protocol decks are extended rather than adding another
three-build fixture family. Fixture composition and media live under `fixtures/`, and durable
visual review receives a feature-specific QA directory. Raw output/navigation samples are not
retained.

## Complexity Tracking

No constitutional exception is required.

## Follow-up Review Implementation Addendum (2026-07-26)

The follow-up implementation keeps the existing public names and semantic markup while:

- normalizing Badge marker text through the same Boolean contract used by configuration;
- letting the option-definition registry drive deck and slide resolution;
- preserving valid custom CSS `backgroundSize` values in image/text layouts;
- removing computed-style frame-chrome freezing, unused exports/selectors, and stale QA notes;
- moving example/build-only packages to development dependencies and shipping the documented
  `public/obsidian-card.svg`;
- removing the direct Google Fonts import and documenting local/system fallback behavior;
- keeping the default palette preset-owned, restoring the ICT serif token's semantic meaning,
  and adding a static TypeScript-to-CSS callout family drift check;
- using Slidev's typed slide virtual module for TOC data and language-neutral `+` wording for
  visible Kbd separators while exposing the spoken word “plus” to assistive technology;
- documenting removal of the undocumented `configs.info` footer fallback and removing obsolete
  output/navigation baseline machinery and raw samples.

A published package/namespace rename and a full three-preset cascade-layer rewrite remain
deferred because they are identity and visual-architecture projects, not required to remove
the concrete duplication reviewed here.

## Pre-1.0 Simplification Addendum (2026-07-26)

The maintainer confirmed that no 1.0 compatibility promise exists. The implementation therefore:

- narrows task normalization to recognized task-list contexts and leaves ordinary form controls
  interactive;
- keeps `end`, quote `author`, and Figure `fit` as the canonical surfaces, removing `thanks`,
  quote `cite`, and Figure `backgroundSize`;
- shares Vue media-load state and author-card markup instead of maintaining parallel component
  paths;
- keeps the semantically distinct `Steps` and `Timeline` wrappers while loading their shared
  implementation styles once;
- places slide accent directly on the rendered frame, removes unconsumed root/frame state, and
  uses CSS tokens for the safe region;
- normalizes generated callout family attributes from the TypeScript registry so CSS has no
  second type-to-family map;
- renders preset watermarks only on variants that display them;
- uses `package.json.files` as the sole publication allowlist and keeps fixture-only media under
  `fixtures/public/`;
- replaces the approximate CSS parser with narrow source invariants and removes dependency
  version policy from the CSS architecture check.

This is an intentional pre-1.0 cleanup with a direct migration path, not a compatibility
exception. The visual result should remain restrained, content-first, and low-ornament.
