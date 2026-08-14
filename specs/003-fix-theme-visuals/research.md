# Phase 0 Research: Fix Theme Visual Semantics

This research resolves the technical choices for all 15 review findings. All technical
questions are resolved.

## 1. Existing Stack and Change Boundary

**Decision**: Keep the existing Node `>=20.19.0`, TypeScript 5.9.3, Vue 3.5.34,
Slidev 52.15.2, Vite 8.0.13, CSS, `node:test`, Playwright Chromium 1.61.1, and
Axe 4.12.1 stack. Add no runtime dependency, parser, visual service, or shipped asset.

**Rationale**: The regressions are in existing component normalization, semantic CSS,
layout geometry, and quality assertions. The current production-build harness already exercises
the published theme, three presets, generated semantic markup, exact pixels, accessibility,
assets, and delayed-media geometry. The theme owns rendering; `obsidian-slidev` continues to
own conversion.

**Alternatives considered**: A component library, a second test runner, Playwright Test, a
snapshot service, and converter changes were rejected because they duplicate existing
capability, add runtime or timing cost, or cross the architecture boundary.

## 2. Canonical Semantic Families

**Decision**: Keep `setup/callouts.ts` as the canonical registry for the 19 callout types and
seven families. Shared CSS owns family tone and non-color marker geometry for component and
generated callouts. Info may follow the resolved accent; positive, caution, danger, question,
quotation, and neutral use shared protected semantic roles.

**Rationale**: `Callout.vue` already emits `data-callout-family`; generated markup can be
matched by its canonical `.obsidian-slidev-callout--TYPE` class. The existing shared stylesheet
already defines the required positive diamond, caution triangle, danger square, question ring,
and quotation bar. The defect is a default-preset rule that overwrites every marker with a
diamond and preset rules that replace family title tone. One shared family carrier prevents
semantic meaning from drifting by preset or local accent.

**Alternatives considered**: Per-preset family mappings and a second Badge-only palette were
rejected because they duplicate behavior. Layering more high-specificity overrides over the
faulty preset rule was rejected in favor of removing the rule that flattens the families.

## 3. Callout Casing and Compact Hierarchy

**Decision**: Preserve the authored/default title string exactly in every preset. Remove
preset-wide callout `text-transform` and artificial tracking. Define compact title scale and
spacing from production density tokens rather than gallery selectors.

**Rationale**: The component can distinguish authored and default titles internally, but raw
generated markup has no reliable title-provenance field. Selectively transforming only
component defaults would make equivalent generated callouts disagree. Preserving all title
casing satisfies the required authored-title behavior, leaves automatic default wording valid,
and preserves acronyms and CJK spacing. A real compact-density rule is needed because the
current compact appearance comes partly from test-gallery CSS that must stop shipping.

**Alternatives considered**: A component-only `data-title-source`, language-specific uppercase
exceptions, and a converter contract change were rejected because they cannot apply
consistently to generated markup.

## 4. Additive Badge Contract

**Decision**: Add optional `tone` and Boolean `marker` props to `Badge`. Normalize tone
case-insensitively to `neutral`, `info`, `positive`, `caution`, `danger`, `question`, or
`quotation`; omitted/unsupported input becomes `neutral`. Marker defaults to `false`.
Expose stable `data-badge-tone` and `data-badge-marker` state, reuse the callout palette, and
render an empty decorative family-shaped marker only when requested.

**Rationale**: The current component has no props and always adds a dot, which duplicates an
authored icon. The seven requested tones exactly match the callout families, so the same
normalizer and CSS roles should serve both. A plain non-focusable `<span>` with visible slot
wording preserves the existing semantic contract.

**Alternatives considered**: A string-valued custom marker was rejected because authors can
already place symbols in the slot and arbitrary symbols weaken predictable family cues.
Retaining the automatic dot was rejected because marker-free is the required corrected default.

## 5. Figure Fit and Geometric Evidence

