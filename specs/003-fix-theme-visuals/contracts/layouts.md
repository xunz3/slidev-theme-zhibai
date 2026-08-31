# Layout and Frame Contract Corrections

This contract supersedes conflicting visual expectations in
`specs/002-expand-theme-content/contracts/layouts.md`. Canonical frontmatter inputs,
configuration precedence, and logical reading order remain stable; unused pre-1.0 aliases are
removed.

## `end`

`end` is the single closing layout and delegates to one private Closing Layout.

Public inputs remain:

| Input | Default | Contract |
| --- | --- | --- |
| Default slot | authored message | Primary and first in DOM order |
| `contact` | omitted | Valid email link or visible plain text |
| `showAuthors` | `false` | Shared root author collection when true |
| `logo` | omitted | Adds private closing-logo region |
| `logoAlt` | `Presentation logo` | Explicit empty remains decorative |
| `chrome` | `auto` | Existing closing chrome resolution |
| `title`, `subtitle` | existing metadata behavior | No visible duplicate introduced |

### Composition state

The implementation exposes stable state for styling/testing:

```html
<div
  class="presentation-closing presentation-closing--minimal|presentation-closing--rich"
  data-closing-state="minimal|rich"
>
  ...
</div>
```

Derivation:

```text
message only → minimal
contact and/or rendered authors and/or logo → rich
```

Rules:

- Minimal message is centered horizontally and vertically in the available content region and
  uses a balanced readable measure.
- Rich DOM order is always message, contact, authors, logo.
- CSS grid may place rich regions visually but cannot change DOM/focus order.
- Omitted regions create no empty wrapper or grid reservation.
- Long/bilingual content remains contained at canonical and compact viewports.

### Closing logo

Closing logo markup is private and intentionally distinct from Figure:

```html
<div
  class="presentation-closing-logo"
  data-logo-state="pending|ready|failed"
>
  <!-- contained img or meaningful fallback -->
</div>
```

Rules:

- Always uses `object-fit: contain`; complete transparent artwork remains visible.
- Has no `.obsidian-slidev-media` class, `figure`, `figcaption`, media tray, border, background,
  or shadow.
- A source reserves stable geometry before decode.
- Meaningful failure retains `logoAlt`; decorative failure stays unnamed.
- Ready/failure transition does not move message/contact/authors.
- Logo is not a link or control unless a future explicit public contract says so.

The public `logo` and `logoAlt` inputs remain unchanged even though private DOM and existing
visual baselines intentionally change.

Migration:

```text
layout: thanks → layout: end
```

No compatibility-only `thanks.vue` entry remains.

## `quote`

Quote attribution uses `author`; `source` remains optional. The duplicate pre-1.0 `cite`
frontmatter input is removed.

```text
cite: Ada Lovelace → author: Ada Lovelace
```

This does not affect the canonical `cite` callout type.

## `figure`

The figure layout accepts `figureVariant` with four canonical values. Omitted or unsupported
values resolve to `centered`, preserving the pre-existing layout.

| Value | Composition contract |
| --- | --- |
| `centered` | Balanced centered figure and caption below the media |
| `stage` | Expanded media stage with caption below; never changes `fit` or `imagePosition` |
| `minimal` | Centered figure without a tray border, tray background, or shadow |
| `editorial` | Media and a top-aligned caption rail in two columns; collapses to media then caption on narrow viewports |

The variant is exposed as `data-figure-variant` and a matching
`.slide-layout-figure--<variant>` class. The default slot remains in authored DOM order and is
not reparented. Presets target a direct public or generated `.obsidian-slidev-media`; arbitrary
slot content retains the ordinary centered layout. Alternative text, failure handling, media
fit, and focal position remain owned by Figure/generated-media normalization rather than the
layout variant.

## `image-left` and `image-right`

Both names continue to delegate to `internals/ImageTextLayout.vue`.

Inputs remain:

| Input | Default | Contract |
| --- | --- | --- |
| Default slot | authored narrative | First in DOM/logical order |
| `image` | omitted | Missing value collapses media region |
| `imageAlt` | Figure precedence | Existing tri-state behavior |
| `caption` | omitted | Empty creates no caption |
| `backgroundSize` | `contain` | Any safe, non-empty CSS `background-size`; invalid input falls back to `contain` |
| `imagePosition` | `center` | Safe keyword/percentage focal position |
| `mediaRatio` | `50` | Media track share, clamped to `30`–`70` |
| `class` | omitted | Existing class fallthrough |
| `title`, `subtitle`, `chrome` | existing frame behavior | No compatibility change |

Rules:

- DOM order remains narrative then Figure for both orientations.
- CSS alone mirrors visual placement.
- `contain` and `cover` use the exact Figure geometric meanings.
- Other valid values such as `80%`, `auto 72%`, and `120px auto` render as a non-repeating
  viewport background positioned by `imagePosition`. The same source remains present as the
  accessible image and owns the shared pending/ready/failed state.
