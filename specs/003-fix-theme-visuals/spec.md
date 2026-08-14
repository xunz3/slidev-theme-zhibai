# Feature Specification: Fix Theme Visual Semantics

**Feature Branch**: Not created (no branch hook configured)

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "Correct the visual and semantic regressions found in the design
review of Expanded Theme Content, including media fit, callout family cues, link decoration,
author fallbacks, task emphasis, badge tones, sequence geometry, highlights, preset casing,
closing-page balance, chrome consistency, media consistency, fixture isolation, and
preset-specific collisions. Follow-up review also requires honest Boolean component inputs,
built-in-compatible image-layout sizing, lean runtime/package ownership, coherent offline font
behavior, and removal of unused implementation paths. The maintainer has now confirmed that
the package is pre-1.0: unused aliases and compatibility-only inputs may be removed in favor of
one canonical, simple API. Build duration, output growth, and navigation timing are diagnostic
observations rather than feature acceptance criteria, so raw performance baselines and their
update workflow should be removed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Render Media as Authored (Priority: P1)

As a deck author, I can choose whether a figure is fully visible or fills its available media
region, and the result is visibly correct wherever the theme presents that image.

**Why this priority**: The current fit choices can produce identical, incorrectly cropped
results. This directly contradicts the public media contract and affects figures, image-and-text
layouts, and closing logos.

**Independent Test**: Present deliberately tall and wide geometric images with both supported
fit choices in a standalone figure and both image-and-text orientations, then present a
transparent closing logo. Verify the visible geometry in every preset and supported mode.

**Acceptance Scenarios**:

1. **Given** a tall image and a bounded media region, **When** an author selects `contain`,
   **Then** the complete image is visible, its aspect ratio is preserved, and unused space may
   remain around it.
2. **Given** a wide image and a bounded media region, **When** an author selects `cover`,
   **Then** the region is completely filled, the image aspect ratio is preserved, and only the
   overflow needed to fill the region is cropped.
3. **Given** the same non-matching image and region, **When** `contain` and `cover` are compared,
   **Then** they produce observably different visible extents.
4. **Given** a transparent logo on a closing slide, **When** the slide is displayed, **Then**
   the complete logo remains visible without a media tray, unintended crop, or layout shift.

---

### User Story 2 - Preserve Callout Meaning Across Presets (Priority: P1)

As a presenter, I can rely on callout wording, shape, and family tone to communicate meaning
consistently, even when a preset changes typography and brand expression.

**Why this priority**: The most commonly used preset currently flattens distinct callout
families into one marker shape, while other presets invert or weaken family emphasis. This
breaks the non-color semantic contract.

**Independent Test**: Present all 19 supported callout types plus the neutral fallback in each
preset and supported mode. Compare family marker, title tone, authored-title casing, and
compact-density hierarchy.

**Acceptance Scenarios**:

1. **Given** callouts from the positive, caution, danger, question, and quotation families,
   **When** any preset is selected, **Then** each retains its established non-color family cue
   instead of being flattened into one preset-wide shape.
2. **Given** a typed callout, **When** it is displayed in any preset, **Then** its title and
   marker use the callout's family tone and remain at least as semantically prominent as a
   neutral callout.
3. **Given** an author-supplied mixed-case or bilingual title, **When** a preset uses display
   casing for automatic labels, **Then** the authored title's casing and CJK spacing remain
   unchanged.
4. **Given** an automatically supplied default title, **When** a preset applies its established
   label typography, **Then** that presentation remains allowed without altering authored
   titles.

---

### User Story 3 - Read Links and Author Details Once (Priority: P1)

As an audience member, I see a single clear link treatment and each author detail exactly once,
without full-card rules or repeated fallback values.

**Why this priority**: Duplicate link decorations and duplicate author metadata create visible
errors on ordinary content, author cards, and closing slides.

**Independent Test**: Present inline, block-level, card, and closing-contact links plus complete,
name-only, institution-only, email-only, and invalid-email author records in every preset and
supported mode.

**Acceptance Scenarios**:

1. **Given** any text link, **When** it is displayed, **Then** it has exactly one visible
   underline treatment bounded to the linked text rather than the width of its container.
2. **Given** an institution-only author record, **When** it is normalized and displayed,
   **Then** the institution appears once as the card's primary label and no duplicate secondary
   institution line is shown.
3. **Given** an email-only author record, **When** it is normalized and displayed, **Then** the
   address appears once and remains actionable when it is valid.
4. **Given** a complete author record, **When** it is displayed, **Then** each distinct
   non-empty name, institution, and email value appears once in declared order.

---

### User Story 4 - Scan Status and Emphasis Correctly (Priority: P2)

