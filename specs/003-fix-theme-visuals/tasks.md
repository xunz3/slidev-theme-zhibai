---

description: "Dependency-ordered implementation tasks for fixing theme visual semantics"
---

# Tasks: Fix Theme Visual Semantics

**Input**: Design documents from `/specs/003-fix-theme-visuals/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and
`quickstart.md`

**Tests**: Tests and verification are required for every behavior change by the feature
specification and project constitution. Story tests must be written and observed failing for
the reviewed regression before the corresponding implementation tasks begin.

**Organization**: Tasks are grouped by user story so each correction can be implemented and
tested as an independently demonstrable increment. Setup includes the harness-only work and
deterministic fixtures that must exist before theme rendering changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other ready tasks because it touches different files and
  does not depend on their incomplete work.
- **[Story]**: Maps a task to one specification user story.
- Every task names the exact repository file or directory it changes or records.

## Phase 1: Setup (Harness-Only Preconditions)

**Purpose**: Create deterministic fixtures, stable scenario identities, and a feature-specific
visual review record without correcting production rendering yet.

- [X] T001 [P] Add labeled portrait, landscape, transparent-wide-logo, and transparent-tall-logo geometric fixtures in `public/author-fixtures/media-portrait.svg`, `public/author-fixtures/media-landscape.svg`, `public/author-fixtures/transparent-logo-wide.svg`, and `public/author-fixtures/transparent-logo-tall.svg`
- [X] T002 [P] Create a requirement-linked visual review record with environment, reviewer, result, skip-owner, and follow-up fields in `qa/fix-theme-visuals/visual-review.md`
- [X] T003 Add stable same-source Figure/image-layout/closing-logo, 19-type callout, link-form, and author-fallback cases to `fixtures/expanded-content.md` without changing shipped theme styles
- [X] T004 Add stable seven-tone Badge, marker-state, native/generated task, prose/code highlight, and zero/one/many Steps/Timeline cases to `fixtures/expanded-content.md`
- [X] T005 Add stable minimal/rich closing, chrome-role, UCAS/ICT section-brand, bilingual-heading, and targeted compact-risk cases to `fixtures/expanded-content.md`
- [X] T006 [P] Add generated callout-family, ready/delayed/decorative/failed image, component-equivalence, inline/wrapped/block link, generated-task, and prose/code-highlight cases to `fixtures/obsidian-protocol.md`
- [X] T007 [P] Create fixture-only gallery/probe composition in `fixtures/expanded-content.css` and load it only in generated fixture decks through `tests/quality/helpers.mjs`
- [X] T008 Register deterministic delayed public/generated media ready/failure scenarios with stable case IDs and target selectors in `tests/quality/layout-stability.spec.mjs`
- [X] T009 [P] Preserve approved visual and asset baseline immutability during normal validation in `tests/quality/run.mjs`
- [X] T010 Keep build/output/navigation performance outside the feature gate and omit raw sampling baselines from the final repository

**Checkpoint**: Deterministic regression inputs and review surfaces exist.

---

## Phase 2: Foundational (Blocking Shared Infrastructure)

**Purpose**: Establish the shared contracts used by multiple stories without introducing
preset-specific component forks.

**Critical**: All user-story implementation depends on this phase.

- [X] T011 [P] Generalize the canonical seven-family registry and case-insensitive family normalizer for Callout and Badge use in `setup/callouts.ts`
- [X] T012 [P] Add shared fit, alternative-text, load-state, and generated-image ownership helpers in `setup/media.ts`
- [X] T013 [P] Define protected semantic-family roles, media viewport roles, Badge/highlight/sequence roles, and the frame-local chrome accent in `styles/tokens.css` and `styles/presets/shared.css`
- [X] T014 [P] Add one idempotent subtree-scoped render-normalization host with listener cleanup and register it through the existing app lifecycle in `setup/render-normalization.ts` and `setup/main.ts`
- [X] T015 [P] Add canonical 980×552 DPR-2 and compact 720×405 DPR-2 reusable matrix helpers without duplicating every visual baseline in `tests/quality/helpers.mjs` and `scripts/capture-visual-review.mjs`

**Checkpoint**: Shared family, media, token, normalization, and viewport infrastructure is ready;
user-story test-first work can proceed.

---

## Phase 3: User Story 1 — Render Media as Authored (Priority: P1) MVP

**Goal**: Make `contain` and `cover` geometrically correct for Figure and both image/text
orientations, while rendering transparent closing logos completely in a stable unframed region.

**Independent Test**: Render the same labeled portrait and landscape sources under both fits in
Figure, `image-left`, and `image-right`, then render delayed, failed, decorative, wide, and tall
closing logos in every preset/mode at the maintained viewports. Verify complete containment,
required cover cropping, stable captions/adjacent regions, meaningful fallback, and zero tray or
layout shift.

### Tests for User Story 1

- [X] T016 [P] [US1] Add failing same-source contain/cover pixel-probe, computed-fit, aspect-ratio, caption, fallback, and closing-logo contract cases in `tests/quality/content-contracts.spec.mjs`
- [X] T017 [P] [US1] Add failing delayed Figure and closing-logo success/failure geometry and target-attributed layout-shift cases in `tests/quality/layout-stability.spec.mjs`
- [X] T018 [P] [US1] Add failing media alternative, decorative exclusion, overflow, and canonical/compact checks across preset/mode matrices in `tests/quality/accessibility.spec.mjs`
- [X] T019 [P] [US1] Register requirement-linked Figure, image-left/right, and transparent closing-logo review scenarios in `tests/quality/visual-baselines.mjs`

### Implementation for User Story 1

- [X] T020 [P] [US1] Apply the shared media fit/alternative/load-state contract while preserving the public API and stable viewport in `components/Figure.vue`
- [X] T021 [P] [US1] Preserve narrative-first DOM order and correct default/explicit fit geometry for both orientations in `internals/ImageTextLayout.vue`
- [X] T022 [P] [US1] Implement the private contained, unframed, stable-state logo renderer with meaningful/decorative fallback behavior in `internals/ClosingLogo.vue`
- [X] T023 [US1] Replace the Figure-based closing logo with the private logo renderer while preserving public `logo` and `logoAlt` inputs in `internals/ClosingLayout.vue`
- [X] T024 [P] [US1] Make Figure viewport sizing, `data-media-fit`, object-fit ownership, caption placement, and failed-image fallback geometry unambiguous in `styles/obsidian.css`
- [X] T025 [P] [US1] Align both image/text orientations and the private closing-logo region without tray, crop, overflow, or decode shift in `styles/content-layouts.css`
- [X] T026 [US1] Run the US1 contract, accessibility, delayed-media, and production fixture checks and record the independent-test result and artifacts in `qa/fix-theme-visuals/visual-review.md`

**Checkpoint**: User Story 1 is independently demonstrable and is the suggested MVP.

---

## Phase 4: User Story 2 — Preserve Callout Meaning Across Presets (Priority: P1)

**Goal**: Preserve all 19 callout types, seven families, protected non-color marker shapes,
family tone, authored casing, and compact hierarchy in every preset and supported mode.

**Independent Test**: Render all 19 types plus neutral/invalid/generated fallbacks with authored,
default, acronym, mixed-case, CJK, bilingual, long, and compact titles. The 114
type/preset/mode checks must retain family marker geometry and readable family title/marker tone
without preset-wide casing or shape flattening.

### Tests for User Story 2

- [X] T027 [P] [US2] Add failing 114-case callout family/type/casing/geometry/tone matrix plus neutral, invalid, compact, and generated-class fallback assertions in `tests/quality/content-contracts.spec.mjs`
- [X] T028 [P] [US2] Add failing callout title/marker contrast, non-color meaning, source-order, and compact overflow checks across preset/mode matrices in `tests/quality/accessibility.spec.mjs`
- [X] T029 [P] [US2] Register all specialized families, neutral comparisons, authored-title casing, and compact-density review scenarios in `tests/quality/visual-baselines.mjs`

### Implementation for User Story 2

- [X] T030 [P] [US2] Consume only the canonical family registry and preserve the resolved authored/default title string and labeled-note semantics in `components/Callout.vue`
- [X] T031 [US2] Centralize family tone, protected diamond/triangle/square/ring/bar geometry, generated modifier fallbacks, and production compact hierarchy in `styles/obsidian.css`
- [X] T032 [P] [US2] Remove default-preset marker flattening and keep only preset-native palette/typography refinements in `styles/presets/default.css`
- [X] T033 [P] [US2] Remove UCAS title recasing and specialized-family tone overrides while retaining institutional identity styling in `styles/presets/ucas.css`
- [X] T034 [P] [US2] Remove ICT title recasing and specialized-family tone overrides while retaining institutional identity styling in `styles/presets/ict.css`
- [X] T035 [US2] Run the 114-case contract, protocol build, accessibility, and visual checks and record the independent-test result and artifacts in `qa/fix-theme-visuals/visual-review.md`

**Checkpoint**: User Story 2 is independently demonstrable without changing callout authoring.

---

## Phase 5: User Story 3 — Read Links and Author Details Once (Priority: P1)

**Goal**: Render one glyph-bounded persistent underline per link and each distinct author value
once, with valid primary or secondary emails remaining actionable.

**Independent Test**: Exercise inline, wrapped, block, generated, author, closing-contact, and
focused links plus complete, name-only, institution-only, valid-email-only,
invalid-email-only, normalized-equal, duplicate-record, and mixed author collections in every
preset/mode.

### Tests for User Story 3

- [X] T036 [P] [US3] Add failing link-decoration counts and per-card distinct author value/action/order assertions for all required forms in `tests/quality/content-contracts.spec.mjs`
- [X] T037 [P] [US3] Add failing keyboard-focus, outline contrast, author-email actionability, source-order, and wrapped/block link overflow checks in `tests/quality/accessibility.spec.mjs`
- [X] T038 [P] [US3] Register inline/wrapped/block/generated/contact links and complete/fallback author cards for visual review in `tests/quality/visual-baselines.mjs`

### Implementation for User Story 3

- [X] T039 [US3] Normalize each author to a primary source/action plus distinct secondary institution/email values while preserving exact-after-trim equality, email-before-institution fallback, record order, and duplicate records in `setup/authors.ts`
- [X] T040 [US3] Render an actionable primary email or distinct secondary details exactly once per card in `components/Authors.vue`
- [X] T041 [US3] Update cover, footer, and closing author consumers to use the same normalized primary/detail contract without consumer-specific fallbacks in `layouts/cover.vue`, `components/SlideFrame.vue`, and `internals/ClosingLayout.vue`
- [X] T042 [P] [US3] Enforce one persistent text underline, zero bottom border, inherited block behavior, and the existing focus-visible outline for Markdown/generated/author/closing anchors in `styles/base.css` and `styles/obsidian.css`
- [X] T043 [US3] Run author/link contracts, focus/overflow checks, affected builds, and visual review and record the independent-test result in `qa/fix-theme-visuals/visual-review.md`

**Checkpoint**: User Story 3 is independently demonstrable with no duplicated values or
container-width link rules.

---

## Phase 6: User Story 4 — Scan Status and Emphasis Correctly (Priority: P2)

**Goal**: De-emphasize completed work, add optional semantic Badge tones/markers, and present
prose highlights as a flat warm wash distinct from Tag, code, and Kbd.

**Independent Test**: Render native/generated and nested task states, all seven Badge tones in
marker-on/off/authored-icon/invalid/default states, and wrapped native/generated highlights
beside links, inline code, code blocks, and Kbd in every preset/mode.

### Tests for User Story 4

- [X] T044 [P] [US4] Add failing 42-case Badge tone matrix, marker cardinality, authored-content preservation, task relative-weight/nested-state, and highlight fingerprint assertions in `tests/quality/content-contracts.spec.mjs`
- [X] T045 [P] [US4] Add failing Badge/task/highlight contrast, non-color distinction, non-focusability, code-scope reset, and compact overflow checks in `tests/quality/accessibility.spec.mjs`
- [X] T046 [P] [US4] Register all Badge states, mixed native/generated tasks, and highlight-versus-code/Kbd comparisons for visual review in `tests/quality/visual-baselines.mjs`

### Implementation for User Story 4

- [X] T047 [P] [US4] Add typed additive `tone` and Boolean `marker` props, neutral fallback, stable data state, and one optional decorative marker node in `components/Badge.vue`
- [X] T048 [P] [US4] Apply shared family palettes and marker geometries while keeping Badge structurally distinct from Tag, code, and Kbd in `styles/components.css`
- [X] T049 [US4] Give unchecked tasks primary emphasis and checked tasks normal-weight muted text with an unchanged box/checkmark cue and nested unchecked reset in `styles/base.css`
- [X] T050 [US4] Replace prose highlight borders, radius, and shadows with a mode-aware warm flat wash while retaining wrapped-line cloning and complete code resets in `styles/base.css`
- [X] T051 [P] [US4] Preserve checked state, disabled/tabindex behavior, idempotence, accessible labels, and nested native/generated task class normalization in `setup/task-lists.ts`
- [X] T052 [US4] Run the 42-case Badge matrix, task/highlight contracts, accessibility, affected builds, and visual review and record the independent-test result in `qa/fix-theme-visuals/visual-review.md`

**Checkpoint**: User Story 4 is independently demonstrable without making status decoration
interactive or changing Kbd.

---

## Phase 7: User Story 5 — Follow Steps and Timelines Clearly (Priority: P3)

**Goal**: Present Steps as numbered procedure nodes and Timeline as unnumbered chronological
nodes on one clean rail, with aligned dated/undated labels and no orphan connectors.

**Independent Test**: Render zero, one, two, many, long, wrapped, bilingual, custom-numbered,
dated, undated, and non-list fallback cases in every preset/mode and maintained viewport.

### Tests for User Story 5

- [X] T053 [P] [US5] Add failing source-order, authored numbering, node-center, connector-endpoint, single-rail, hidden-ordinal, and dated/undated label geometry assertions in `tests/quality/content-contracts.spec.mjs`
- [X] T054 [P] [US5] Add failing ordered-list semantics, decoration exclusion, canonical/compact overflow, and zero/one-item checks in `tests/quality/accessibility.spec.mjs`
- [X] T055 [P] [US5] Register zero/one/many, wrapped/bilingual, and dated/undated Steps/Timeline review scenarios in `tests/quality/visual-baselines.mjs`

### Implementation for User Story 5

- [X] T056 [US5] Split sequence styling into Steps counters/numbered nodes and Timeline unnumbered nodes, derive center-to-center adjacent connectors from shared tokens, remove the second Timeline edge rail, and align leading `time`/`strong` labels in `styles/components.css`
- [X] T057 [US5] Run sequence geometry, semantics, compact overflow, affected builds, and visual review and record the independent-test result in `qa/fix-theme-visuals/visual-review.md`

**Checkpoint**: User Story 5 is independently demonstrable and remains meaningful as an
ordered list when decoration is unavailable.

---

## Phase 8: User Story 6 — Present a Coherent, Collision-Free Theme (Priority: P3)

**Goal**: Center minimal closings, balance rich closings, align structural chrome, reserve safe
brand regions, prevent orphan bilingual separators, converge generated images on the media
vocabulary, and remove fixture-only behavior from the distributed theme.

**Independent Test**: Review minimal/rich closing states, generated/public media equivalence,
all chrome consumers, compact callouts, top-right heading/Figure/caption/link/control probes,
spaced-U+00B7 headings, and production-source isolation across all presets/modes at canonical
and targeted compact viewports.

**Story Dependencies**: Core closing/chrome/section-brand/normalization work can start after Phase 2.
The complete independent test also requires US1's media/logo contract and US2's compact callout
contract.

### Tests for User Story 6

- [X] T058 [P] [US6] Add failing source-isolation and architecture assertions for quality/gallery/probe selectors, preset marker/casing overrides, shared-family ownership, fixture exclusion, runtime dependencies, and shipped assets in `tests/quality/configuration.spec.mjs`
- [X] T059 [P] [US6] Add failing minimal/rich closing, generated-media equivalence, chrome-role, section-lockup intersection, and bilingual-separator line/idempotence assertions in `tests/quality/content-contracts.spec.mjs`
- [X] T060 [P] [US6] Add failing canonical/compact closing, generated alternative, brand collision, heading wrap, focus-order, clipping, overflow, and observer-error checks in `tests/quality/accessibility.spec.mjs`
- [X] T061 [P] [US6] Add failing delayed generated-image success/failure geometry and zero-shift expectations in `tests/quality/layout-stability.spec.mjs`
- [X] T062 [P] [US6] Register minimal/rich closing, generated/public media, chrome, section-brand, compact-callout, and bilingual-wrap review scenarios in `tests/quality/visual-baselines.mjs`

### Implementation for User Story 6

- [X] T063 [US6] Enhance only direct generated image figures with idempotent pending/ready/failed state and meaningful/decorative fallback without reparenting or double-managing Vue nodes in `setup/render-normalization.ts`
- [X] T064 [US6] Normalize only the breaking space before canonical spaced U+00B7 in headings/title/subtitle text through the shared idempotent initial/addition pass in `setup/render-normalization.ts`
- [X] T065 [P] [US6] Derive stable minimal/rich closing state, preserve message-contact-authors-logo DOM order, and omit absent region wrappers in `internals/ClosingLayout.vue`
- [X] T066 [P] [US6] Center minimal closing content and balance rich content/logo/authors without changing logical order or compact containment in `styles/content-layouts.css`
- [X] T067 [P] [US6] Expose the frame-local chrome accent to shared frame content and structural consumers in `components/SlideFrame.vue`, `styles/layouts.css`, and `styles/base.css`
- [X] T068 [P] [US6] Consume the shared secondary chrome role without redefining semantic carriers in `styles/presets/default.css`
- [X] T069 [P] [US6] Set UCAS chrome and measured shallow mark reserve while removing per-consumer strength drift and preserving protected artwork in `styles/presets/ucas.css`
- [X] T070 [P] [US6] Set ICT chrome and measured shallow mark reserve while removing per-consumer strength drift and preserving protected artwork in `styles/presets/ict.css`
- [X] T071 [US6] Remove shipped gallery/probe/quality selectors, replace the code-layout quality-marker dependency with a semantic internal wrapper, and retain equivalent fixture composition in `styles/components.css`, `styles/content-layouts.css`, `layouts/code.vue`, and `fixtures/expanded-content.css`
- [X] T072 [P] [US6] Implement the packaged-source static gate for fixture selectors, preset semantic overrides, family duplication, dependency drift, asset size, and converter-boundary violations in `scripts/check-presentation-css.mjs`
- [X] T073 [P] [US6] Reserve direct generated-image geometry from first paint and align fit, caption, state, and fallback presentation with public Figure in `styles/obsidian.css`
- [X] T074 [US6] Run static isolation, generated protocol, closing/chrome/section-brand/heading contracts, compact accessibility, navigation stability, affected builds, and visual review and record the independent-test result in `qa/fix-theme-visuals/visual-review.md`

**Checkpoint**: User Story 6 is independently demonstrable after its declared US1/US2
integration dependencies, and production behavior no longer depends on fixture markers.

---

## Phase 9: Polish and Cross-Cutting Release Gates

**Purpose**: Document corrected public behavior, approve intentional visual changes only after
semantic gates pass, and run the complete release gate.

- [X] T075 [P] Document media fit/defaults, generated equivalence/failure, unframed closing logos, single link treatment, author fallback, callout invariants, Badge inputs, sequences, tasks/highlights, chrome/section-brand spacing, bilingual wrapping, no-migration behavior, and intentional corrections in `README.md`
- [X] T076 [P] Update ordinary standalone demonstrations of corrected components/layouts and preset behavior in `example.md`, `fixtures/default-preset.md`, `fixtures/ucas-preset.md`, and `fixtures/ict-preset.md`
- [X] T077 Run all maintained production builds and focused static/semantic/accessibility/layout-stability tests, then record commands, environment, outcomes, and any owned follow-up in `qa/fix-theme-visuals/visual-review.md`
- [X] T078 Remove obsolete build-output/navigation baseline update machinery and committed raw performance samples while retaining the shipped-asset and zero-layout-shift gates
- [X] T079 Capture and review all canonical preset/mode surfaces plus the targeted compact matrix, mapping every expected change to requirement IDs in `qa/fix-theme-visuals/visual-review.md`
- [X] T081 Replace only semantic-, geometry-, accessibility-, and review-approved pixel references that encode specified defects, with reviewer and rationale provenance, in `tests/quality/baselines/visual/` and `tests/quality/baselines/visual/manifest.json`
- [X] T082 Run `pnpm run quality` and record a zero-failed/skipped/harness-error, baseline-immutable completion result from `.artifacts/quality/summary.json` in `qa/fix-theme-visuals/visual-review.md`
- [X] T083 Audit compatibility, package contents, lockfile/runtime dependency stability, asset limits, and whitespace with `package.json`, `pnpm-lock.yaml`, `.artifacts/quality/summary.json`, and `git diff --check`, documenting any approved exception in `specs/003-fix-theme-visuals/plan.md`

---

## Phase 10: Follow-up Review Remediation

**Purpose**: Reconcile the maintainer-provided follow-up review with the shipped contracts,
remove unnecessary implementation paths, and remove performance measurement machinery that is
not a product requirement.

- [X] T084 Update the English specification, plan, research, contracts, quickstart, and review traceability for FR-033–FR-042, explicit absence of performance baselines, and deferred breaking/high-churn architecture work in `specs/003-fix-theme-visuals/`
- [X] T085 [P] Add failing Badge textual-Boolean, registry-driven configuration, package/font/asset, dead-source, token-ownership, Kbd/TOC, and callout-map drift assertions in `tests/quality/configuration.spec.mjs` and `tests/quality/content-contracts.spec.mjs`
- [X] T086 [P] Add failing percentage/custom `backgroundSize` preservation and fallback cases for both image/text orientations in `fixtures/expanded-content.md` and `tests/quality/content-contracts.spec.mjs`
- [X] T087 Implement textual Badge marker normalization, registry-driven presentation resolution, and removal of unused normalization/task/author/root-state exports in `components/Badge.vue`, `setup/presentation-config.ts`, `setup/task-lists.ts`, `setup/render-normalization.ts`, `setup/authors.ts`, and `setup/main.ts`
- [X] T088 Remove computed-style frame-chrome synchronization, dead header-mark selectors, duplicate default selectors, conflicting root palette ownership, and the ICT serif-token violation in `components/SlideFrame.vue`, `setup/frame-chrome.ts`, `styles/layouts.css`, `styles/tokens.css`, `styles/presets/default.css`, and `styles/presets/ict.css`
- [X] T089 Preserve valid custom image-layout background sizes with accessible load/failure behavior and document the precise contract in `internals/ImageTextLayout.vue`, `components/Figure.vue`, `setup/media.ts`, `styles/obsidian.css`, and `README.md`
- [X] T090 Reclassify example/build dependencies, ship the documented card asset, remove the remote Noto import, internalize preset branding, use typed Slidev TOC data, expose a screen-reader-safe Kbd separator, remove stale QA notes, and add the static callout mapping guard in `package.json`, `pnpm-lock.yaml`, `styles/base.css`, `internals/PresetBranding.vue`, `layouts/toc.vue`, `components/Kbd.vue`, and quality tests
- [X] T091 Run focused configuration/content/package/static/build checks and record the follow-up review result in `qa/fix-theme-visuals/visual-review.md`
- [X] T092 Run the complete semantic, accessibility, visual, asset, stability, and build gate, then audit package contents and whitespace

---

## Phase 11: Pre-1.0 Simplification

**Purpose**: Apply the maintainer's explicit pre-1.0 evolution policy, remove unused aliases and
parallel implementation paths, and keep the shipped theme quiet, simple, and narrowly scoped.

- [X] T093 Update the English specification, plan, research, data model, contracts, and quickstart with the pre-1.0 compatibility policy, canonical closing API, simplified component surfaces, and low-ornament design direction in `specs/003-fix-theme-visuals/`
- [X] T094 Add failing regression coverage for interactive non-task checkboxes, canonical layout/component APIs, dead frame state, centralized style loading, callout-family ownership, and conditional branding in `tests/quality/configuration.spec.mjs` and `tests/quality/content-contracts.spec.mjs`
- [X] T095 Narrow task normalization to task-list contexts, remove dead root/frame state, and attach local accent state directly to the rendered frame in `setup/task-lists.ts`, `setup/main.ts`, `setup/presentation-config.ts`, and `components/SlideFrame.vue`
- [X] T096 Share media load state and author-card rendering, remove unused Figure/quote compatibility inputs and the `thanks` layout alias, and simplify Kbd markup and layout prop declarations in `setup/media.ts`, `components/Figure.vue`, `internals/ClosingLogo.vue`, `components/Authors.vue`, `layouts/cover.vue`, `layouts/quote.vue`, `layouts/intro.vue`, `layouts/end.vue`, and `layouts/thanks.vue`
- [X] T097 Normalize generated callout families through the canonical TypeScript registry, centralize global component/layout style loading, remove duplicate media/preset selectors, and avoid rendering hidden preset watermarks in `setup/callouts.ts`, `setup/render-normalization.ts`, `styles/index.ts`, `styles/obsidian.css`, `styles/presets/default.css`, `styles/presets/shared.css`, `styles/presets/ict.css`, `styles/presets/ucas.css`, and `internals/PresetBranding.vue`
- [X] T098 Consolidate fixture-only public assets, remove the redundant npm ignore track, and replace the approximate CSS parser/version-policy linter with narrow source invariants in `fixtures/public/author-fixtures/`, `public/author-fixtures/`, `.npmignore`, `tests/quality/helpers.mjs`, `tests/quality/assets.spec.mjs`, `tests/quality/brand-assets.mjs`, and `scripts/check-presentation-css.mjs`
- [X] T099 Update the maintained English README, examples, fixtures, quality scenarios, and migration notes to use the canonical `end`, `author`, and `fit` surfaces in `README.md`, `example.md`, `fixtures/`, and `tests/quality/`
- [X] T100 Run focused source/content/package checks, all maintained builds, the complete quality gate, package dry-run, and whitespace audit; record the pre-1.0 simplification result in `qa/fix-theme-visuals/visual-review.md`

---

## Phase 12: Final Review Corrections and Repository Hygiene

**Purpose**: Address the final maintainer review without restoring compatibility-only paths or
inventing performance and external-review gates.

- [X] T101 Restore Kbd runtime input guards, filter non-string entries, expose the spoken word “plus”, and add a mixed-value fixture regression in `components/Kbd.vue`, `fixtures/expanded-content.md`, and quality tests
- [X] T102 Standardize every layout-owned `chrome` prop on `PresentationChrome | boolean` and remove the ineffective image-layout `aspect-ratio` declaration in `layouts/`, `internals/`, and `styles/content-layouts.css`
- [X] T103 Document the removed `configs.info` footer fallback, delete the obsolete performance baseline/update subsystem and raw JSON samples, and retain only blocking visual, asset, accessibility, build, and layout-stability evidence
- [X] T104 Amend the constitution and generation templates so future tasks do not invent fixed reviewer cohorts or performance baselines unless explicitly requested
- [X] T105 Run focused contracts, static checks, layout stability, maintained builds, the complete quality gate, package dry-run, and whitespace validation; refresh `qa/fix-theme-visuals/visual-review.md`
- [X] T106 Organize the completed work into logical commits without including unrelated workspace metadata

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately and establishes deterministic fixtures and gates.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks all story implementation.
- **US1–US5**: Their failing tests may be prepared after fixture setup; implementation starts
  after Phase 2. They are independently testable and may proceed in parallel where file
  ownership permits.
- **US6**: Core work depends on Phase 2; complete validation additionally depends on US1 and
  US2.
- **Phase 9 — Polish**: Depends on every story selected for release. T081 follows semantic,
  geometry, accessibility, and visual review of the changed references.
- **Phase 11 — Pre-1.0 Simplification**: Depends on the follow-up remediation. T093 establishes
  the revised contract; T094 is observed failing before T095–T098; T099 follows public-surface
  changes; T100 is the final technical gate.
- **Phase 12 — Final Review Corrections**: Depends on Phase 11. T101–T104 may proceed by file
  ownership; T105 validates their combined result, and T106 follows successful validation.

### User Story Dependency Graph

```text
Phase 1 Setup
    └── Phase 2 Foundation
          ├── US1 Media ───────────────┐
          ├── US2 Callouts ────────────┤
          ├── US3 Links/Authors ───────┼── Phase 9 Polish
          ├── US4 Status/Emphasis ─────┤
          ├── US5 Sequences ───────────┤
          └── US6 Coherent Theme ──────┘
                ▲          ▲
                └── US1 ───┴── US2