**Decision**: Preserve the public `Figure.fit` contract (`contain` or `cover`, default
`contain`) and the image/text `backgroundSize` contract (`cover` or `contain`, default
`cover`). Before changing fit plumbing, reproduce the defect with the same portrait and
landscape geometric sources under both values. Make CSS/data-state ownership unambiguous and
prove the painted result with computed fit plus edge/corner geometry or pixel probes.

**Rationale**: `Figure.vue` currently normalizes fit and applies inline `object-fit`; no source
rule was found that conclusively explains why the reviewed contain/cover examples looked the
same. The existing fixture compares different sources and the automated test merely counts
three images, so it cannot prove the public contract. High-contrast local SVGs with known
corner/edge markers can distinguish complete containment from required cover cropping.

**Alternatives considered**: Replacing images with CSS backgrounds or inventing another fit API
was rejected because it weakens native image alternatives and changes a valid public surface.
Assigning a specific CSS root cause without a same-source reproduction was also rejected.

## 6. Generated Image Presentation

**Decision**: Normalize direct generated
`.obsidian-slidev-media--image > img.obsidian-slidev-media__image` figures in the theme
renderer. CSS reserves the default-contained geometry from first paint; an idempotent,
image-only runtime enhancer records pending/ready/failed state and supplies the existing
descriptive fallback on failure. It must ignore Vue-managed Figure viewports and must not
reparent their nodes.

**Rationale**: Generated protocol figures currently use a direct image with natural/max-height
sizing and no reserved viewport or failure state, contradicting feature 002's documented
component/generated equivalence. A renderer enhancement consumes the already generated
semantic classes and therefore keeps conversion responsibility unchanged. CSS-first reservation
prevents the enhancer from causing post-visibility layout shift.

**Alternatives considered**: Requiring converter output changes was rejected by the
rendering/conversion boundary. CSS alone cannot reliably replace a broken image with meaningful
fallback text. Reparenting direct images into new wrappers was rejected because it risks Vue
ownership and observer feedback.

## 7. Closing Logo and Composition States

**Decision**: Add a private `internals/ClosingLogo.vue` treatment that reuses the shared
media alternative/load-state primitive but renders an unframed, transparent, contained logo
with no Figure tray or caption vocabulary. `ClosingLayout` exposes explicit minimal and rich
composition states: minimal centers the message on both axes; rich keeps DOM order
message → contact → authors → logo and uses CSS grid only for visual placement.

**Rationale**: The current closing logo is a complete public `Figure`, so it inherits the
bordered viewport. The current no-logo grid removes a column but leaves a short message aligned
to the left edge of a wide measure. A logo is brand attribution rather than a captioned content
figure, while the canonical `end` closing inputs remain unchanged.

**Alternatives considered**: A public `Figure variant="logo"` was rejected as unnecessary API
growth. Duplicating alt/error logic inside `ClosingLayout` was rejected because the state
machines would drift. Retaining a second closing-layout name was rejected after the maintainer
confirmed the package is pre-1.0.

## 8. Author Fallbacks and Link Decoration

**Decision**: Normalize each author into a primary label/source/action plus distinct secondary
institution and email values. Trim values, deduplicate exact normalized values only within a
record, preserve record order and intentional duplicate records, and preserve the existing
no-name precedence of email before institution. A valid email used as the primary label is the
single actionable rendering. For every anchor, use one persistent text underline, explicitly
reset inherited `border-bottom`, and retain the focus-visible outline.

**Rationale**: Current normalization copies an institution- or email-derived fallback into
`name` while retaining the same secondary field, so `Authors.vue` renders it twice. Email-only
records make the duplicated secondary actionable but leave the primary plain. Keeping
normalization shared also fixes cover, footer, Authors, and closing consumers consistently.
Link duplication has two concrete sources: Slidev's imported base layout adds a dashed bottom
border and the theme adds a text underline; generated links then add another border rule.
Text decoration follows wrapped glyphs and does not become a full-card rule.

