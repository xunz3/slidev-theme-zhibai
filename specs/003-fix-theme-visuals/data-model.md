# Data Model: Fix Theme Visual Semantics

The feature has no persisted application storage. Its entities are normalized authoring inputs,
rendered semantic state, geometric presentation roles, and retained quality evidence.

## Shared Rules

- Trim string inputs before validation.
- Preserve authored text, casing, acronyms, punctuation, CJK spacing, and source order.
- Omitted input differs from explicit empty input only where the existing accessibility contract
  requires it (`alt` and `logoAlt`).
- Unsupported optional enum input falls back to its documented default; it never suppresses a
  valid lower-level/default presentation.
- Decorative generated content never becomes a focus target or accessibility name.
- Presentation normalization is idempotent and limited to the rendered slide subtree.
- Corrected visual defaults do not rewrite source Markdown or Obsidian conversion output.

## 1. Semantic Family

One shared semantic tone/shape used by Callout and Badge.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | `neutral`, `info`, `positive`, `caution`, `danger`, `question`, or `quotation` | Closed set |
| `sourceColor` | CSS color role | Resolved on the local frame |
| `titleColor` | readable derived CSS color | Meets project contrast expectations in the active mode |
| `surfaceColor` | derived CSS color | Supports, but does not replace, wording/shape |
| `markerGeometry` | round/native, diamond, triangle, square, ring, or bar | Stable across presets |
| `accentPolicy` | local-accent or protected | `info` may follow local accent; specialized families remain protected |

Canonical specialized geometry:

| Family | Marker |
| --- | --- |
| `positive` | diamond |
| `caution` | triangle |
| `danger` | square |
| `question` | ring |
| `quotation` | vertical bar |

`info` and `neutral` may use the shared/preset-native neutral marker, but a preset may not
replace specialized geometry.

Relationships:

- Every typed Callout resolves to exactly one Semantic Family.
- Every Badge tone resolves to exactly one Semantic Family.
- Chrome Accent is a separate weaker structural role and is not a Semantic Family carrier.

## 2. Callout Presentation

| Field | Type | Rules |
| --- | --- | --- |
| `rawType` | unknown | Public/generated value before normalization |
| `type` | canonical callout type or `null` | Same 19-type registry as feature 002 |
| `family` | Semantic Family | `neutral` when type is unsupported/empty |
| `title` | string | Authored non-empty title, canonical default, or `Callout` |
| `titleCasing` | preserved | No preset-wide transformation |
| `body` | rendered slot/generated content | Source order and semantics preserved |
| `density` | compact, normal, or relaxed | Affects scale/spacing, not family meaning |

The canonical type-to-family mapping remains:

```text
info:       note, info, todo, abstract, summary
positive:   tip, success, check
caution:    warning, caution, attention
danger:     danger, error, failure
question:   question, help, faq
quotation:  quote, cite
neutral:    empty or unsupported input
```

Validation:

- Matching remains case-insensitive after trimming.
- Component output may expose `data-callout-family`; generated output without that field is
  resolved by canonical modifier class.
- Title and marker consume the resolved family tone.
- Compact presentation cannot make the title dominate the slide heading or body.

## 3. Status Badge

| Field | Type | Rules |
| --- | --- | --- |
| `rawTone` | unknown | Public `tone` prop before normalization |
| `tone` | Semantic Family name | Defaults/falls back to `neutral` |
| `rawMarker` | boolean or string | Public `marker` before normalization |
| `markerRequested` | boolean | Normalized marker state; default `false` |
| `markerGeometry` | family geometry or absent | Present only when requested |
| `content` | rendered visible slot | Required source of status wording |
| `interactive` | `false` | No role, tabindex, click, or live behavior |

Normalization:

```text
trimmed supported tone → canonical lowercase tone
omitted/empty/unsupported tone → neutral
marker true/"true"/"on" → exactly one empty decorative family marker
marker omitted/false/"false"/"off"/invalid → no generated leading marker
```

Validation:

- Authored icons remain ordinary slot content and do not imply `markerRequested`.
- Marker-off output contains no automatic dot.
- A requested marker cannot obscure, repeat, or change authored content.
- Shape/fill plus visible wording distinguish Badge from Tag, inline code, and Kbd.

## 4. Media Presentation

An authored/component or generated image rendered as figure content.

| Field | Type | Rules |
| --- | --- | --- |
| `origin` | component, generated, or image-layout | Determines ownership, not visual semantics |
| `src` | trimmed string | Empty means missing |
| `altInput` | omitted, empty, or non-empty | Existing tri-state alternative contract |
| `resolvedAlt` | string | Existing Figure precedence |
| `caption` | string or absent | Empty captions create no region |
| `fit` | contain, cover, or safe CSS background-size | See defaults below |
| `viewport` | bounded geometry | Reserved before decode |
| `loadState` | missing, pending, ready, or failed | Reflected in stable data state |
| `managedBy` | Vue component or generated-image enhancer | Exactly one owner |

Defaults:

| Surface | Default fit |
| --- | --- |
| Public Figure | `contain` |
| Generated image figure | `contain` |
| `image-left` / `image-right` | `cover` |

Fit invariants:

```text
contain → full source visible, aspect ratio preserved, letterboxing permitted
cover   → viewport filled, aspect ratio preserved, minimum necessary overflow cropped
other safe CSS size → centered non-repeating viewport background; accessible image retained
equal source/viewport ratio → contain and cover may look identical
different ratios → visible extents must differ
```

Image-layout values are trimmed and limited to 256 characters. Empty values and values
containing `;`, `{`, or `}` resolve to `cover`.

State transitions:

```text
empty src → missing → stable meaningful fallback or decorative empty viewport
non-empty src → pending → ready
non-empty src → pending → failed → broken image removed/hidden, stable meaningful fallback
source changes → pending for new source without reusing prior ready/failed state
```

Generated enhancement rules:

- Target only direct generated image figures that lack a Vue-managed viewport/state.
- Reserve CSS geometry before the enhancer runs.
- Do not reparent Vue-managed nodes.
- Re-running normalization changes no already-normalized output.

Relationships:

- Figure and image/text layouts share this entity.
- Generated figures converge on its default-contain, state, fallback, caption, and reserved-space
  vocabulary.
- Closing Logo reuses alternative/load-state rules but is a distinct visual role.

## 5. Closing Logo

| Field | Type | Rules |
| --- | --- | --- |
| `src` | trimmed string | Omitted means no logo region |
| `altInput` | omitted, empty, or non-empty | Existing closing-logo tri-state contract |
| `resolvedAlt` | string | Defaults to `Presentation logo` when omitted |
| `decorative` | boolean | True only for explicit empty alt |
| `fit` | `contain` | Fixed |
| `loadState` | pending, ready, or failed | Geometry remains reserved while source exists |
| `surface` | unframed | No Figure border, tray, caption, background, or shadow |

State transitions match Media Presentation, except a decorative failure produces no meaningful
fallback text. The reserved logo region remains stable so adjacent closing content does not
shift.

Relationships:

- Belongs to one rich Closing Composition.
- Uses the shared media alternative/load-state primitive.
- Never emits `.obsidian-slidev-media` Figure presentation classes.

## 6. Closing Composition

| Field | Type | Rules |
| --- | --- | --- |
| `layoutName` | end | Canonical pre-1.0 closing layout |
| `message` | rendered default slot | First in DOM/logical order |
| `contact` | Link Presentation or plain text, optional | Second in logical order |
| `authors` | Author Display Record collection, optional | Third in logical order |
| `logo` | Closing Logo, optional | Fourth in logical order |
| `state` | minimal or rich | Derived from authored regions |

State derivation:

```text
message only → minimal
contact and/or authors and/or logo present → rich
```

Validation:

- Minimal centers the message horizontally and vertically.
- Rich placement may use a grid but cannot change logical order.
- Omitted regions consume no grid area.
- No compatibility-only closing alias is retained.

## 7. Author Display Record