- Empty values, values longer than 256 characters, and values containing `;`, `{`, or `}` fall
  back to `contain`.
- Both orientations reserve equivalent media/caption geometry for the same source/fit.
- The default two-column split remains 50/50. `mediaRatio` changes the media track while keeping
  the same meaning in both orientations.
- Captions align to the logical start edge of their media viewport.
- Missing/failing image behavior and caption/alternative precedence use the shared Media
  Presentation contract.
- Canonical and compact viewports show no unintended clipping, horizontal slide overflow, or
  caption collision.

## Figure Layout and Generated Media

The public `figure` layout continues to provide its existing media-first frame and slot. It does
not synthesize Figure markup. Component-authored and generated image figures inside it follow
their respective contracts in [components.md](components.md) and
[generated-content.md](generated-content.md).

## Shared `SlideFrame`

### Secondary chrome role

Every frame resolves:

```css
--presentation-chrome-accent: <frame-local secondary structural color>;
```

Required consumers:

- header divider;
- footer divider;
- table-header bottom rule;
- ordinary list marker;
- preset footer cap or equivalent structural accent.

Rules:

- The default strength is the documented 34% accent/strong-border mix.
- A preset may change the role token once for its mode; it cannot assign unrelated strengths to
  individual consumers.
- Semantic callout carriers remain separate and may be stronger.
- The token resolves inside each frame so simultaneously mounted preset/local-accent slides do
  not leak.
- Every direct or internal layout-owned `chrome` prop accepts `PresentationChrome | boolean`;
  native `true` resolves on and native `false` resolves off. Its explicit default is
  `undefined` so an omitted Boolean-capable prop still inherits slide/deck/default resolution.
- The centered footer resolves per-slide `footer`, root `footer`, then root `title`. The
  undocumented root `configs.info` fallback is removed.

### Brand safe regions

Rules:

- Ordinary content slides render no preset mark and reserve no unused brand padding.
- Cover branding occupies cover-owned structure and remains clear of the visible title,
  subtitle, body, and author regions.
- UCAS/ICT section dividers reserve inline-end space based on the rendered lockup bounds.
- At the compact viewport, section lockups use section-specific offsets and dimensions while the
  content returns to the full inline width.
- When an explicitly enabled header owns the top row, the section lockup is not rendered; the
  decorative watermark remains below the content/chrome stacking layer.
- At 980 × 552 and 720 × 405, visible cover/section lockups must not intersect a user heading,
  Figure, caption, link, control, or chrome region.
- A mode-independent ceremonial field keeps the same watermark opacity in light and dark mode.
- Protected asset pixels, aspect ratios, and institutional colors remain unchanged.
- No brand-safe custom property, DOM attribute, or root state is required; layout selectors own
  the geometry directly.

## Bilingual Heading Wrapping

The renderer recognizes canonical spaced U+00B7 in:

- Markdown `h1`–`h4`;
- frame title;
- frame subtitle.

Presentation normalization changes:

```text
English[space]·[space]中文
```

to the equivalent rendered text with a non-breaking space only before `·`.

Rules:

- Separator remains on the same rendered line as the preceding visible token.
- Following content remains breakable.
- Normalization is idempotent and does not replace the separator or change authored casing.
- Links/emphasis nested in headings retain semantics and source order.
- Source Markdown remains unchanged, while the rendered DOM and copied heading text contain
  U+00A0 before the separator.
- The normalizer runs during the shared initial/addition render path and must cause no
  post-visibility layout shift.

Other punctuation receives no undocumented rewrite in this feature.

## Maintained Viewports

| Name | Logical viewport | DPR | Purpose |
| --- | --- | --- | --- |
| canonical | 980 × 552 | 2 | Complete affected preset/mode semantic and visual review |
| compact | 720 × 405 | 2 | Responsive/collision subset at the shared and preset breakpoints |

Compact required surfaces:

- compact callout hierarchy and authored title casing;
- minimal/rich closing plus transparent logo;
- image-left/image-right fit and caption containment;
- UCAS/ICT top-right user content versus brand mark;
- bilingual heading separator;
- Steps/Timeline geometry;
- representative links, tasks, badges, and highlights for overflow/contrast.

This compact contract is not a broad mobile redesign.

## Pre-1.0 Evolution

- Canonical layout names `end`, `image-left`, `image-right`, and `figure` remain.
- Existing valid image-layout `image`, `class`, and `backgroundSize` inputs, closing metadata,
  chrome, and slot use remain accepted.
- `thanks` is removed in favor of `end`.
- Decks that used root `configs.info` for the centered footer must move the value to root or
  per-slide `footer`, or rely on root `title`.
- Narrative/message logical order and all existing configuration precedence remain unchanged.
- Figure/closing fit corrections and safe-space changes require no migration beyond the
  explicit alias/input replacements above.