As a presenter or audience member, I can quickly distinguish unfinished work, completed work,
status badges, prose highlights, inline code, and keyboard input without competing or duplicate
visual cues.

**Why this priority**: The current checked-task weight emphasizes completed work, badges do not
express status families and always add a dot, and prose highlights resemble code or keycaps.
These choices reverse or blur everyday reading conventions.

**Independent Test**: Present mixed task states, all badge tones with and without their optional
marker, badges containing an authored icon, highlights beside inline code, and keyboard input
in every preset and supported mode.

**Acceptance Scenarios**:

1. **Given** checked and unchecked tasks in one list, **When** the list is displayed, **Then**
   unfinished tasks retain primary emphasis while completed tasks are visibly de-emphasized and
   still expose an unmistakable checked state.
2. **Given** badges with different semantic tones, **When** they are displayed together,
   **Then** tone, visible wording, and optional non-color cues communicate distinct states
   without relying on hue alone.
3. **Given** a badge whose content already includes an icon, **When** the optional badge marker
   is not requested, **Then** no automatic dot is added.
4. **Given** highlighted prose next to inline code and keyboard input, **When** it is displayed,
   **Then** the highlight reads as a flat luminous wash rather than a bordered, inset, or raised
   control.

---

### User Story 5 - Follow Steps and Timelines Clearly (Priority: P3)

As an audience member, I can distinguish an ordered procedure from a chronology at a glance,
and their connectors align cleanly with their markers and labels.

**Why this priority**: Steps and timelines currently share decoration that does not suit both
meanings, producing misaligned numbering, doubled rails, and inconsistent date labels.

**Independent Test**: Present zero-, one-, and multi-item Steps and Timeline examples, including
dated, undated, long, wrapped, and bilingual entries, in every preset and supported mode.

**Acceptance Scenarios**:

1. **Given** a multi-item Steps sequence, **When** it is displayed, **Then** numbered nodes sit
   on the sequence path and the path passes through the center of the nodes.
2. **Given** a multi-item Timeline, **When** it is displayed, **Then** list ordinals are hidden
   visually and one clean rail with chronological nodes replaces the combination of an outer
   rail and card-edge bars.
3. **Given** dated and undated timeline entries, **When** they appear together, **Then** their
   label regions share one shape, baseline, and left edge.
4. **Given** sequence decoration is unavailable, **When** the content is read linearly, **Then**
   authored order and meaning remain intact.

---

### User Story 6 - Present a Coherent, Collision-Free Theme (Priority: P3)

As a deck author, I receive balanced closing pages, consistent secondary accent chrome, safe
brand placement, resilient bilingual headings, and one media vocabulary without author
workarounds.

**Why this priority**: These details do not block authoring, but together they determine whether
the expanded theme feels intentional and whether preset-specific decoration can safely coexist
with user content.

**Independent Test**: Review minimal and content-rich closing slides, generated and
component-authored media, accent-aware chrome, compact callout groups, top-right content in the
ICT preset, and wrapping bilingual headings across all presets and supported modes.

**Acceptance Scenarios**:

1. **Given** a closing slide containing only a short message, **When** it is displayed, **Then**
   the message is horizontally and vertically centered by default.
2. **Given** a slide with top-right user content, **When** preset brand decoration is present,
   **Then** the decoration and content occupy separate safe regions with no overlap.
3. **Given** a bilingual heading containing a centered separator, **When** it wraps, **Then**
   the separator does not begin a new line by itself.
4. **Given** generated media and an equivalent public Figure, **When** both use their default
   presentation, **Then** they share the same containment, sizing, failure, caption, and
   projection vocabulary.
5. **Given** a normal production deck, **When** the theme is loaded, **Then** test-gallery and
   quality-probe helpers do not influence its layout or shipped visual language.

---

### User Story 7 - Keep Public Contracts Honest and Lean (Priority: P2)

As a deck author or theme maintainer, I can trust documented component, layout, font, package,
and configuration behavior without hidden coercion, unnecessary runtime work, or dead
implementation paths.

**Why this priority**: Follow-up review found cases where documented inputs did not match Vue
coercion, built-in-compatible layout values were narrowed silently, package contents omitted a
documented asset, and implementation metadata could drift from the resolver it described.

**Independent Test**: Exercise native and textual Badge marker values, a custom valid
`backgroundSize`, offline font loading, package dry-run contents, option-definition-driven
resolution, generated callout family mappings, and the maintained TOC/Kbd surfaces.

**Acceptance Scenarios**:

1. **Given** `marker="false"` or `marker="off"`, **When** Badge renders, **Then** no generated
   marker appears; native/textual true values produce exactly one marker.