| Field | Type | Rules |
| --- | --- | --- |
| `sourceIndex` | non-negative integer | Preserves declaration order |
| `renderVariant` | cards or cover | Changes class vocabulary only; normalized values and order are shared |
| `primary` | string | Name, else email, else institution |
| `primarySource` | name, email, or institution | Records fallback origin |
| `primaryHref` | `mailto:` URL or absent | Present when primary equals an actionable email value |
| `institution` | distinct string or absent | Suppressed when equal to primary or an earlier detail |
| `email` | distinct string or absent | Suppressed when equal to primary or an earlier detail |
| `emailHref` | `mailto:` URL or absent | Present only with retained actionable email detail |

Normalization:

1. Trim `name`, `institution`, and `email`.
2. Drop a record with no non-empty supported field.
3. Resolve primary as `name || email || institution` to preserve current fallback precedence.
4. Walk authored detail order and retain a normalized value only when it has not already been
   displayed in the record.
5. If the displayed primary equals a syntactically valid email field, make the primary itself
   actionable.

Validation:

- Equality is exact after trimming; no undocumented case-folding.
- Each distinct non-empty value appears at most once per card.
- Complete records display name, institution, and email in their existing logical order.
- Duplicate records remain allowed and retain declaration order.
- Cover, footer, Authors, and closing consume the same normalized primary collection.

## 8. Link Presentation

| Field | Type | Rules |
| --- | --- | --- |
| `kind` | Markdown, generated, author-email, or closing-contact | Same persistent visual contract |
| `href` | actionable URL | Existing link behavior |
| `persistentDecoration` | text underline | Exactly one |
| `persistentBorder` | none | Explicitly resets imported/generated border rules |
| `focusDecoration` | outline | Additional state cue, not a second persistent underline |
| `display` | inline or authored block behavior | Theme does not force container-width decoration |

Validation:

- Underline follows the rendered linked text across wrapping.
- Block/card anchors receive no full-container bottom rule.
- Valid emails remain keyboard reachable and actionable.
- Focus indication remains visible in every preset/mode.

## 9. Presentation Task Item

| Field | Type | Rules |
| --- | --- | --- |
| `checked` | boolean | Preserved from emitted input |
| `disabled` | `true` | Presentation-only behavior |
| `tabIndex` | `-1` | Excluded from focus order |
| `labelEmphasis` | primary or completed-muted | Checked is never heavier |
| `boxCue` | empty box or filled checked box | Non-color state cue |
| `children` | nested task/list content | Nested unfinished content resets to primary |

No user-triggered state transition exists.

Eligibility:

```text
checkbox in .task-list-item,
checkbox in a list owned by .contains-task-list, or
checkbox in a list owned by .obsidian-slidev-task-list
→ presentation task

ordinary li > input[type="checkbox"] outside those contexts
→ authored interactive control; unchanged
```

## 10. Prose Highlight

| Field | Type | Rules |
| --- | --- | --- |
| `origin` | native mark or generated highlight class | Equivalent treatment |
| `surface` | prose or code | Only prose receives highlight |
| `background` | warm flat wash | Mode-aware and preset-independent |
| `border` | none | No control edge |
| `shadow` | none | No inset/raised effect |
| `wrapBehavior` | cloned flat background | Clean multi-line wrapping |

Elements inside `pre` or `code` resolve to the code state: transparent background, no added
padding/border/shadow, and inherited code color.

## 11. Sequence Pattern

| Field | Type | Rules |
| --- | --- | --- |
| `kind` | steps or timeline | Selects visual vocabulary |
| `list` | authored `<ol>` | Semantic/source-order authority |
| `items` | direct ordered `<li>` collection | Zero or more |
| `nodeSize` | shared length token | Connector derives from it |
| `connectorWidth` | shared length token | Secondary structural role |

### Step Item

| Field | Type | Rules |
| --- | --- | --- |
| `number` | `counter(list-item)` | Respects authored list numbering |
| `node` | numbered circle/shape | Centered on path |
| `connectorAfter` | boolean | True only when an adjacent next item exists |

### Timeline Item

