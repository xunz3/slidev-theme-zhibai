# Quickstart: Validate Fixed Theme Visual Semantics

Use this guide to validate the implementation end to end. It is a run/review guide, not an
implementation recipe.

Normative references:

- [Implementation plan](plan.md)
- [Research decisions](research.md)
- [Data model](data-model.md)
- [Component contract](contracts/components.md)
- [Layout contract](contracts/layouts.md)
- [Generated-content contract](contracts/generated-content.md)
- [Quality-gate contract](contracts/quality-gates.md)

## Prerequisites

- Node.js `>=20.19.0`
- pnpm compatible with `pnpm-lock.yaml`
- pinned Playwright Chromium installed
- canonical project fonts available
- writable ignored `.artifacts/quality/`

From the repository root:

```bash
pnpm install --frozen-lockfile
```

Expected:

- Installation succeeds without changing `pnpm-lock.yaml`.
- No new runtime dependency is introduced for this feature.

## 1. Confirm the Quality Scope

Build duration, output size, bundle size, and navigation timing are not acceptance criteria.
The repository intentionally has no performance baseline-update command or committed raw
performance samples. Visual references, shipped-asset checks, and delayed-media geometry remain
blocking because they directly describe the rendered product.

## 2. Run Static Architecture Checks

```bash
node tests/quality/configuration.spec.mjs
node scripts/check-presentation-css.mjs
pnpm run assets:check
```

Expected:

- Existing presentation configuration and precedence remain unchanged.
- Packaged source contains no `data-quality-*`, gallery, or probe behavior selector.
- Presets do not flatten callout family markers or transform callout titles.
- Shared chrome/family roles remain frame-local.
- The public option registry drives resolution and generated callout CSS matches the TypeScript
  family registry.
- Example/build-only packages are development dependencies, the public card is packaged, and
  theme CSS performs no remote font import.
- Dead frame-chrome, normalizer/task observer, author formatter, and header-mark paths are absent.
- Ordinary list/form checkboxes are outside task normalization.
- `end`, quote `author`, and Figure `fit` are the only canonical surfaces; removed pre-1.0
  aliases have migration notes.
- Global component/content-layout CSS is loaded once, generated callout CSS has no type map,
  and hidden watermark images are not rendered.
- No unjustified shipped asset exceeds 256,000 bytes.

## 3. Build Maintained Decks

```bash
pnpm run build
pnpm run build:fixture
pnpm run build:default
pnpm run build:ucas
pnpm run build:ict
```

Expected:

- All production builds exit 0.
- Ordinary Slidev examples and generated protocol markup compile.
- Canonical public component/layout names and valid frontmatter remain accepted.
- No local fixture asset or stylesheet is missing.

## 4. Run Semantic and Geometry Contracts

```bash
node --test tests/quality/content-contracts.spec.mjs
```

Expected:

- 114/114 callout type/preset/mode cases pass with exact family geometry, family title/marker
  tone, and preserved source casing.
- 42/42 Badge tone/preset/mode cases pass.
- Badge native/textual marker-off, marker-on, authored-icon, invalid-tone, and neutral-default
  cases pass.
- Portrait/landscape Figure and both image-layout orientations prove contain versus cover
  visible extents.
- Image layouts preserve safe custom `backgroundSize` values and reject unsafe inline-style
  fragments.
- Generated/default image presentation and ready/failure states match required invariants.
- Every author card shows each distinct normalized value once; valid email actions remain.
- Inline, wrapped, block, generated, author, and closing links have one text underline and no
  persistent bottom border.
- Checked tasks are not heavier; flat prose highlights remain distinct from code/Kbd.
- Ordinary interactive checkboxes remain enabled, visible, and keyboard reachable.
- Steps/Timeline nodes, rails, ordinals, endpoints, and date/undated labels pass geometry checks.
- Canonical `end` minimal/rich closing, unframed contained logo, section brand regions, chrome role, and bilingual
  separator checks pass.

Start failures with the case ID and retained artifact referenced by the test output. Do not
update screenshots to hide a semantic/geometric failure.

## 5. Run Accessibility and Compact Checks

```bash
node --test tests/quality/accessibility.spec.mjs
```

Expected:

- Zero critical/serious Axe findings.
- Canonical 980 × 552 coverage passes in every preset/mode.
- Targeted 720 × 405 coverage passes for media, closing, compact callouts, sequences,
  bilingual headings, and UCAS/ICT section lockups.