```

### Within Each User Story

- Add the story's contract/accessibility/visual tests first and confirm they fail for the
  reviewed regression.
- Implement shared state or normalization before consumers.
- Implement component/layout markup before dependent integration.
- Apply shared styling before preset-specific refinement.
- Run the story checkpoint without requiring unrelated later stories.

## Parallel Execution Examples

### User Story 1

Run T016–T019 together. After Phase 2, T020–T022 and T024–T025 can proceed concurrently;
T023 follows T022, and T026 follows all US1 work.

### User Story 2

Run T027–T029 together. T030 can proceed while T031 establishes shared CSS. After T031,
run T032–T034 in parallel; T035 follows the full matrix.

### User Story 3

Run T036–T038 together. T042 can proceed independently while the T039 → T040/T041 author
normalization chain is completed; T043 joins both streams.

### User Story 4

Run T044–T046 together. T047, T048, and T051 can proceed concurrently; T049 and T050 are
sequential because both edit `styles/base.css`. T052 follows all status/emphasis work.

### User Story 5

Run T053–T055 together, then complete T056 and validate with T057.

### User Story 6

Run T058–T062 together after their declared fixture dependencies. T065–T067, T072, and T073
can proceed concurrently; after T067, run T068–T070 in parallel. T063 → T064 and T066 → T071
remain sequential file-ownership chains. T074 joins all streams.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and establish deterministic regression inputs.
2. Complete Phase 2 shared infrastructure.
3. Complete US1 through T026.
4. Stop and validate the authored media/closing-logo increment independently.

This is the suggested MVP because it repairs the highest-risk public media contract without
requiring the later visual-system corrections.

### P1 Delivery Wave

1. Deliver US1.
2. Deliver US2 and US3 in parallel where file ownership permits.
3. Re-run all three P1 independent tests before starting P2/P3 integration.

### Incremental Completion

1. Add US4 status/emphasis semantics.
2. Add US5 sequence geometry.
3. Complete US6 integration after US1 and US2.
4. Execute Phase 9 evidence, documentation, baseline approval, and the complete release gate.

## Notes

- Normal quality runs must never rewrite approved baselines.
- T081 requires a named reviewer and requirement-linked rationale.
- Do not add a fixed reviewer-count, user-study, performance-baseline, or benchmark task unless
  the maintainer explicitly requests that outcome.
- No task changes Obsidian parsing/conversion or requires authors to rewrite valid decks.
