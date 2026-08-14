# Quality Gate Contract: Fix Theme Visual Semantics

Correctness, accessibility, layout stability, and shipped-asset gates are blocking unless a
skip records reason, owner, and follow-up. Build duration, output growth, bundle size, and
navigation timing are outside this feature's gate. Approved screenshots are evidence, not
authority over a semantic/geometric requirement.

## Environments

| Environment | Value |
| --- | --- |
| Browser | Pinned Playwright Chromium |
| Canonical viewport | 980 × 552 logical pixels, DPR 2 |
| Compact viewport | 720 × 405 logical pixels, DPR 2 |
| Presets | default, ucas, ict |
| Modes | light, dark |

The canonical matrix covers every affected semantic surface in every preset/mode. The compact
matrix is targeted to collision/wrapping/geometry risks and does not duplicate every exact
visual reference.

## Fixture Contract

Extend existing build families:

- `fixtures/expanded-content.md`: public components/layouts and semantic comparison cases;
- `fixtures/obsidian-protocol.md`: direct generated markup;
- maintained preset/example decks: end-to-end public documentation examples.

Keep deterministic local assets under `fixtures/public/author-fixtures/`:

- portrait geometry with labeled corners/edges;
- landscape geometry with labeled corners/edges;
- transparent unusually wide/tall closing logo variants.

Assets remain small, local, deterministic, and excluded from the shipped theme package.

Move fixture-only composition to `fixtures/expanded-content.css`; generation/build helpers copy
or resolve it alongside generated preset decks. Preserve existing stable case markers and slide
numbers where practical; append missing cases rather than creating another three-build family.

## Performance Scope

Do not create or retain output-size, bundle-size, navigation-timing, p95, or raw performance
sample baselines for this feature. There is no performance baseline-update command. Stable
geometry after delayed theme-owned media transitions remains a correctness requirement.

## Static Architecture and Isolation Gate

`scripts/check-presentation-css.mjs` or an equivalent source test must fail when packaged
`components/`, `internals/`, `layouts/`, `setup/`, or `styles/` contains:

- a `data-quality-*` behavior selector;
- gallery/probe/quality-only presentation selectors;
- preset-specific redefinitions of specialized callout marker geometry;
- a preset-wide callout title casing transform;
- duplicated family state logic that bypasses `setup/callouts.ts`;
- a new converter/parser responsibility.

It also verifies:

- `Badge` props are additive and typed;
- shared frame-local `--presentation-chrome-accent` ownership;
- package runtime dependencies exclude example/build-only tools;
- packaged files include the documented public card asset;
- no remote font import duplicates the Slidev font configuration;
- no dead frame-chrome probe, unused normalizer registration, task observer, author formatter,
  or non-rendered header-mark selector remains;
- generated callout CSS family mappings match the canonical TypeScript registry;
- no runtime dependency or shipped asset was added without review;
- fixture CSS is excluded by `package.json.files`.
- component/content-layout CSS is imported exactly once by `styles/index.ts`;
- no Vue component injects an unscoped global `<style src>`;
- canonical `end`, quote `author`, and Figure `fit` surfaces have no retained compatibility-only
  alias/input;
- no hidden-by-default preset watermark image is rendered;
- `package.json.files`, rather than a duplicate `.npmignore`, is the publication allowlist;
- source invariants do not approximate nested CSS parsing or enforce unrelated dependency
  versions.

## Callout Matrix

Required total:

```text
19 types × 3 presets × 2 modes = 114 passing cases
```

Each case verifies:

- canonical type/class and family resolution;
- labelled note semantics and source-order body;
- exact marker family geometry:
  - positive diamond;
  - caution triangle;
  - danger square;
  - question ring;
  - quotation bar;
- title and marker resolve to the same family carrier;
- specialized family carrier is not weaker than neutral;
- title/marker contrast passes the project threshold;
- title text/casing equals the authored/default source string;
- no family flattening after preset CSS;
- no overflow in its maintained density.

Separate cases cover neutral, empty, unsupported, case-normalized, long mixed-case, acronym,
CJK, and generated canonical-class fallback inputs.

Generated cases additionally assert that normalization writes canonical `data-callout` and
`data-callout-family`, and that shared CSS contains no per-type family selector groups.

## Badge Matrix

Required tone total:

```text
7 tones × 3 presets × 2 modes = 42 passing tone cases
```

Each verifies canonical tone normalization, readable palette, visible wording, static
non-focusable semantics, and distinction from Tag/code/Kbd.

Additional cases in every preset/mode:

- omitted tone → neutral;
- unsupported tone → neutral;
- marker omitted/native false/`"false"`/`"off"`/invalid → no generated marker;
- marker native true/`"true"`/`"on"` → exactly one decorative family marker;
- authored icon with marker off → no duplicate dot;
- authored icon with marker on → one requested marker plus unchanged slot content;
- long/bilingual content → no unintended overflow.

## Media Geometry and State Gate

For portrait and landscape geometric sources:

- compare the same source and same viewport under contain/cover;
- verify image layouts preserve safe custom CSS sizes such as `80%` and `auto 72%`;
- run public Figure and both image/text orientations;
- run every preset/mode at canonical size;
- run representative cases at compact size.

Assertions:

- computed fit equals authored fit;
- custom image-layout size equals the sanitized authored value and keeps the image alternative;
- aspect ratio is preserved;
- contain exposes all labeled corners/edges and permits letterbox area;
- cover fills all viewport edges and crops only expected overflow markers;
- unequal ratios produce different visible extents;
- viewport/caption/adjacent geometry is stable before and after decode;
- no broken image remains after failure;
- meaningful fallback and decorative behavior match the alternative contract.

Generated image cases additionally verify default containment, reserved size, state/fallback,
caption placement, and component/generated invariants without requiring identical DOM.

### Delayed media

Intercept local requests for:

- public Figure;
- generated image figure;
- closing logo.

For success and failure:

1. reveal the target slide before fulfilling/rejecting the request;
2. record frame, shell, caption, and adjacent-region bounds;
3. complete/fail the request;
4. require unchanged surrounding geometry and zero target-attributed layout-shift entry.

## Link and Author Gate

Link forms:

- inline;
- wrapped;
- block-level;
- generated `.obsidian-slidev-link`;
- author-card email;
- closing contact;
- focus-visible state.

Each persistent state has:

- exactly one `text-decoration-line: underline`;
- `border-bottom-width: 0`;
- no pseudo/container-width duplicate;
- glyph-bounded wrapped decoration;
- existing href/action and source order.

Focus-visible must retain a contrast-valid outline in all preset/modes.

Author forms:

- complete;
- name-only;
- institution-only;
- valid-email-only;
- invalid-email-only;
- whitespace-normalized equal values;
- mixed collections;
- intentional duplicate records.

For each card, count each distinct normalized string exactly once. Every retained valid email
has exactly one actionable link. Collection order and footer/cover primary labels remain stable.

## Task and Highlight Gate

Tasks:

- checked and unchecked, nested, wrapped, native, generated;
- inputs remain disabled/non-focusable and immutable;
- checked computed weight is not greater than unchecked;
- checked text uses a readable muted role;
- unchecked nested item beneath checked parent restores primary emphasis;
- empty box versus checked box/checkmark remains visible without hue.
- an ordinary interactive HTML checkbox outside recognized task-list contexts remains enabled,
  visible, pointer-operable, and in the normal tab order.

Highlights:

- native/generated prose fingerprints match;
- background is non-transparent warm wash;
- border widths are zero;
- radius is zero;
- box shadow is none;
- wrapped line fragments stay covered;
- adjacent link, inline code, and Kbd fingerprints remain materially distinct;
- all highlight presentation resets inside `pre` and `code`.

Existing tests that require an automatic Badge dot, a different/heavier checked weight, or a
highlight border must be replaced rather than preserved.

## Steps and Timeline Geometry Gate

Zero, one, two, many, long, wrapped, bilingual, dated, and undated cases verify:

- ordered source/DOM text remains unchanged;
- Steps node text follows authored list numbering;
- Steps node center equals connector x-axis;
- each segment begins/ends at adjacent node centers within pixel tolerance;
- no segment exists before first/after last;
- Timeline visual marker text/ordinal is absent;
- exactly one chronological rail is visible;
- item/card left border does not create a second rail;
- dated `<time>` and undated leading `<strong>` containers share left edge, baseline, padding,
  border, and shape;
- zero/one cases have no orphan connector.

Decoration is ignored by accessibility APIs; the `<ol>` remains.

## Closing, Chrome, Safe-Zone, and Heading Gate

Closing cases:

- canonical `end` structure and absence of the removed `thanks` alias;
- minimal short message centered on both axes;
- contact/authors/logo rich composition with logical DOM order;
- transparent, tall, wide, decorative, delayed, and failed logos;
- logo has contain fit and zero Figure tray border/background/shadow;
- maximum supported author cards remain balanced at canonical/compact size.

Chrome cases:

- header/footer, `th`, ordinary list markers, and preset footer cap resolve the same
  frame-local secondary role within preset/mode;
- semantic callout carrier remains measurably stronger where expected;
- local accent/preset isolation still passes.

Safe-zone cases:

- top-right heading, Figure, caption, link, and control probes do not intersect UCAS/ICT mark
  bounds;
- cover/header variants do not reserve duplicate space;
- no protected brand asset pixels or geometry change.

Bilingual heading cases:

- constrain English/CJK headings containing spaced U+00B7 at canonical and compact widths;
- use DOM Range line coordinates to prove separator and preceding token share a line;
- require equivalent accessible/copied wording after whitespace normalization;
- require idempotence and zero post-visibility layout shift.

## Accessibility and Overflow Gate

Run Axe and explicit browser checks over representative affected cases for three presets and
two modes at canonical size, plus the compact risk subset.

Required:

- zero critical or serious Axe findings;
- contrast-valid callout/Badge/task/highlight/link states;
- non-color semantic cues;
- meaningful image/logo alternatives and decorative exclusion;
- valid email/contact focus order and visible focus;
- no Badge, task decoration, sequence node, highlight, keycap, or brand mark focus target;
- logical heading/list/closing order;
- zero unintended canvas/frame/content overflow, clipping, or overlap;
- no page error, console error, broken local request, or unhandled observer loop.

Axe does not replace explicit family, geometry, duplicate-value, relative-emphasis, or
source-order assertions.

## Exact Visual Gate

Retain the pinned Chromium/DPR-2 exact-pixel implementation and zero-tolerance manifest.

Order:

1. semantic, geometry, focus, accessibility, and layout-stability assertions pass;
2. produce canonical/compact review captures and contact sheets;
3. identify only references whose old pixels encode a specified correction;
4. update with reviewer/rationale;
5. run normal quality and require baseline immutability.

Update command:

```bash
pnpm run quality:update-visual-baselines -- \
  --reviewer "<name>" \
  --rationale "<requirement-linked intentional correction>"
pnpm run quality
```

The review record maps every replaced/new reference to requirement IDs and reports unexpected
pixel changes as failures.

## Layout-Shift Gate

The blocking contract is:

```text
target-attributed layout shifts = 0
```

Normal quality runs the deterministic delayed ready/failed media transitions that exercise this
contract for public Figure, closing-logo, and generated-image states. The test compares reserved
geometry before and after the delayed request resolves or fails and observes target-attributed
layout-shift entries.

## Asset Gate

The blocking asset contract remains: no new individual shipped theme asset may exceed 256,000 bytes without documented
justification. Test-only author fixtures live under `fixtures/public/`, are excluded from the
npm package, and remain small.

## Visual Review Evidence

Record canonical all-preset/mode visual review plus targeted compact review in
`qa/fix-theme-visuals/visual-review.md`.

The record maps each corrected surface to requirements, commands, exact references, and any
owned follow-up. No fixed reviewer count, external human cohort, or separate first-pass survey
is required.

## Documentation Gate

`README.md` documents:

- contain/cover geometry and defaults;
- generated/default image equivalence and failure behavior;
- dedicated unframed closing logo and centered minimal closing;
- single link underline plus focus;
- distinct-once author fallback/actionability;
- invariant callout family markers/title tone and casing preservation;
- Badge tones and marker default/options;
- Steps versus Timeline;
- checked-task emphasis and flat highlights;
- chrome accent, section brand regions, bilingual heading behavior;
- runtime-safe and screen-reader-readable Kbd key sequences;
- expected intentional visual baseline changes and the direct pre-1.0 migration replacements,
  including removal of the undocumented `configs.info` footer fallback;
- the intentional absence of build/output/navigation performance gates and raw baselines.

Maintained example/preset decks demonstrate the corrected public behavior with no conversion
addon where standalone authoring is claimed.

## Blocking Commands

Complete gate:

```bash
pnpm run quality
```

Focused diagnosis:

```bash
pnpm run build
pnpm run build:fixture
pnpm run build:default
pnpm run build:ucas
pnpm run build:ict
node --test tests/quality/content-contracts.spec.mjs
node --test tests/quality/accessibility.spec.mjs
node --test tests/quality/layout-stability.spec.mjs
node --test tests/quality/visual.spec.mjs
node tests/quality/configuration.spec.mjs
node scripts/check-presentation-css.mjs
pnpm run assets:check
git diff --check
```

Expected completion: all commands relevant to the change exit 0; `pnpm run quality` records no
failed, skipped, timed-out, or baseline-mutating gate.
