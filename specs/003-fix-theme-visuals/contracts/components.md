# Component Contract Corrections

This contract supersedes conflicting visual expectations in
`specs/002-expand-theme-content/contracts/components.md`. The package is pre-1.0, so this
contract keeps canonical inputs and removes unused compatibility-only duplicates.

## Shared Rules

Public components:

```text
Callout, Figure, Authors, Steps, Timeline, Tag, Badge, Kbd
```

- All remain auto-registered by Slidev.
- No component introduces a focus target except a real authored/normalized link.
- Presets may vary typography, spacing, radius, and palette expression, but not semantic family,
  state, source order, fit meaning, or fallback behavior.
- Ordinary `class`, `style`, and supported Vue attributes continue to reach the root.
- Existing Tag and Kbd public authoring APIs remain stable.

## `Callout`

Public props remain:

| Prop | Type | Default |
| --- | --- | --- |
| `type` | string | neutral fallback |
| `title` | string | canonical type title or `Callout` |

Canonical structure remains:

```html
<aside
  class="obsidian-slidev-callout [obsidian-slidev-callout--TYPE]"
  data-callout="TYPE-OR-neutral"
  data-callout-family="FAMILY"
  role="note"
  aria-labelledby="UNIQUE_TITLE_ID"
>
  <div id="UNIQUE_TITLE_ID" class="obsidian-slidev-callout__title">...</div>
  <div class="obsidian-slidev-callout__content">...</div>
</aside>
```

Corrected invariants:

- The 19 existing types resolve through the registry in `setup/callouts.ts`.
- Empty/unsupported values remain neutral and emit no canonical type modifier.
- Positive, caution, danger, question, and quotation families keep diamond, triangle, square,
  ring, and bar markers respectively in every preset/mode.
- The title and marker use the same resolved family tone.
- A preset cannot replace all specialized markers with one shape.
- The title string is displayed with authored/default casing unchanged; no preset-wide
  uppercase or casing transform applies.
- Long, mixed-case, acronym, and bilingual titles preserve their characters and normal spacing.
- Compact density reduces padding/title scale through production density rules and cannot make
  a title compete with the slide heading.
- Component and canonical generated-class fallbacks receive the same family geometry.

## `Figure`

Public props remain:

| Prop | Type | Default |
| --- | --- | --- |
| `src` | string | missing state |
| `alt` | string or omitted | caption, then `Figure` |
| `caption` | string | omitted |
| `fit` | `contain` or `cover` | `contain` |
| `imagePosition` | safe CSS position string | `center` |
| `variant` | `centered`, `stage`, `minimal`, or `editorial` | omitted/inherited ordinary treatment |

Canonical component structure remains a native `figure` with one bounded viewport, optional
native `img`, meaningful failure fallback, and optional `figcaption`.

Required state:

```html
<figure
  class="obsidian-slidev-media obsidian-slidev-media--image [obsidian-slidev-media--figure-<variant>]"
  data-figure-variant="centered|stage|minimal|editorial"
  data-media-state="missing|pending|ready|failed"
>
  <div
    class="obsidian-slidev-media__viewport"
    data-media-fit="contain|cover"
    data-media-position="center|safe authored position"
  >
    <!-- img or meaningful fallback -->
  </div>
  <!-- optional figcaption -->
</figure>
```

Fit contract:

| Fit | Required painted result |
| --- | --- |
| `contain` | Entire source visible, aspect ratio preserved, empty viewport area permitted |
| `cover` | Viewport fully filled, aspect ratio preserved, only overflow needed to fill cropped |

Rules:

- The viewport has stable width/height before image decode.
- `contain` and `cover` visibly differ whenever source and viewport ratios differ.
- Fit is selected directly from `data-media-fit`; inherited theme variables cannot reinterpret
  an explicit component fit.
- `imagePosition` controls the focal point without changing fit geometry. Invalid values fall
  back to `center`.
- No preset may reinterpret the fit values.
- `alt=""` remains decorative and is never replaced with caption text.
- Missing/failed meaningful images remove the broken image visual and retain resolved
  alternative text in the stable viewport.
- Caption creation, accessible-name precedence, eager loading, and public class names remain
  compatible.
- Captions align to the logical start edge of the media viewport.
- On non-`figure` layouts, an explicit `variant` owns only that Figure's local composition and
  uses a compact height budget suitable for surrounding prose.
- On `layout: figure`, slide-level `figureVariant` owns the composition; a local component
  variant cannot silently shrink or replace the full-slide preset.
- Generated image figures may opt into the same ordinary composition with the canonical
  `.obsidian-slidev-media--figure-<variant>` modifier emitted through the producer's existing
  advanced figure-class option.
- Generated-image equivalence is defined in
  [generated-content.md](generated-content.md), not by requiring identical internal DOM.

## `Authors`

`Authors` resolves root `authors`, then root `author`.

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `cards` or `cover` | `cards` |

The variant changes only the class vocabulary used by the cover composition. It does not create
a second author normalization or value-order contract.

Per-record render contract:

```html
<li class="presentation-author">
  <!-- one primary label, optionally an anchor -->
  <!-- zero or one distinct institution -->
  <!-- zero or one distinct email, optionally an anchor -->
</li>
```

Rules:

- Trim supported values and drop empty records.
- Resolve primary as non-empty `name`, else `email`, else `institution`.
- Preserve author-record order and intentional duplicate records.
- Within one card, render each distinct normalized value at most once.
- Suppress a secondary institution/email equal to the primary or an earlier visible detail.
- If a valid email is the primary, render the primary itself as one `mailto:` link.
- A retained valid secondary email remains one `mailto:` link.
- Invalid non-empty email text remains visible but non-actionable.
- Footer/cover/closing consumers use the same normalized primary data; no consumer-specific
  fallback is permitted.

No-empty behavior remains: when no valid record exists, render no collection wrapper.

## `Badge`

Public authoring:

```md
<Badge>Ready</Badge>
<Badge tone="positive">Validated</Badge>
<Badge tone="caution" marker>Needs review</Badge>
<Badge tone="danger">⚠ Blocked</Badge>
```

Props:

| Prop | Type | Default |
| --- | --- | --- |
| `tone` | `neutral`, `info`, `positive`, `caution`, `danger`, `question`, `quotation`, or other string | `neutral`; unsupported → `neutral` |
| `marker` | boolean or string | `false` |

Root contract:

```html
<span
  class="presentation-badge presentation-badge--TONE"
  data-badge-tone="TONE"
  data-badge-marker="true|false"
>
  ...visible authored status wording...
</span>
```

Rules:

- Tone normalization is case-insensitive after trimming.
- Badge remains a non-focusable inline text container with no status/live-region/button role.
- Badge uses the shared Semantic Family palette.
- The root status shape/fill remains distinct from Tag, inline code, and Kbd without color.
- Marker normalization accepts native booleans and the trimmed lowercase strings `true`,
  `false`, `on`, and `off`. Invalid strings resolve to `false`.
- Marker omitted, `false`, `"false"`, `"off"`, or invalid produces no automatic
  pseudo-element or marker node.
- Marker `true`, `"true"`, or `"on"` produces exactly one empty decorative leading marker
  using the resolved family geometry; it contributes no accessible text.
- An authored icon is ordinary slot content. It never implicitly enables the marker.
- Visible wording remains required to communicate state; hue/marker alone is insufficient.

## `Kbd`

Public input remains either one key in the default slot or a `keys` array for a chord.

Rules:

- Runtime input is defensive even though the TypeScript prop is `string[]`: a non-array value
  falls back to the default slot and non-string array entries are ignored.
- String entries are trimmed and empty entries are removed.
- A non-empty normalized `keys` array wins over the default slot.
- Visible separators remain `+`; the accessible sequence uses the spoken word `plus` so screen
  readers do not depend on punctuation pronunciation.
- Kbd remains non-interactive and adds no focus target, button role, or nested accessible
  duplicate keycaps.

## `Steps`

Public input remains one ordered Markdown list in the default slot.

Rules:

- The authored `<ol>` and `<li>` order remains the semantic authority.
- Native visual ordinals are replaced by visible numbered nodes using `counter(list-item)`.
- Node center and connector x-coordinate derive from shared size/rail tokens.
- A connector runs from one node center to the next and exists only for an item with a following
  adjacent item.
- Zero items show no node/connector; one item shows one node and no connector.
- Authored list numbering (`start`/`value` when present) remains representable.
- Non-list fallback slot content stays readable and receives no sequence decoration.

## `Timeline`

Public input remains one ordered Markdown list in the default slot; `<time datetime>` remains
optional.

Rules:

- The authored `<ol>` remains available to assistive technology and preserves order.
- Visual ordinals are hidden.
- Each item receives one unnumbered chronological node.
- Adjacent center-to-center segments form one rail; item cards have no second left rail/bar.
- Zero/one-item connector behavior matches Steps.
- A leading `<time>` and a documented leading `<strong>` label use equivalent padding, border,
  shape, baseline, and left edge, including normal Markdown paragraph wrappers.
- Plain unwrapped undated prose remains readable but does not invent a label entity.

## Presentation Tasks

Task-list authoring and normalizer inputs are unchanged.

- Every normalized checkbox remains disabled and removed from tab order.
- Only checkboxes in recognized `.task-list-item`, `.contains-task-list`, or
  `.obsidian-slidev-task-list` contexts are normalized.
- Ordinary interactive HTML checkboxes outside those contexts remain visible, enabled,
  pointer-operable, and keyboard reachable.
- Unchecked task labels retain primary text emphasis.
- Checked labels use normal/inherited weight and a readable muted role; they are never heavier
  than unchecked labels.
- Existing filled box plus checkmark remains the non-color checked cue.
- Nested unchecked tasks reset to primary emphasis even beneath a checked parent.
- Task content and order are not rewritten or persisted.

## Prose Highlights

Native `<mark>` and `.obsidian-slidev-highlight` remain equivalent.

- Prose uses a flat warm light/dark wash.
- Prose highlight has no border, radius, inset edge, or box shadow.
- `box-decoration-break: clone` keeps wrapped lines legible.
- Inline code remains rounded/monospaced/accent-tinted and Kbd remains bordered/raised.
- Inside `pre` or `code`, highlight selectors add no background, padding, border, radius, or
  shadow.

## Pre-1.0 Evolution

- Existing `<Badge>text</Badge>` is the documented neutral marker-free state.
- Figure uses `fit="contain|cover"` only. The undocumented duplicate Figure
  `backgroundSize` input is removed; image/text layouts retain `backgroundSize`.
- Quote-layout attribution uses `author`; the duplicate quote-layout `cite` input is removed.
- Callout type `cite` remains a canonical quotation-family type.
- Public component names and ordinary Markdown/Vue slot behavior remain unchanged.
- Global component styles load once from `styles/index.ts`; individual public components do
  not inject unscoped theme styles.