**Alternatives considered**: Ad hoc suppression only in `Authors.vue` was rejected because
other author consumers would disagree. Case-folded value deduplication was rejected as
undocumented. Keeping a border instead of text decoration was rejected because block and
wrapped anchors can show container-width decoration.

## 9. Task Emphasis and Prose Highlights

**Decision**: Give task items an explicit primary baseline; checked items retain the filled box
and checkmark but use normal/inherited weight and a readable muted text role. Nested unchecked
items reset to primary text. Prose highlights use a preset-independent warm flat wash with no
border, radius, inset edge, or shadow; retain `box-decoration-break: clone` and the current
`pre`/`code` reset.

**Rationale**: The current checked class explicitly makes completed work heavier. Its existing
box and checkmark already provide the required non-color state, so no markup change is needed.
Opacity or whole-item line-through would also mute nested unfinished tasks. Current highlights
combine a border, rounded corners, and inset shadow, making them resemble inline code or Kbd.
Warm highlight tokens keep them distinct from accent-tinted code and raised keycaps in both
modes.

**Alternatives considered**: Opacity, whole-item line-through, wrapping task label DOM, and
preset-colored highlights were rejected because they harm nested state, contrast, or visual
distinction.

## 10. Steps and Timeline Geometry

**Decision**: Retain the authored `<ol>` as semantic authority but split visual geometry.
Steps hide the native visual marker and render `counter(list-item)` inside numbered nodes.
Timeline hides ordinals, renders unnumbered event nodes, and removes the per-card left bar.
Both use shared node-size/rail tokens and adjacent-item connector segments that run
center-to-center only on `li:not(:last-child)`. A leading `<time>` and documented leading
`<strong>` label receive equivalent container geometry.

**Rationale**: The current connector uses a hard-coded offset unrelated to marker geometry.
Timeline inherits the ordinary ordinal and connector and adds a second left border to every
item. Adjacent segments terminate correctly for variable-height items and automatically vanish
for zero/one-item cases. `counter(list-item)` respects authored list numbering better than an
independent counter.

**Alternatives considered**: Parsing slot VNodes, adding public Step/TimelineLabel components,
and a single full-height `<ol>::before` rail were rejected as unnecessary or unreliable at the
last variable-height item.

## 11. Chrome Accent and Section Brand Regions

**Decision**: Introduce a frame-local `--presentation-chrome-accent`, based on the existing 34%
accent mix, and consume it for header/footer dividers, table-header rules, ordinary list
markers, and the ICT footer cap. Presets may set the role token but may not hard-code different
strengths for each consumer. Ordinary content slides render no UCAS/ICT mark. Cover branding
uses cover-owned structure; section dividers reserve inline-end space for their lockup, shrink it
at the compact viewport, and omit it when a forced header owns the top row.

**Rationale**: Current structural strengths range from a 34% mix to opaque accent and brand
rules. One local role keeps chrome secondary and prevents simultaneously mounted preset slides
from contaminating one another. Restricting floating identity to ceremonial pages gives section
content a measurable lockup boundary without imposing unused padding on every content or
statement slide. Header-aware rendering also avoids downloading or stacking a lockup that cannot
safely occupy the top row.

**Alternatives considered**: Repeating percentages in each preset, reusing the stronger callout
carrier, a shared block-start token for marks that no longer exist, and full-height statement
padding were rejected because they preserve drift or reserve space without a rendered consumer.

## 12. Bilingual Heading Separator

**Decision**: Add an idempotent presentation normalizer for canonical spaced U+00B7 in headings
and frame title/subtitle text. Replace only the breaking space immediately before `·` with a
non-breaking space so the separator stays with the preceding token. Run it through the shared
initial/addition normalization path rather than another document-wide observer.