2. **Given** an image-left or image-right layout with a valid CSS `backgroundSize` such as
   `80%`, **When** it renders, **Then** that authored size is preserved rather than silently
   becoming `cover`.
3. **Given** the package is inspected with a dry run, **When** shipped contents and dependency
   classes are reviewed, **Then** the documented Obsidian card asset is included and
   example/build-only packages are not runtime dependencies.
4. **Given** the presentation option registry changes, **When** deck or slide configuration is
   resolved, **Then** the resolver consumes that same registry rather than a parallel
   hand-written mapping.
5. **Given** a deck is rendered without network access, **When** typography initializes,
   **Then** no theme stylesheet directly imports a remote font and documented local/system
   fallbacks remain usable.

---

### User Story 8 - Keep the Pre-1.0 Theme Small and Calm (Priority: P2)

As a deck author or maintainer, I get one canonical route for each presentation concept, and
ordinary authored controls are not altered by theme normalization.

**Why this priority**: The project has not released 1.0, so retaining unused aliases, parallel
state machines, dead DOM state, hidden branding nodes, and duplicated global CSS creates more
risk than a small migration note. The visual direction is intentionally simple, calm, and
low-ornament.

**Independent Test**: Render Markdown tasks beside an ordinary HTML checkbox; build a deck with
the canonical closing, quote, Figure, and Authors surfaces; inspect generated callout state,
loaded styles, preset branding, package contents, and source invariants.

**Acceptance Scenarios**:

1. **Given** an ordinary interactive checkbox inside slide content, **When** rendering
   normalization runs, **Then** the checkbox remains enabled, visible, pointer-operable, and in
   the normal tab order.
2. **Given** a new deck using closing, quote attribution, and Figure fit, **When** it builds,
   **Then** one canonical `end`, `author`, and `fit` surface is sufficient; compatibility-only
   `thanks`, quote `cite`, and Figure `backgroundSize` inputs are absent.
3. **Given** public components and private content layouts, **When** the theme loads, **Then**
   global component/layout styles are imported once through the theme stylesheet entry rather
   than repeated by individual Vue files.
4. **Given** canonical generated callout markup, **When** normalization runs, **Then** its type
   and family data attributes are resolved from the TypeScript registry and CSS consumes only
   those attributes.
5. **Given** a preset/variant whose watermark is not visible, **When** the frame renders,
   **Then** no hidden watermark image is added to the DOM.

### Edge Cases

- A portrait or landscape image has an extreme aspect ratio, transparency, an unavailable
  source, a missing caption, a decorative alternative, or a source that finishes decoding
  after the slide becomes visible.
- A bounded region is smaller than the image in both dimensions or matches the image's aspect
  ratio exactly.
- A closing logo is monochrome, transparent, unusually tall or wide, missing, or displayed
  alongside contact details and the maximum supported author-card count.
- A callout uses any of the 19 supported types, the neutral fallback, an empty or unsupported
  type, a long authored title, mixed case, acronyms, CJK, or a title that wraps.
- A callout appears in a compact comparison fixture or on a low-intensity slide accent.
- A link is inline, block-level, nested in a card, a valid email, a non-actionable email string,
  keyboard-focused, wrapped across lines, or adjacent to punctuation.
- Author fields differ only by surrounding whitespace, or the fallback primary label equals an
  institution or email field after normalization.
- A badge uses the default tone, every supported semantic tone, no marker, an explicit marker,
  native or textual true/false/on/off marker input, an authored icon, long text, symbols, or
  bilingual content.
- Task lists are nested, wrap across lines, mix checked and unchecked items, or appear on
  accent-aware surfaces.
- Highlighted text wraps across lines or appears beside links, emphasis, inline code, code
  blocks, or keyboard input.
- Steps and timelines contain zero, one, two, or many items; labels vary greatly in length; or
  only some timeline entries contain a date.
- A heading wraps immediately before or after the bilingual separator.
- Header, footer, table, and list chrome appears with a very weak or very strong local accent.
- Preset decoration competes with top-right figures, captions, headings, or controls at the
  canonical viewport and the maintained compact viewport.
- An image/text layout receives a valid non-keyword CSS background size, an invalid value, or a
  value containing surrounding whitespace.
- The theme is packed for npm or rendered without access to remote font stylesheets.
- A slide contains an interactive HTML form control inside a normal list item, beside a real
  Markdown or generated task list.
- A generated callout supplies a supported `data-callout`, a supported modifier class, mixed
  case, an unsupported value, or no type.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A Figure using `contain` MUST show the entire image inside its bounded region,
  preserve aspect ratio, and avoid unintended cropping.