| Field | Type | Rules |
| --- | --- | --- |
| `visualOrdinal` | hidden | `<ol>` semantics remain |
| `node` | unnumbered event node | Centered on one path |
| `label` | leading time, leading strong, or absent | Documented forms share container geometry |
| `connectorAfter` | boolean | True only when an adjacent next item exists |

Connector transition:

```text
0 items → no node, no connector
1 item  → one node, no connector
N items → N nodes, connectors only for items 1..N-1, each center-to-center
```

Timeline cards have no second edge rail.

## 12. Chrome and Section-Brand State

### Chrome Accent

| Field | Type | Rules |
| --- | --- | --- |
| `resolvedAccent` | local frame color | Existing first-valid precedence |
| `strength` | documented secondary mix | Default design value 34% |
| `chromeAccent` | derived CSS color | Frame-local |
| `consumers` | header/footer rules, th rule, ordinary list markers, footer cap | Same role within preset/mode |

### Section Brand Region

| Field | Type | Rules |
| --- | --- | --- |
| `variant` | frame variant | Lockup/watermark markup is limited to cover/section policy |
| `lockupPresent` | boolean | UCAS/ICT section only, and false when the header is visible |
| `inlineEndReserve` | CSS layout value | Section content only; sized from preset lockup geometry |
| `compactLockup` | CSS dimensions/offsets | Section-specific rule at 720 × 405 |
| `watermarkOpacity` | fixed preset value | Identical across modes on a mode-independent field |

Validation:

- Ordinary content and statement slides have no institutional image or brand reserve.
- User headings, figures, captions, links, controls, and headers do not intersect visible lockups.
- Section inline-end reserve is removed at the compact breakpoint after the lockup shrinks and
  moves into the outer top corner.
- Protected brand pixels/colors remain unchanged.

## 13. Bilingual Heading Separator

| Field | Type | Rules |
| --- | --- | --- |
| `separator` | U+00B7 `·` | Canonical supported centered separator |
| `precedingSpace` | breakable or non-breaking | Normalizer converts matching breakable space |
| `followingSpace` | breakable | Keeps the following phrase wrappable |
| `normalized` | boolean | Idempotent |

State transition:

```text
"English · 中文" → "English · 中文"
already normalized or no spaced U+00B7 → unchanged
```

Source Markdown remains unchanged. The rendered DOM and copied text contain U+00A0 before the
separator; all other authored characters remain unchanged.

## 14. Visual Regression Case

| Field | Type | Rules |
| --- | --- | --- |
| `caseId` | stable string | Independent of slide number where practical |
| `requirementIds` | non-empty list | Maps to FR/UX/COMP/PERF/SC evidence |
| `surface` | component/layout/generated/chrome | One primary ownership area |
| `preset` | default, ucas, or ict | Required for preset matrix |
| `mode` | light or dark | Required for supported mode matrix |
| `viewport` | canonical or compact | Explicit dimensions/DPR |
| `assertions` | semantic, geometry, accessibility, visual, asset, or layout stability | Expected result precedes baseline |
| `baselineDisposition` | unchanged, intentionally replaced, or new | Replacement requires review rationale |

## 15. Shared Vue Media Load State

Figure and Closing Logo consume one reactive state primitive:

| Field | Type | Rule |
| --- | --- | --- |
| `source` | computed trimmed string | Changes reset state to missing/pending |
| `alternative` | computed Media Alternative | Preserves omitted/empty/non-empty contract |
| `loadState` | missing, pending, ready, failed | Updated only by source/load/error |
| `showImage` | boolean | Source exists and state is not failed |
| `showFallback` | boolean | Meaningful missing/failed alternative only |

The primitive owns behavior only. Figure and Closing Logo retain distinct DOM and visual roles.

## 16. Canonical Generated Callout State

For each `.obsidian-slidev-callout`, normalization resolves:

```text
supported data-callout
  else supported obsidian-slidev-callout--TYPE class
  else neutral
```

It writes one canonical `data-callout` and one `data-callout-family`. CSS consumes the family
attribute and does not repeat the 19-type map. Re-running normalization is idempotent.