**Rationale**: `text-wrap: balance` cannot prevent a break at the authored ASCII space in
`English · 中文`, and CSS cannot bind a text character without markup. Repository heading
evidence consistently uses U+00B7. Binding one side prevents an orphan separator while leaving
the following phrase breakable; accessible/copied wording remains equivalent after normal
whitespace normalization.

**Alternatives considered**: Requiring author spans or NBSPs, binding both sides, and changing
the converter were rejected because they require deck rewrites, can create an oversized
unbreakable phrase, or move presentation logic into conversion.

## 13. Fixture Isolation

**Decision**: Move `.presentation-callout-gallery`, `.presentation-figure-gallery`,
`.presentation-accent-probe`, and `.presentation-label-gallery` rules into
`fixtures/expanded-content.css`. Replace production layout selectors that depend on
`[data-quality-case]` with a real semantic/internal wrapper class. Add a static source gate
forbidding `data-quality-*`, gallery, and probe selectors from packaged component, layout,
setup, and style paths.

**Rationale**: `package.json.files` ships components, internals, layouts, setup, and styles but
not fixtures or tests. Current gallery/probe CSS therefore influences production, and code
layout sizing literally depends on a test marker. A fixture-local stylesheet preserves the
review composition without enlarging the public visual language.

**Alternatives considered**: Keeping the selectors with explanatory comments and creating a
new three-preset fixture family were rejected because production would still depend on tests
and a duplicate fixture family would add maintenance and diagnostic noise without new coverage.

## 14. Viewport and Regression Matrix

**Decision**: Keep exhaustive affected semantic checks at 980 × 552 logical pixels, DPR 2,
across `default`, `ucas`, and `ict` in light/dark mode. Define 720 × 405, DPR 2, as the
maintained compact viewport and run a targeted matrix for compact callouts, closing/logo
balance, top-right brand collisions, bilingual heading wrapping, media, and sequences. Reuse
and extend `fixtures/expanded-content.md` and `fixtures/obsidian-protocol.md`.

**Rationale**: All existing browser tests use only 980 × 552 even though shared/default CSS
breaks at 720 px and UCAS/ICT rules break at 760 px. A 720 × 405 viewport remains 16:9 and
exercises both responsive systems. Duplicating all 160 exact screenshots would add little
semantic evidence and risk the aggregate deadline, so compact coverage should be geometric,
overflow/Axe, and representative visual review.

**Alternatives considered**: 768 × 432 misses both relevant breakpoints; 640 × 360 approaches
the out-of-scope mobile redesign. A second complete screenshot suite and a new three-build deck
were rejected for runtime cost.

## 15. Quality Assertions and Baseline Governance

**Decision**: Strengthen existing browser loops before changing approved screenshots:

- 114 callout cases verify exact family shape, title/marker family tone, preserved title text,
  contrast, and generated class fallbacks.
- 42 Badge tone cases verify normalization/palette plus marker-on, marker-off, authored-icon,
  invalid, and neutral-default states.
- Media cases use the same portrait/landscape source under both fits and inspect visible
  extents; generated/component defaults and delayed success/failure are compared.
- Link cases verify underline, zero persistent border, glyph-bounded wrapping, and focus.
- Author cases count each distinct per-card value and valid email action exactly once.
- Steps/Timeline cases verify node centers, connector endpoints, one rail, hidden ordinals, and
  dated/undated alignment.
- Task/highlight tests reverse the assertions that currently require heavier checked text and a
  highlight border.

Only after these gates pass may
`quality:update-visual-baselines -- --reviewer ... --rationale ...` replace references known to
encode the defects.

**Rationale**: Current tests often prove only existence: Figure geometry counts images,
callouts require any marker, sequences require any connector, links require any underline, and
the Badge/task/highlight tests explicitly encode incorrect behavior. Exact pixels remain useful
evidence but cannot decide whether the old result was semantically correct.