- **FR-002**: A Figure using `cover` MUST fill its bounded region, preserve aspect ratio, and
  crop only the overflow required to fill that region.
- **FR-003**: `contain` and `cover` MUST produce different visible extents whenever source and
  region aspect ratios differ.
- **FR-004**: The Figure component, generated image figures, and `image-left` and `image-right`
  layouts MUST share one default containment, sizing, caption, failure, and reserved-space
  vocabulary; explicit author fit choices MUST remain honored where supported.
- **FR-005**: Closing logos MUST use a dedicated, undecorated contained-logo treatment that
  preserves transparent artwork, exposes meaningful fallback text, and does not inherit a
  figure tray or caption region.
- **FR-006**: Every visible text link MUST have exactly one underline treatment, limited to its
  rendered text, while preserving visible keyboard focus and actionable email behavior.
- **FR-007**: Author normalization and display MUST show each distinct non-empty authored value
  at most once per card; a primary label derived from institution or email MUST suppress an
  identical secondary line, and an email used as the primary label MUST remain actionable when
  valid.
- **FR-008**: All 19 supported callout types and the neutral fallback MUST resolve to the
  established semantic family in every preset and mode.
- **FR-009**: Positive, caution, danger, question, and quotation callouts MUST retain their
  established non-color family marker in every preset; preset-specific decoration MUST NOT
  flatten these families into one marker shape. Info and neutral callouts MAY use a
  preset-native neutral marker.
- **FR-010**: A typed callout's title and marker MUST use its family tone in every preset, meet
  readable contrast, and MUST NOT receive less semantic emphasis than a neutral callout.
- **FR-011**: Presets MAY vary callout typography but MUST preserve author-supplied title casing,
  acronyms, and normal CJK spacing; casing transformations MAY apply only to automatically
  supplied default titles.
- **FR-012**: Compact callout presentations MUST preserve title-to-body hierarchy without making
  the title compete with the slide heading or dominate the callout body.
- **FR-013**: Completed tasks MUST be visually de-emphasized relative to unfinished tasks, MUST
  NOT use a heavier text weight than unfinished tasks, and MUST retain a non-color checked cue.
- **FR-014**: Badge MUST support `neutral`, `info`, `positive`, `caution`, `danger`, `question`,
  and `quotation` tones aligned with the callout family palette; omitted or unsupported tone
  values MUST resolve to `neutral`.
- **FR-015**: Badge's leading marker MUST be optional and off by default; requesting it MUST add
  one non-interactive marker without obscuring or duplicating authored content.
- **FR-016**: Badge tone MUST supplement, not replace, visible status wording, and every badge
  MUST remain distinguishable from Tag, inline code, and keyboard input without depending on
  hue alone.
- **FR-017**: Prose highlights MUST use a flat, luminous wash with no control-like border,
  inset edge, or raised keycap treatment, and MUST remain visibly distinct from inline code,
  links, and keyboard input.
- **FR-018**: Highlight treatment MUST wrap cleanly across lines and MUST NOT alter content
  inside code blocks or inline code.
- **FR-019**: Steps MUST present ordered numbers as nodes centered on a single sequence path;
  connectors MUST occur only between adjacent items and MUST NOT extend beyond the first or last
  node.
- **FR-020**: Timeline MUST suppress visual list ordinals and present one chronological rail
  with aligned event nodes, without a second rail or repeated card-edge bar.
- **FR-021**: Dated and undated Timeline entries MUST use an equivalent label container,
  baseline, and left edge, while preserving any authored date semantics.
- **FR-022**: Steps and Timeline MUST preserve authored source order and readable list semantics,
  and zero- or one-item collections MUST produce no orphan connector.
- **FR-023**: A closing layout containing only a short primary message MUST center that message
  horizontally and vertically by default; adding contact, author, or logo regions MUST produce
  a balanced composition without changing logical reading order.
- **FR-024**: Header and footer dividers, table-header rules, and list markers MUST use one
  documented secondary chrome-accent strength within a preset and mode; semantic callout
  carriers MAY remain stronger.
- **FR-025**: Preset brand marks and chrome MUST reserve sufficient safe space so they do not
  overlap user headings, figures, captions, links, or controls at maintained review viewports.
- **FR-026**: Bilingual heading separators MUST stay with adjacent heading content or otherwise
  avoid appearing alone at the start of a wrapped line.
- **FR-027**: Test-only galleries, probes, labels, and quality markers MUST be isolated from
  distributed theme behavior, and production layout MUST NOT depend on a test-only marker.
