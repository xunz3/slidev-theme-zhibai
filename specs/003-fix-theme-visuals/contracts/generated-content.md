# Generated Content Contract Corrections

This contract defines how the theme renders existing `.obsidian-slidev-*` markup. It does not
change what `obsidian-slidev` parses or converts.

## Boundary

- `obsidian-slidev` owns Obsidian syntax parsing, path resolution, and semantic markup emission.
- The theme owns presentation, semantic-family styling, bounded media state, focus visuals,
  task presentation state, and failure rendering.
- Existing generated class names remain accepted.
- Theme runtime enhancement is idempotent, subtree-scoped, and does not rewrite source Markdown.
- No converter update is required to receive corrected defaults.

## Generated Callouts

Existing canonical input remains:

```html
<div
  class="obsidian-slidev-callout obsidian-slidev-callout--warning"
  data-callout="warning"
>
  <div class="obsidian-slidev-callout__title">Authored title</div>
  <div class="obsidian-slidev-callout__content">...</div>
</div>
```

Rules:

- Canonical modifier classes and `data-callout` values resolve through the same
  19-type/seven-family registry as `Callout`.
- Runtime normalization writes canonical `data-callout` and `data-callout-family` attributes;
  authored `data-callout-family` does not override the registry.
- Shared CSS consumes `data-callout-family` only and contains no parallel type-to-family map.
- Specialized families retain diamond/triangle/square/ring/bar markers in every preset/mode.
- The visible title text is not transformed or re-cased by a preset.
- Generated title/body order and authored formatting remain unchanged.
- Neutral generated markup without a supported type uses neutral presentation.

Component/generated equivalence means semantic family, marker geometry, title tone, contrast,
spacing role, and fallback behavior; it does not require byte-identical DOM.

## Generated Image Figures

Existing direct generated markup remains valid:

```html
<figure class="obsidian-slidev-media obsidian-slidev-media--image">
  <img
    class="obsidian-slidev-media__image obsidian-slidev-media__asset"
    src="..."
    alt="..."
  >
  <figcaption class="obsidian-slidev-media__caption">...</figcaption>
</figure>
```

An optional `data-media-fit="contain|cover"` on the figure is accepted. Omitted/unsupported fit
uses `contain`; existing converter output need not add it.

On an ordinary, non-`figure` layout, an authored advanced figure class may opt a generated image
into a theme-local composition:

```text
obsidian-slidev-media--figure-centered
obsidian-slidev-media--figure-stage
obsidian-slidev-media--figure-minimal
obsidian-slidev-media--figure-editorial
```

The producer already preserves advanced figure classes, so no parser change is required. These
classes are presentation extensions rather than additions to the immutable core 1.0.0 media
contract. Full-slide composition continues to use `layout: figure` plus `figureVariant`.

### CSS-first geometry

Before runtime enhancement:

- The direct image region reserves the shared image-figure viewport size.
- Image width/height and `object-fit` use the resolved fit.
- Caption position and outer figure size match the public Figure vocabulary.
- Delayed image decode cannot move the caption or adjacent slide content.

### Runtime enhancement

The renderer targets only a direct image figure that:

- has `.obsidian-slidev-media--image`;
- has a direct canonical image asset;
- lacks the public Figure viewport/managed-state marker.

It then:

1. records pending state;
2. listens idempotently for ready/failure;
3. records ready state after successful load/decode;
4. on failure, hides/removes the broken visual and renders one stable meaningful fallback from
   the existing `alt`;
5. keeps explicit decorative `alt=""` unnamed and free of fallback wording.

The enhancer:

- does not reparent the image;
- does not touch video, audio, YouTube, or other non-image media;
- does not double-manage Vue Figure output;
- does not create a focus target;
- does not trigger an observer loop;
- cleans up listeners/state when its root is unmounted.

### Equivalence

For the same source, alternative, caption, and default fit, public and generated figures share:

- default containment;
- bounded/reserved sizing;
- aspect-ratio behavior;
- ready/failure state vocabulary;
- meaningful fallback;
- caption typography/placement;
- zero post-visibility layout shift.

Internal markup may differ because the public Figure owns a viewport component while generated
legacy markup remains direct.

## Generated Links

Existing `.obsidian-slidev-link` anchors remain ordinary actionable anchors.

Persistent contract:

```text
color + one text underline + zero bottom border
```

State contract:

- hover may strengthen color/underline color but cannot add a border rule;
- focus-visible adds the shared outline and may adjust underline color;
- wrapped and block-level anchors underline glyphs, not the container width;
- links remain keyboard reachable in source order.

The theme explicitly resets the dashed bottom border inherited from Slidev's base layout CSS.

## Generated Tasks

Existing `.obsidian-slidev-task-list`, `.obsidian-slidev-task-list-item`,
`.task-list-item`, and checkbox inputs remain accepted.

- The existing idempotent normalizer preserves `checked`, disables the input, removes it from
  tab order, and adds presentation classes.
- Eligibility is limited to recognized `.task-list-item`, `.contains-task-list`, and
  `.obsidian-slidev-task-list` contexts. An ordinary checkbox in slide HTML remains
  interactive.
- Checked generated tasks use the same muted/non-heavy label state and explicit checkmark as
  native Markdown tasks.
- Nested unfinished generated tasks reset to primary emphasis.
- No conversion/parser behavior or task persistence is added.

## Generated Highlights

Existing `.obsidian-slidev-highlight` remains accepted.

- In prose, it matches native `<mark>`: warm flat wash, no border/radius/shadow.
- In `pre` or `code`, it receives no prose treatment.
- Literal `==...==` remains untouched; the theme does not add a Markdown parser.

## Production/Fixture Isolation

The distributed theme must not depend on:

- `[data-quality-case]` or any `data-quality-*` selector;
- `.presentation-callout-gallery`;
- `.presentation-figure-gallery`;
- `.presentation-accent-probe`;
- `.presentation-label-gallery`;
- screenshot labels, probe marks, or baseline-only helpers.

Fixture composition lives in excluded fixture CSS. Production components may contain a real
semantic/internal wrapper used by tests, but its behavior cannot depend on a quality marker.
A static source gate scans packaged component, internal, layout, setup, and style paths.

## Protocol Fixture Requirements

`fixtures/obsidian-protocol.md` must include:

- generated callout representatives for all specialized family fallbacks;
- ready, delayed, decorative, and failed generated image figures;
- an equivalent public/generated default-contain pair;
- inline, wrapped, and block `.obsidian-slidev-link` cases;
- checked/unchecked generated tasks;
- generated prose/code-scope highlights.

These cases run in production-built output. Generated image/callout equivalence is checked in
all presets and supported modes; representative generated accessibility/overflow checks also
run at the compact viewport.