**Alternatives considered**: Blindly accepting changed snapshots and relying on Axe or pixels
alone were rejected because neither can validate semantic family geometry, relative emphasis,
duplicate values, or source-order meaning.

## 16. Projection Stability Without Performance Baselines

**Decision**: Keep blocking ready/failed geometry and target-attributed layout-shift checks for
public and generated media. Remove build-output, bundle-size, navigation-timing, p95, raw-sample,
and performance-baseline update machinery.

**Rationale**: The maintainer explicitly does not require build performance. The committed raw
samples exceeded 100,000 lines while normal quality used them only for immutability checks.
Deterministic before/after geometry and layout-shift observation directly test the product risk
without retaining noisy machine-dependent benchmarks.

**Alternatives considered**: Keeping non-blocking historical baselines was rejected because it
preserves substantial code and repository weight without affecting acceptance. Removing all
stability checks was rejected because delayed media can still visibly move authored content.

## 17. Documentation and Review Evidence

**Decision**: Update `README.md` as the user-facing authority and retain one
`qa/fix-theme-visuals/visual-review.md` record. Do not create a fixed external reviewer cohort
or a separate first-pass survey gate.

**Rationale**: Existing documentation already owns components, layouts, generated markup,
tokens, and validation commands. Automated semantic, accessibility, exact-pixel, asset,
build, and layout-stability evidence is sufficient for this implementation. The maintainer
confirmed that a ten-reviewer task does not match the project.

**Alternatives considered**: A separate documentation site and a mandatory external survey
were rejected because they add maintenance and coordination without a user-requested outcome.

## Resolved Clarifications

- Compact viewport: 720 × 405 logical pixels at DPR 2.
- Figure root cause: not presumed; reproduce with same-source geometry before correction.
- Generated images: renderer enhancement over existing semantic markup, no converter change.
- Author fallback precedence: preserve email before institution when name is absent.
- Callout automatic-title casing: preserve source casing for component/generated consistency.
- Badge marker: Boolean, off by default; authored symbols remain slot content.
- Timeline undated labels: use the documented leading `<strong>` pattern, with plain prose
  remaining readable but undecorated.
- Agent context: no updater or generated context exists, so the Phase 1 context step is N/A.

## 18. Follow-up Review Decisions (2026-07-26)

**Badge Boolean input**: Reuse the canonical Boolean normalizer for native values and trimmed
`true`, `false`, `on`, and `off` strings. Vue truthiness is not the public contract.

**Frame chrome**: Delete computed-style probing, inline custom-property freezing, and the
dark-mode recomputation watcher. Native CSS custom-property and `color-mix()` resolution remains
live when mode or local accent changes.

**Configuration registry**: Keep `PRESENTATION_OPTIONS`, remove unused `scope` metadata, and
make both deck and slide resolution read each option's declared deck key, slide keys,
normalizer, and default. A test-only metadata table is not an acceptable source of truth.

**Package and fonts**: Classify `@slidev/types` and the example-only `slidev-pane` addon as
development dependencies, pin the addon instead of using `latest`, and include only
`public/obsidian-card.svg` from public assets in the package. Remove the stylesheet-level Google
Fonts import. Slidev's declared Latin webfonts, local Noto CJK families, and system fallbacks are
documented separately.

**Image layout compatibility**: Preserve safe, non-empty CSS `backgroundSize` strings in the
image/text layout. `contain` and `cover` continue to use native object-fit; other values use a
stable background-sized visual backed by the same native image load, alternative, caption, and
failure state. Invalid CSS still falls back in the browser to `cover`.

**Dead code and internal ownership**: Remove unused observer/registration exports, author
migration aliases/formatters, unused root presentation attributes, dead header-mark CSS, and
duplicate selector entries. Move preset-only branding out of auto-registered public components.