- Valid links remain keyboard reachable with visible focus.
- Static Badge/task/sequence/highlight/brand decoration remains outside the focus order.
- No unintended clipping, overlap, horizontal slide overflow, broken image, or page/runtime
  error appears.

## 6. Run Delayed-Media Stability

```bash
node --test tests/quality/layout-stability.spec.mjs
```

Blocking expectation:

```text
target-attributed layout shifts = 0
```

Delayed public Figure, generated image, and closing-logo success/failure cases must preserve
shell, caption, message/narrative, and adjacent-region geometry.

## 7. Run the Complete Blocking Gate

```bash
pnpm run quality
```

Expected:

- Exit status 0; total duration is reported but has no acceptance threshold.
- All maintained/generated production builds pass.
- Static architecture, configuration, semantic, geometry, preset-isolation, accessibility,
  visual, asset, and layout-shift gates pass.
- Normal validation does not rewrite an approved baseline.
- `.artifacts/quality/summary.json` contains no failed, skipped, errored, or timed-out record.

Use the artifact paths in `.artifacts/quality/summary.json` for diagnosis.

## 8. Review Canonical and Compact Captures

Generate the maintained review material:

```bash
node scripts/capture-visual-review.mjs
```

Review:

- all three presets in light/dark at 980 × 552;
- targeted compact cases at 720 × 405;
- same-source contain/cover Figure and image-left/image-right pairs;
- raw generated/default media plus transparent/failing closing logos;
- all specialized callout families and compact authored titles;
- all Badge tones and marker states;
- institution/email-only author cards and all link forms;
- checked/unchecked tasks, highlights beside code/Kbd;
- Steps/Timeline zero/one/many geometry;
- minimal/rich closing, chrome strength, UCAS/ICT section lockups and header suppression,
  bilingual wrapping.

Record reviewer, date, environment, matrix, result, and any owned follow-up in:

```text
qa/fix-theme-visuals/visual-review.md
```

## 9. Approve Intentional Visual References

Only after Steps 2–8 pass, identify old references that encode the specified defects. Update
with requirement-linked review:

```bash
pnpm run quality:update-visual-baselines -- \
  --reviewer "<name>" \
  --rationale "<approved requirement-linked corrections>"
pnpm run quality
```

Expected:

- Only expected references/manifests change.
- Every replacement is listed in the visual review with its requirement IDs.
- The following normal quality run passes at zero visual tolerance and does not mutate the new
  approved references.

## 10. Validate Documentation

Using only `README.md`, verify a maintainer can author:

1. contain and cover figures;
2. image-left/image-right fit;
3. mixed-case/bilingual callouts;
4. all Badge tones with marker on/off;
5. institution-only and email-only authors;
6. Steps and Timeline;
7. minimal and logo-rich `end` closing slides.

Expected:

- Canonical surfaces are direct: `thanks` → `end`, quote `cite` → `author`, and Figure
  `backgroundSize` → `fit`.
- The removed `configs.info` footer fallback points to root/per-slide `footer` or root `title`.
- Badge additions are documented as optional.
- Kbd runtime filtering and its screen-reader “plus” separator are documented.
- Generated image/link/callout compatibility and failure behavior are explicit.
- Task/highlight, chrome/section-brand, bilingual heading, and intentional visual baseline changes
  are documented.
- The absence of build/output/navigation performance baselines is explicit.
- Maintained examples use ordinary Slidev authoring where standalone behavior is claimed.

## Completion Checklist

- [ ] Static architecture and fixture-isolation gates pass.
- [ ] All maintained decks build.
- [ ] 114 callout and 42 Badge tone cases pass.
- [ ] Media, links, authors, tasks, highlights, sequences, closing, chrome, section-brand, and
      bilingual geometry contracts pass.
- [ ] Ordinary interactive checkbox and canonical pre-1.0 API regressions pass.
- [ ] Canonical and targeted compact accessibility/overflow checks pass.
- [ ] Zero-layout-shift gates pass.
- [ ] Shipped-asset limits pass.
- [ ] Reviewed visual references are requirement-linked and immutable under normal validation.
- [ ] Canonical/compact visual review is recorded.
- [ ] README and maintained examples document the corrected behavior.
