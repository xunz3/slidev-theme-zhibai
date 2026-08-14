# Fix Theme Visual Semantics — Review Record

This record covers `specs/003-fix-theme-visuals/spec.md`. It retains decisions and final
validation outcomes; generated logs and screenshots remain under ignored `.artifacts/quality/`.

## Review Context

- Date: 2026-07-26
- Reviewer: Codex implementation review
- Canonical viewport: 980 × 552 logical pixels at DPR 2
- Compact viewport: 720 × 405 logical pixels at DPR 2
- Presets: default, ucas, ict
- Modes: light, dark
- Design direction: simple, calm, low ornament

No fixed external reviewer cohort is required. Build duration, output size, bundle size, and
navigation timing are not product requirements; their raw JSON baselines and update workflow
were removed. Exact visual references, shipped-asset checks, accessibility, maintained builds,
and delayed-media layout stability remain blocking.

## Requirement Traceability

| Surface | Requirements | Evidence | Result |
| --- | --- | --- | --- |
| Media and closing geometry | FR-001–FR-005, SC-001, SC-007, PERF-002 | Content contracts, accessibility matrix, exact visual references, delayed-media ready/failed transitions | Pass |
| Callout families | FR-008–FR-012, SC-003 | 19 types × 3 presets × 2 modes, generated-family normalization, static registry drift check | Pass |
| Links and authors | FR-006–FR-007, SC-002, SC-004 | Duplicate-value/action contracts, focus/overflow checks, exact visual references | Pass |
| Badge, Kbd, tasks, highlights | FR-013–FR-018, FR-042–FR-043, SC-005, SC-006, SC-012 | Boolean/runtime input regression, spoken separator, native/generated task isolation, code/highlight scope | Pass |
| Steps and Timeline | FR-019–FR-022, SC-006 | Zero/one/many source-order and geometry contracts, canonical/compact visual matrix | Pass |
| Theme architecture and package | FR-023–FR-041, SC-009–SC-013 | Configuration/static gates, maintained builds, package dry-run, migration notes, exact visual matrix | Pass |

## Final Review Corrections

| Finding | Resolution |
| --- | --- |
| Kbd crashed on non-string runtime values | Restored array/type guards, filtered invalid entries, and added a mixed-value fixture regression |
| Punctuation-only Kbd accessible separator | Visible `+` remains; assistive text uses the spoken word “plus” |
| `configs.info` footer fallback removal was undocumented | Added a pre-1.0 migration note pointing to root/per-slide `footer` or root `title` |
| Layout `chrome` prop types drifted | Standardized direct/internal layout props on `PresentationChrome \| boolean` |
| Image-text viewport declared ineffective `aspect-ratio` | Removed it; the explicit reserved height remains authoritative |
| Performance gate was non-blocking but retained large baselines | Removed output/navigation benchmark code, update commands, and raw performance JSON records |
| Fixed external-review cohort | Removed the survey gate and amended constitution/templates to prevent invented cohorts |
| Omitted Boolean-capable `chrome` props disabled inherited chrome | Added explicit `undefined` defaults and approved the resulting 38 code/image-text reference updates |

## Visual Baseline Governance

The approved manifest is `tests/quality/baselines/visual/manifest.json`. Each intentional
reference change records its requirement IDs, reviewer, rationale, dimensions, and hash.
Normal `pnpm run quality` must leave the manifest and PNG references unchanged.

## Final Validation

| Command | Result | Notes |
| --- | --- | --- |
| Focused configuration/content contracts | Pass | 21/21 configuration checks and 15/15 browser contracts |
| `node --test tests/quality/layout-stability.spec.mjs` | Pass | 7/7 checks, including six public/generated ready/failed transitions |
| `node --test tests/quality/assets.spec.mjs` | Pass | 7/7 checks, including the shipped-asset limit |
| Maintained production builds | Pass | 11/11 builds in the aggregate gate |
| `pnpm run quality` | Pass | 15/15 phases in 318,252 ms; performance policy recorded as `not-gated` |
| `pnpm pack --dry-run --json` | Pass | 63 allowlisted files; bundled card present; fixtures, tests, and QA excluded |
| `git diff --check` | Pass | No whitespace errors |

## Skips and Follow-up

No required gate was skipped. Build duration, output size, bundle size, and navigation timing are
explicitly outside the product requirements rather than skipped release checks.

## Approval

Approved after the final review corrections and complete quality revalidation.

## 2026-08-14 Review Follow-up

The follow-up review of the intro, statement, and preset-branding surfaces is resolved.

| Finding | Resolution |
| --- | --- |
| Intro slides lost their display-title hierarchy | Restored the 4.15rem intro heading treatment and a 3rem compact treatment, with a browser regression comparing intro and content title scale |
| Section lockups could collide with enabled header chrome | Made section lockups header-aware and omit them when the header is present; the watermark remains as the sole branded image |
| Compact section branding inherited desktop placement | Added section-specific compact placement and size rules for the UCAS and ICT lockups |
| Dark mode changed ceremonial section identity | Kept section fields, lockups, and watermark opacity mode-stable; dark-mode filtering now applies only where cover treatment requires it |
| Statement slides reserved unused inline-end space | Removed the preset-specific statement padding and obsolete statement watermark rules |
| UCAS section rendered mutually exclusive light/dark wordmarks | Rendered only the white section wordmark actually used by the ceremonial field |
| Reviewed visual references predated the visual hierarchy changes | Recaptured and integrity-recorded all 350 DPR-2 scenarios, including 12 new section/header scenarios |
| Public documentation exposed an unused brand-safe token | Removed the token and aligned README, contracts, plan, research, tasks, quickstart, data model, and specification with the layout-owned section safe region |
| Brand collision checks could pass without a brand mark | Required the mark for branded presets, sampled multiple visible points, and asserted no mark/content or mark/header intersections |
| Section branding lacked direct visual coverage | Added canonical and compact, light and dark, default/UCAS/ICT section cases with and without header chrome |
| Protected-brand assertions only checked empty arrays | Added exact lockup/watermark pixel and computed-style comparisons across local and fallback accents, plus expected image counts and opacity |

The preset-isolation fixture now uses language-neutral code highlighting so concurrent Shiki
tokenization cannot introduce unrelated pixel variance. The standalone-shell diagnostic also
records local HTTP failures by URL while ignoring URL-less console noise from optional external
Slidev resources.

### Follow-up Validation

| Command | Result | Notes |
| --- | --- | --- |
| `node tests/quality/preset-isolation.spec.mjs` | Pass | 28/28 checks |
| `node tests/quality/content-contracts.spec.mjs` | Pass | 15/15 checks |
| `node tests/quality/accessibility.spec.mjs` | Pass | 403/403 checks |
| `pnpm run quality:update-visual-baselines` | Pass | 350 reviewed scenarios refreshed in 260,859 ms |
| `pnpm run quality` | Pass | Complete aggregate gate in 421,129 ms; accessibility, visual, content contracts, builds, preset isolation, and static checks all pass |