**Tokens and selectors**: Remove the conflicting root fallback palette while keeping shared
structural and semantic tokens. The root Slidev control accent may use the academic default
primary, while slide palettes remain owned by presets. Restore ICT's serif token to a serif
stack. A complete cascade-layer/specificity rewrite is deferred because it can alter every
approved pixel and deserves a separately scoped architecture review.

**DOM normalization disclosure**: Retain the narrowly scoped U+00B7 heading normalizer because
CSS cannot bind an authored text separator without markup. Reduce unnecessary mutation
subtree scans and document that the rendered DOM/copy text contains U+00A0 before the separator.

**Typed and static drift guards**: Read TOC slides from Slidev's typed `#slidev/slides` virtual
module, keep visible Kbd separators as `+` while exposing the spoken word “plus” to assistive
technology, and compare generated callout CSS modifier groups with
`CALLOUT_SEMANTIC_FAMILIES` in a static test.

**Performance scope**: Build/output/navigation performance is not a project requirement.
Layout-shift correctness and shipped-asset review remain blocking.

**Deferred**: Do not rename the published package or public CSS namespaces in this patch.

## 19. Pre-1.0 Simplification Decisions (2026-07-26)

**Compatibility policy**: The package has no 1.0 compatibility promise. Keep a canonical
replacement and concise migration note, but remove unused aliases and duplicate public inputs.
`end` is the only closing layout; quote attribution uses `author`; Figure sizing uses `fit`.
The Obsidian callout type `cite` remains canonical and is unrelated to quote-layout metadata.

**Task scope**: Match only checkboxes inside `.task-list-item`, `.contains-task-list`, or
`.obsidian-slidev-task-list` task contexts. A generic `li > input[type="checkbox"]` selector is
unsafe because a slide may intentionally demonstrate an interactive HTML form.

**Shared component primitives**: A small `useMediaLoadState` composable owns source,
alternative, pending/ready/failed state, and fallback visibility for Figure and ClosingLogo.
`Authors` accepts a rendering variant used by cover so one normalized record loop owns primary,
institution, and email output. These are concrete shared consumers, not speculative
abstractions.

**Frame state**: The document root owns only `--slidev-theme-primary` for Slidev UI. Each
rendered `.slide-frame` owns its resolved presentation accent. Density stays on the canvas/frame
data attributes that CSS consumes. Cover/section brand spacing remains CSS-owned; no brand-safe
custom property or `data-presentation-brand-safe-zone` state is retained.

**Generated callouts**: The existing subtree normalizer resolves a supported `data-callout` or
canonical modifier class through `setup/callouts.ts`, then writes canonical `data-callout` and
`data-callout-family`. CSS consumes the family attribute only. This removes the parallel CSS
type map while preserving the converter boundary.

**Style ownership**: Import `components.css` and `content-layouts.css` once from
`styles/index.ts`; remove unscoped `<style src>` declarations from individual Vue files.
Delete object-fit rules already expressed by `--presentation-media-fit`, and collapse only
visual default-preset selector twins. Dual canvas/frame token declarations remain because they
isolate simultaneously mounted slides.

**Brand markup**: Render the ICT section lockup/watermark only on section dividers. Render the
UCAS rail/watermark on covers and its white wordmark/watermark on section dividers. Omit section
lockups when a forced header owns the top row, and do not emit alternate theme assets that remain
hidden on the mode-independent ceremonial field. Hidden image nodes add decode/DOM work and
conflict with the content-first visual direction.

**Repository policy**: `package.json.files` is the publication allowlist, so `.npmignore` is a
second policy track and is removed. Test geometry/logo assets have one home under
`fixtures/public/author-fixtures`. The CSS architecture check uses direct source invariants; it
does not approximate nested CSS parsing or pin unrelated development dependency versions.

**Retained duplication**: `Steps` and `Timeline` remain separate eight-line public wrappers.
They expose different ordered-procedure and chronology semantics while sharing all actual CSS.
Merging them would replace obvious semantic names with a configuration prop and would not
reduce meaningful implementation.