- **FR-028**: Regression coverage MUST include geometric media fixtures, all callout families in
  all presets and supported modes, link forms, author fallback forms, badge tones and marker
  states, tasks, highlights, Steps, Timeline, closing variants, section brand regions, and bilingual
  wrapping.
- **FR-029**: Previously accepted visual snapshots that encode incorrect behavior MUST be
  replaced only after the corrected result passes the corresponding semantic and geometric
  acceptance scenarios.
- **FR-030**: User documentation MUST describe corrected media fit behavior, single-link
  decoration, author fallback display, callout invariants, badge tone and marker options,
  sequence distinctions, highlight language, closing defaults, and expected intentional visual
  changes.
- **FR-031**: The feature MUST preserve existing callout types, component and layout names,
  ordinary Markdown support, generated Obsidian semantic content, and current configuration
  precedence; Badge tone and marker inputs MUST be additive.
- **FR-032**: The theme MUST NOT change Obsidian conversion responsibilities or require authors
  to rewrite existing decks to receive the corrected defaults.
- **FR-033**: Badge marker input MUST accept native booleans and the trimmed textual values
  `true`, `false`, `on`, and `off`; invalid values MUST resolve to the marker-free default.
- **FR-034**: Frame chrome colors MUST remain live CSS values. The theme MUST NOT freeze
  computed custom-property colors into inline styles or install a color-scheme watcher solely
  to recompute values that CSS already resolves.
- **FR-035**: The presentation option definition registry MUST drive deck and slide resolution,
  including option keys, precedence keys, normalizers, and defaults; unused option metadata
  MUST NOT be retained.
- **FR-036**: `image-left` and `image-right` MUST preserve valid CSS `backgroundSize` values,
  including length and percentage forms, while retaining `cover` as the invalid/omitted
  fallback and preserving meaningful image alternatives and failure behavior.
- **FR-037**: Theme stylesheets MUST NOT directly import remote font stylesheets. Documented
  webfont, local CJK, and system fallback responsibilities MUST agree with package metadata and
  remain intelligible offline.
- **FR-038**: The published package MUST include every asset described as bundled. Dependencies
  used only by examples, builds, or type/setup authoring MUST be classified as development
  dependencies and use a reproducible version range.
- **FR-039**: Production source MUST remove unused exported observers, registry hooks,
  migration aliases, formatter helpers, root state attributes, and CSS selectors when no
  shipped or documented consumer exists.
- **FR-040**: The default slide palette MUST have one preset-owned source of truth and MUST NOT
  leak a conflicting fallback accent into Slidev controls. Semantic font tokens MUST retain
  their named meaning; in particular, a serif token MUST resolve to a serif stack.
- **FR-041**: Runtime bilingual heading normalization MUST be documented as a DOM text
  normalization that replaces only the space before canonical spaced U+00B7 with U+00A0,
  including its copy/paste implication and dynamic-render scope.
- **FR-042**: Generated callout CSS type selectors MUST be checked against the canonical
  TypeScript type-to-family registry, maintained TOC navigation MUST use typed public slide
  data, and Kbd MUST expose a spoken separator instead of punctuation-only accessible text.
- **FR-043**: Task normalization MUST target only recognized Markdown/generated task-list
  contexts. It MUST NOT disable, hide, remove from the tab order, or restyle an ordinary
  interactive checkbox merely because it is inside a slide list item.
- **FR-044**: The pre-1.0 public layout surface MUST use `end` as the single closing layout.
  The unused `thanks` alias MUST be removed, and maintained fixtures/documentation MUST use
  `end`.
- **FR-045**: Quote attribution MUST use `author`; the duplicate quote-layout `cite` input MUST
  be removed. `cite` remains a canonical Obsidian callout type and is unaffected.
- **FR-046**: Figure sizing MUST use the typed `fit` input only. The undocumented duplicate
  Figure `backgroundSize` path MUST be removed; image/text layouts retain their documented
  `backgroundSize` contract.
- **FR-047**: Figure and private closing-logo rendering MUST share one reactive media-load
  state primitive, and cover author presentation MUST reuse the canonical Authors renderer
  rather than maintain a parallel author model and markup path.
- **FR-048**: Root runtime state MUST contain only state consumed outside a rendered frame.
  Deck density, frame presentation accent, and brand-safe-zone data attributes MUST NOT be
  written to the root/frame when CSS or frame-local state already owns the behavior.
- **FR-049**: Generated callouts MUST receive normalized `data-callout` and
  `data-callout-family` state from `setup/callouts.ts`. Shared CSS MUST style family tone and
  geometry from `data-callout-family` rather than repeat the TypeScript type mapping.
- **FR-050**: Component and private content-layout styles MUST load once from `styles/index.ts`;
  redundant media-fit and default-preset visual selector twins MUST be removed without changing
  the resulting semantic presentation.
- **FR-051**: Preset watermark markup MUST be conditional on variants where the watermark is
  intentionally visible. The theme MUST NOT render an image whose normal state is
  `display: none`.
- **FR-052**: With `package.json.files` as the publish allowlist, a redundant `.npmignore` MUST
  NOT be maintained. Fixture-only media MUST have one source under `fixtures/public/`, and
  source checks MUST not pretend to parse nested CSS or enforce unrelated dependency versions.

### Experience and Compatibility Requirements *(mandatory)*

- **UX-001**: Figures, callouts, author cards, badges, sequences, highlights, keycaps, and
  closing content MUST each retain a recognizable visual role rather than collapsing into one
  repeated "left rail plus pale box" pattern.
- **UX-002**: Representative short, long, wrapped, bilingual, transparent, portrait, and
  landscape content MUST remain legible at the canonical 16:9 viewport and maintained compact
  viewport with zero unintended clipping, overlap, horizontal slide overflow, orphan
  separators, or duplicate decoration.
- **UX-003**: Callout families, badge states, task states, links, highlights, and sequence nodes
  MUST meet the project's accessible contrast expectations in every supported mode and MUST
  retain a non-color distinction wherever color communicates meaning.
- **UX-004**: Actionable links and valid emails MUST remain keyboard reachable with visible
  focus. Badges, sequence markers, highlights, keycaps, brand marks, and presentation-only task
  boxes MUST not become misleading focus targets.
- **UX-005**: Authored casing, acronyms, bilingual punctuation, CJK spacing, captions, and
  logical source order MUST survive preset changes without semantic alteration.
- **UX-006**: The maintained examples and closing slides MUST favor open space, restrained
  hierarchy, and content-first composition; decorative cards, identity marks, and metadata
  MUST appear only when they communicate authored information.
- **COMP-001**: Existing `themeConfig.presentation` behavior, documented per-slide overrides,
  ordinary Slidev Markdown, canonical public component/layout names, and
  `.obsidian-slidev-*` semantic content MUST remain compatible, except for the explicitly
  removed pre-1.0 aliases in FR-044–FR-046.
- **COMP-002**: Correcting Figure fit and removing unintended duplicate decoration are expected
  visual corrections, not new authoring requirements; decks using existing valid inputs MUST
  require no source changes.
- **COMP-003**: Badge tone and marker inputs MUST be optional. Existing Badge usage MUST remain
  valid and resolve to the documented neutral, marker-free default.
- **COMP-004**: Presets MAY change palette, typography, spacing, and brand assets, but MUST NOT
  replace shared semantic shapes, states, reading order, media fit, or fallback behavior.
- **COMP-005**: Kbd's established semantic and visual treatment MUST remain intact and serve as
  the comparison standard for ensuring that highlights, badges, and inline code do not resemble
  keyboard controls.
- **COMP-006**: This pre-1.0 package makes no general backwards-compatibility promise. A removed
  public alias or duplicate input MUST have a concise migration note and one canonical
  replacement; compatibility shims without a demonstrated consumer MUST NOT remain. The
  migration note MUST include removal of the undocumented root `configs.info` footer fallback.

### Runtime Stability and Asset Requirements *(mandatory)*

- **PERF-001**: Build duration, output growth, logical-bundle size, and navigation timing are
  out of scope. The repository MUST NOT retain raw performance baselines or a performance
  baseline-update workflow for this feature.
- **PERF-002**: Corrected figures, generated media, optional logos, callouts, badges, sequences,
  and preset chrome MUST introduce no observable layout shift after a slide becomes visible.
- **PERF-003**: The feature MUST add no new theme-owned asset larger than 250 KiB without
  optimization or explicit justification.

### Key Entities

- **Media Presentation**: An authored or generated image with source geometry, a bounded or
  natural display region, `contain` or `cover` intent where supported, accessible description,
  optional caption, load state, and reserved projection space.
- **Closing Logo**: An optional author-controlled image whose role is brand identification,
  using undecorated containment rather than figure framing.
- **Callout Family**: One semantic group—info, positive, caution, danger, question, quotation,
  or neutral—with a title, tone, non-color marker, supported type members, and fallback rules.
- **Author Display Record**: One normalized contributor with a primary label and optional
  distinct institution and email details, each rendered no more than once.
- **Status Badge**: A compact visible status label with one semantic tone and an optional
  non-interactive marker.
- **Sequence Pattern**: Either an ordered procedure with numbered nodes or a chronology with
  event nodes and optional date labels, both preserving source order.
- **Chrome Accent**: The shared secondary emphasis level for structural separators and markers,
  distinct from stronger semantic callout carriers.
- **Visual Regression Case**: A representative rendering whose expected result is justified by
  an explicit semantic, geometric, accessibility, or compatibility acceptance scenario.

### Review Finding Traceability

| Review item | Covered by |
| --- | --- |
| 1. Figure fit failure | FR-001–FR-005, FR-028–FR-029 |
| 2. Default preset flattens callout shapes | FR-008–FR-010, FR-028 |
| 3. Double link underline | FR-006 |
| 4. Repeated author fallback values | FR-007 |
| 5. Completed tasks receive stronger emphasis | FR-013 |
| 6. Badges lack semantic tone and duplicate icons | FR-014–FR-016 |
| 7. Callout family tone is weak or inverted | FR-010 |
| 8. Steps and Timeline rail geometry conflicts | FR-019–FR-022 |
| 9. Highlights resemble code and keycaps | FR-017–FR-018, COMP-005 |
| 10. Presets transform authored titles | FR-011, UX-005 |
| 11. Minimal closing balance and logo tray | FR-005, FR-023 |
| 12. Chrome accent strength is inconsistent | FR-024 |
| 13. Generated and component media diverge | FR-004 |
| 14. Test-only styling ships as theme behavior | FR-027 |
| 15. Brand overlap, bilingual wrapping, compact title scale | FR-012, FR-025–FR-026 |

Follow-up review traceability:

| Follow-up review item | Disposition |
| --- | --- |
| 1. Badge textual Boolean drift | FR-033 |
| 2. JavaScript frame-chrome recomputation | FR-034 |
| 3. Runtime dependency and bundled-asset drift | FR-038 |
| 4. Remote/local font contradiction | FR-037 |
| 5. Option registry does not drive resolution | FR-035 |
| 6–7. Dead source and duplicate selectors | FR-039 |
| 8. Parallel media wiring | Retain shared state primitives; no speculative abstraction |
| 9. Conflicting default tokens | FR-040 |
| 10. Full preset selector-layer rewrite | Deferred as a separate visual-architecture change |
| 11. ICT serif token semantics | FR-040 |
| 12. DOM bilingual normalization disclosure | FR-041 |
| 13. Narrowed image-layout background size | FR-036 |
| 14. Documentation/API drift | FR-036, FR-041–FR-042 |
| 15. Repository hygiene | FR-039, FR-042; published package/namespace rename is out of scope |
| 16. Callout mapping drift guard | FR-042 |

Pre-1.0 simplification traceability:

| Simplification review item | Disposition |
| --- | --- |
| Task normalizer captures ordinary form checkboxes | FR-043 |
| Steps/Timeline wrapper duplication | Retained: distinct semantics, eight-line wrappers, one shared style implementation |
| Figure/ClosingLogo state duplication | FR-047 |
| Cover/Authors duplicate rendering | FR-047 |
| `end`/`thanks` alias and quote/Figure duplicate inputs | FR-044–FR-046 |
| Duplicate media/preset CSS and two style-loading paths | FR-050 |
| Callout family mapping in TS and CSS | FR-049 |
| Dead root/frame presentation state | FR-048 |
| Redundant npm ignore and duplicated fixture assets | FR-052 |
| Hidden preset watermark nodes | FR-051 |
| Approximate CSS parser and dependency-version policy | FR-052 |

### Out of Scope

- Adding new callout types, semantic families, layouts, or content components beyond the
  optional Badge inputs required here.
- Changing how Obsidian syntax is parsed or converted into semantic presentation content.
- Making tasks editable, making badges interactive, animating sequences, or adding timeline
  authoring tools.
- Redesigning Kbd, the overall preset identities, protected institutional artwork, or the
  complete layout system.
- Supporting non-image media through Figure or adding image editing, focal-point selection, or
  automated art-direction behavior.
- Replacing author-supplied logos, changing their licensing, or modifying protected brand
  colors.
- Broad mobile or print redesign beyond maintaining the project's existing compact and export
  behavior.
- Renaming the published npm package or public CSS namespaces.
- Rewriting all preset selectors into cascade layers or changing every preset's specificity
  strategy in the same visual-correction patch.
- Removing `Steps` or `Timeline`; their distinct ordered-procedure and chronology semantics
  justify separate public wrappers over one shared style model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One portrait and one landscape geometry fixture pass both `contain` and `cover`
  expectations in Figure and both image-and-text orientations across all three presets and
  supported modes, with 100% of the image visible for `contain`, 100% of the region filled for
  `cover`, and observably different visible extents whenever aspect ratios differ.
- **SC-002**: Inline, wrapped, block-level, author-card, and closing-contact link cases show
  exactly one underline bounded to text and zero full-container decoration in every preset and
  supported mode.
- **SC-003**: All 19 callout types pass the three-preset, two-mode review matrix—114 checks—with
  the correct semantic family, non-color marker, and family title tone, and with zero
  preset-wide shape flattening or neutral-over-danger emphasis inversions.
- **SC-004**: Complete, name-only, institution-only, valid-email-only, invalid-email-only,
  whitespace-normalized, and mixed author collections display every distinct value exactly
  once and preserve 100% of valid email actions.
- **SC-005**: All seven Badge tones pass the three-preset, two-mode review matrix—42 tone
  checks—and marker-on, marker-off, and authored-icon cases show zero unintended duplicate
  dots.
- **SC-006**: Representative tasks, highlights, Steps, and Timeline cases pass every preset and
  supported mode with zero heavier completed tasks, control-like highlights, doubled rails,
  miscentered Step nodes, visible Timeline ordinals, or misaligned undated labels.
- **SC-007**: Minimal and content-rich closing slides, transparent logos, top-right ICT content,
  compact callouts, generated media, and bilingual headings show zero unintended clipping,
  overlap, tray framing, orphaned separators, or layout shift at maintained review viewports.
- **SC-009**: All 15 design-review findings have at least one reproducible regression case, all
  required standalone and generated-content checks pass, and every intentional pre-1.0 removal
  has a documented canonical replacement.
- **SC-010**: The affected preset and mode matrix produces zero critical or serious
  accessibility findings for contrast, non-color meaning, focus visibility, reading order, or
  misleading interactivity.
- **SC-011**: No observable post-visibility layout shift occurs and no unjustified theme-owned
  asset exceeds 250 KiB.
- **SC-012**: Ordinary interactive checkbox controls remain enabled, visible, pointer-operable,
  and keyboard reachable after normalization, while all recognized task-list inputs remain
  presentation-only.
- **SC-013**: Maintained source contains one closing layout, no quote `cite` or Figure
  `backgroundSize` compatibility input, no per-component global style imports, no CSS callout
  type map, no dead root/frame presentation state, and no hidden watermark image nodes.

## Assumptions

- The review's P0, P1, and P2 groups map to specification priorities P1, P2, and P3
  respectively; all 15 findings remain in scope.
- The supported preset set remains `default`, `ucas`, and `ict`; mode-specific review applies
  wherever each preset supports light and dark presentation.
- The canonical specialized callout markers remain the established family cues: positive
  diamond, caution triangle, danger square, question ring, and quotation bar. Info and neutral
  may retain a preset-native neutral marker.
- Family tone on the title and marker is the canonical callout emphasis rule. Presets may vary
  typography but not semantic prominence or authored casing.
- Badge uses the same seven family names and palettes as callouts, defaults to `neutral`, and
  does not display a leading marker unless the author requests one.
- A warm, luminous wash independent of inline-code styling is the canonical prose-highlight
  language in both light and dark presentation.
- Component-authored and generated standalone image figures default to contained presentation.
  Image-and-text layouts retain their documented default fit while using the same corrected fit
  semantics; explicit author choices remain honored. Closing logos always use undecorated
  containment.
- The canonical link treatment is a single text underline; focus indication remains additional
  state feedback rather than a second persistent underline.
- Minimal closing pages center their primary message by default. Content-rich closing pages may
  use a balanced grid while preserving message-first reading order.
- Existing visual baselines are evidence, not authority, when they conflict with an explicit
  semantic or geometric contract; known bug snapshots are expected to change.
- Feature documentation and specification artifacts remain in English, while authored
  presentation content may be English, Chinese, or bilingual.
- The maintainer explicitly does not require build-duration, bundle-growth, or navigation-time
  budgets for this feature; raw samples and baseline update machinery are unnecessary.
- The package is pre-1.0. Canonical replacements and concise migration notes are required, but
  compatibility-only aliases are not.
- The design target is simple, calm, and low-ornament; author-controlled content takes priority
  over decorative theme surfaces.

## Dependencies

- The public components, layouts, normalization behavior, semantic families, and fallback state
  machines delivered by `002-expand-theme-content` remain available.
- The maintained standalone examples, generated-content protocol deck, visual review tooling,
  canonical 16:9 viewport, compact viewport, and supported light/dark modes remain available as
  verification inputs.
- Preset brand assets and protected institutional identity colors remain unchanged except for
  collision-free placement and safe-space behavior.
- The shared configuration surface, semantic generated-content contract, and existing keyboard
  focus behavior remain stable compatibility dependencies.
