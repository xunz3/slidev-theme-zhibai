import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { chromium } from 'playwright-chromium'
import {
  buildDeck,
  generateExpandedContentBuilds,
  generatePresetMatrixBuilds,
  qualityArtifactRoot,
  readQualityBuildContext,
  repositoryRoot,
  startStaticServer,
  waitForSlide,
} from './helpers.mjs'

const execFileAsync = promisify(execFile)

const calloutFamiliesForVisual = () => [
  { caseId: 'us1-callouts-info', family: 'info', slide: 3 },
  { caseId: 'us1-callouts-positive', family: 'positive', slide: 4 },
  { caseId: 'us1-callouts-caution', family: 'caution', slide: 5 },
  { caseId: 'us1-callouts-danger', family: 'danger', slide: 6 },
  { caseId: 'us1-callouts-question', family: 'question', slide: 7 },
  { caseId: 'us1-callouts-quotation', family: 'quotation', slide: 8 },
]

export const visualBaselineDirectory = resolve(
  repositoryRoot,
  'tests/quality/baselines/visual/slides',
)
export const visualBaselineManifestPath = resolve(
  repositoryRoot,
  'tests/quality/baselines/visual/manifest.json',
)

const modes = ['light', 'dark']
const presetScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.map(mode => ({
    buildId: `matrix-${preset}`,
    caseId: `baseline-${preset}`,
    coverage: ['preset', 'chrome'],
    id: `preset-${preset}-${mode}`,
    mode,
    preset,
    slide: 2,
  }))
))
const layoutSlides = {
  default: { caseId: 'invalid-inputs', slide: 6 },
  cover: { caseId: 'layout-cover', slide: 8 },
  intro: { caseId: 'layout-intro', slide: 9 },
  section: { caseId: 'layout-section', slide: 10 },
  toc: { caseId: 'layout-toc', slide: 11 },
  center: { caseId: 'layout-center', slide: 12 },
  'two-cols': { caseId: 'layout-two-cols', slide: 13 },
  statement: { caseId: 'layout-statement', slide: 14 },
  quote: { caseId: 'layout-quote', slide: 15 },
  figure: { caseId: 'layout-figure', slide: 16 },
  references: { caseId: 'layout-references', slide: 17 },
}
const layoutScenarios = Object.entries(layoutSlides).flatMap(([layout, definition]) => (
  modes.map(mode => ({
    buildId: 'matrix-default',
    coverage: ['layout'],
    id: `layout-${layout}-${mode}`,
    layout,
    mode,
    preset: 'default',
    ...definition,
  }))
))
const chromeScenarios = modes.map(mode => ({
  buildId: 'matrix-default',
  caseId: 'textual-booleans',
  coverage: ['chrome', 'textual-booleans'],
  id: `chrome-textual-booleans-${mode}`,
  mode,
  preset: 'default',
  slide: 7,
}))
const protocolScenarios = modes.map(mode => ({
  buildId: 'protocol',
  caseId: null,
  coverage: ['generated-protocol'],
  id: `protocol-generated-callouts-${mode}`,
  mode,
  preset: 'default',
  slide: 5,
}))
const us1CalloutScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  calloutFamiliesForVisual().flatMap(definition => (
    modes.map(mode => ({
      buildId: `expanded-${preset}`,
      caseId: definition.caseId,
      coverage: ['FR-008', 'FR-009', 'FR-010', 'callout', definition.family],
      id: `visual-callout-${definition.family}-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-008', 'FR-009', 'FR-010', 'SC-003'],
      slide: definition.slide,
    }))
  ))
))
const correctedCalloutScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us1-callout-fallbacks',
      coverage: ['FR-008', 'FR-011', 'callout', 'neutral', 'fallback'],
      id: `visual-callout-neutral-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-008', 'FR-011', 'SC-003'],
      slide: 9,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-callout-authored-compact',
      coverage: ['FR-010', 'FR-012', 'callout', 'authored-casing', 'compact'],
      id: `visual-callout-authored-compact-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-010', 'FR-012', 'SC-003'],
      slide: 52,
    },
  ])
))
const generatedCalloutScenarios = modes.map(mode => ({
  buildId: 'protocol',
  caseId: 'protocol-callout-families',
  coverage: ['FR-008', 'FR-009', 'FR-010', 'generated', 'callout'],
  id: `visual-callout-generated-${mode}`,
  mode,
  preset: 'default',
  requirementIds: ['FR-008', 'FR-009', 'FR-010', 'SC-003'],
  slide: 25,
}))
const us1SurfaceScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us1-figures-alternatives',
      coverage: ['us1', 'figure'],
      id: `us1-figure-${preset}-${mode}`,
      mode,
      preset,
      slide: 11,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us1-authors-mixed',
      coverage: ['FR-007', 'authors', 'complete', 'fallback', 'duplicates'],
      id: `us1-authors-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-007', 'SC-002', 'SC-004'],
      slide: 13,
    },
  ])
))
const correctedLinkScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.map(mode => ({
    buildId: `expanded-${preset}`,
    caseId: 'visual-links-authors',
    coverage: ['FR-006', 'FR-007', 'inline', 'wrapped', 'block', 'authors'],
    id: `visual-links-authors-${preset}-${mode}`,
    mode,
    preset,
    requirementIds: ['FR-006', 'FR-007', 'SC-002', 'SC-004'],
    slide: 53,
  }))
))
const generatedLinkScenarios = modes.map(mode => ({
  buildId: 'protocol',
  caseId: 'protocol-link-forms',
  coverage: ['FR-006', 'generated', 'inline', 'wrapped', 'block'],
  id: `visual-links-generated-${mode}`,
  mode,
  preset: 'default',
  requirementIds: ['FR-006', 'SC-002'],
  slide: 28,
}))
const correctedMediaScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-media-figure-fits',
      coverage: ['FR-001', 'FR-002', 'FR-003', 'figure', 'same-source'],
      id: `visual-media-figure-fits-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-001', 'FR-002', 'FR-003', 'SC-001'],
      slide: 45,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-image-left-contain',
      coverage: ['FR-004', 'image-left', 'contain'],
      id: `visual-image-left-contain-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-004', 'SC-001'],
      slide: 46,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-image-right-contain',
      coverage: ['FR-004', 'image-right', 'contain'],
      id: `visual-image-right-contain-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-004', 'SC-001'],
      slide: 48,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-closing-logo-wide',
      coverage: ['FR-005', 'closing-logo', 'transparent', 'wide'],
      id: `visual-closing-logo-wide-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-005', 'SC-007'],
      slide: 50,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-closing-logo-tall',
      coverage: ['FR-005', 'closing-logo', 'transparent', 'tall'],
      id: `visual-closing-logo-tall-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-005', 'SC-007'],
      slide: 51,
    },
  ])
))
const figureVariantScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'figure-variant-stage',
      coverage: ['figure-layout', 'stage', 'responsive'],
      id: `figure-variant-stage-${preset}-${mode}`,
      mode,
      preset,
      slide: 62,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'figure-variant-minimal',
      coverage: ['figure-layout', 'minimal', 'transparent-tray'],
      id: `figure-variant-minimal-${preset}-${mode}`,
      mode,
      preset,
      slide: 63,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'figure-variant-editorial',
      coverage: ['figure-layout', 'editorial', 'caption-rail'],
      id: `figure-variant-editorial-${preset}-${mode}`,
      mode,
      preset,
      slide: 64,
    },
  ])
))
const us2SurfaceScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us2-closing-metadata',
      coverage: ['FR-006', 'FR-007', 'closing', 'contact', 'authors'],
      id: `us2-closing-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-006', 'FR-007', 'SC-002', 'SC-004'],
      slide: 16,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us2-image-left',
      coverage: ['us2', 'image-text', 'left'],
      id: `us2-image-left-${preset}-${mode}`,
      mode,
      preset,
      slide: 20,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us2-image-right',
      coverage: ['us2', 'image-text', 'right'],
      id: `us2-image-right-${preset}-${mode}`,
      mode,
      preset,
      slide: 21,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us2-image-bilingual',
      coverage: ['us2', 'image-text', 'long', 'bilingual'],
      id: `us2-image-bilingual-${preset}-${mode}`,
      mode,
      preset,
      slide: 25,
    },
  ])
))
const us2ClosingScenarios = ['end', 'thanks'].flatMap((caseName, index) => (
  modes.map(mode => ({
    buildId: 'expanded-default',
    caseId: `us2-${caseName}-minimal`,
    coverage: ['us2', 'closing', 'minimal'],
    id: `us2-${caseName}-${mode}`,
    layout: 'end',
    mode,
    preset: 'default',
    slide: 14 + index,
  }))
))
const us3AccentScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us3-accent-local-a',
      coverage: ['us3', 'accent', 'local', 'protected-brand'],
      id: `us3-accent-local-a-${preset}-${mode}`,
      mode,
      preset,
      slide: 26,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us3-accent-unaccented',
      coverage: ['us3', 'accent', 'deck-fallback', 'leakage'],
      id: `us3-accent-fallback-${preset}-${mode}`,
      mode,
      preset,
      slide: 27,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us3-accent-invalid',
      coverage: ['us3', 'accent', 'invalid-fallback'],
      id: `us3-accent-invalid-${preset}-${mode}`,
      mode,
      preset,
      slide: 29,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us3-accent-local-b',
      coverage: ['us3', 'accent', 'second-local', 'leakage'],
      id: `us3-accent-local-b-${preset}-${mode}`,
      mode,
      preset,
      slide: 30,
    },
  ])
))
const us4TechnicalScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-code-titled',
      coverage: ['us4', 'code', 'long-line', 'annotations'],
      id: `us4-code-${preset}-${mode}`,
      mode,
      preset,
      slide: 32,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-steps-many',
      coverage: ['us4', 'steps', 'many', 'bilingual'],
      id: `us4-steps-${preset}-${mode}`,
      mode,
      preset,
      slide: 36,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-timeline-many',
      coverage: ['us4', 'timeline', 'dated', 'bilingual'],
      id: `us4-timeline-${preset}-${mode}`,
      mode,
      preset,
      slide: 39,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-status-labels',
      coverage: ['us4', 'tag', 'badge', 'non-color', 'bilingual'],
      id: `us4-status-${preset}-${mode}`,
      mode,
      preset,
      slide: 40,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-keyboard',
      coverage: ['us4', 'kbd', 'chord', 'symbols', 'bilingual'],
      id: `us4-keyboard-${preset}-${mode}`,
      mode,
      preset,
      slide: 41,
    },
  ])
))
const us4TitlelessCodeScenarios = modes.map(mode => ({
  buildId: 'expanded-default',
  caseId: 'us4-code-titleless',
  coverage: ['us4', 'code', 'missing-title', 'long-file'],
  id: `us4-code-titleless-${mode}`,
  mode,
  preset: 'default',
  slide: 33,
}))
const correctedBadgeScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.map(mode => ({
    buildId: `expanded-${preset}`,
    caseId: 'visual-badge-matrix',
    coverage: ['FR-014', 'FR-015', 'FR-016', 'badge', 'tone', 'marker'],
    id: `visual-badge-matrix-${preset}-${mode}`,
    mode,
    preset,
    requirementIds: ['FR-014', 'FR-015', 'FR-016', 'SC-005'],
    slide: 54,
  }))
))
const us5ReadingCueScenarios = ['default', 'ucas', 'ict'].flatMap(preset => (
  modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us5-tasks-native',
      coverage: ['FR-013', 'tasks', 'checked', 'unchecked', 'nested', 'wrapped'],
      id: `us5-tasks-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-013', 'SC-006'],
      slide: 42,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us5-highlights',
      coverage: ['FR-017', 'FR-018', 'highlight', 'native', 'generated', 'code-scope'],
      id: `us5-highlights-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-017', 'FR-018', 'SC-006'],
      slide: 44,
    },
  ])
))
const us5GeneratedTaskScenarios = modes.map(mode => ({
  buildId: 'expanded-default',
  caseId: 'us5-tasks-generated',
  coverage: ['FR-013', 'tasks', 'generated-compatibility'],
  id: `us5-tasks-generated-${mode}`,
  mode,
  preset: 'default',
  requirementIds: ['FR-013', 'SC-006'],
  slide: 43,
}))
const generatedStatusHighlightScenarios = modes.map(mode => ({
  buildId: 'protocol',
  caseId: 'protocol-task-highlight-scope',
  coverage: ['FR-013', 'FR-017', 'FR-018', 'generated', 'tasks', 'highlight'],
  id: `visual-generated-task-highlight-${mode}`,
  mode,
  preset: 'default',
  requirementIds: ['FR-013', 'FR-017', 'FR-018', 'SC-006'],
  slide: 29,
}))
const correctedSequenceScenarios = ['default', 'ucas', 'ict'].flatMap(
  preset => modes.flatMap(mode => [
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-steps-zero',
      coverage: ['FR-019', 'FR-022', 'steps', 'zero'],
      id: `visual-steps-zero-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-019', 'FR-022', 'SC-006'],
      slide: 34,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-steps-one',
      coverage: ['FR-019', 'FR-022', 'steps', 'one'],
      id: `visual-steps-one-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-019', 'FR-022', 'SC-006'],
      slide: 35,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-steps-many',
      coverage: ['FR-019', 'FR-022', 'steps', 'many', 'wrapped', 'bilingual'],
      id: `visual-steps-many-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-019', 'FR-022', 'SC-006'],
      slide: 36,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-timeline-zero',
      coverage: ['FR-020', 'FR-022', 'timeline', 'zero'],
      id: `visual-timeline-zero-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-020', 'FR-022', 'SC-006'],
      slide: 37,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-timeline-one',
      coverage: ['FR-020', 'FR-021', 'FR-022', 'timeline', 'one', 'undated'],
      id: `visual-timeline-one-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-020', 'FR-021', 'FR-022', 'SC-006'],
      slide: 38,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'us4-timeline-many',
      coverage: ['FR-020', 'FR-021', 'FR-022', 'timeline', 'many', 'dated', 'undated', 'bilingual'],
      id: `visual-timeline-many-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-020', 'FR-021', 'FR-022', 'SC-006'],
      slide: 39,
    },
    {
      buildId: `expanded-${preset}`,
      caseId: 'visual-sequences-custom',
      coverage: ['FR-019', 'FR-020', 'FR-021', 'FR-022', 'authored-numbering', 'plain-fallback'],
      id: `visual-sequences-custom-${preset}-${mode}`,
      mode,
      preset,
      requirementIds: ['FR-019', 'FR-020', 'FR-021', 'FR-022', 'SC-006'],
      slide: 55,
    },
  ]),
)
const coherentCanonicalDefinitions = [
  {
    caseId: 'us2-end-minimal',
    coverage: ['FR-023', 'closing', 'minimal'],
    id: 'closing-minimal',
    requirementIds: ['FR-023', 'SC-007'],
    slide: 14,
  },
  {
    caseId: 'us2-closing-metadata',
    coverage: ['FR-005', 'FR-023', 'closing', 'rich'],
    id: 'closing-rich',
    requirementIds: ['FR-005', 'FR-023', 'SC-007'],
    slide: 16,
  },
  {
    caseId: 'visual-chrome-safe-zone',
    coverage: ['FR-024', 'chrome', 'header', 'footer', 'table', 'list'],
    id: 'chrome',
    requirementIds: ['FR-024', 'SC-007'],
    slide: 56,
  },
  {
    caseId: 'visual-brand-collision',
    coverage: ['FR-025', 'section-brand', 'lockup', 'watermark', 'heading', 'figure', 'caption', 'link', 'control'],
    id: 'brand-safe-zone',
    requirementIds: ['FR-025', 'SC-007'],
    slide: 58,
  },
  {
    caseId: 'visual-section-header',
    coverage: ['FR-025', 'section-brand', 'header', 'lockup-suppression', 'watermark'],
    id: 'section-header',
    requirementIds: ['FR-025', 'SC-007'],
    slide: 61,
  },
  {
    caseId: 'visual-bilingual-heading',
    coverage: ['FR-026', 'bilingual', 'heading', 'wrapped-separator'],
    id: 'bilingual-heading',
    requirementIds: ['FR-026', 'SC-007'],
    slide: 57,
  },
]
const coherentCanonicalScenarios = ['default', 'ucas', 'ict'].flatMap(
  preset => modes.flatMap(mode => coherentCanonicalDefinitions.map(
    definition => ({
      buildId: `expanded-${preset}`,
      ...definition,
      id: `visual-${definition.id}-${preset}-${mode}`,
      mode,
      preset,
    }),
  )),
)
const coherentGeneratedMediaScenarios = modes.flatMap(mode => [
  {
    buildId: 'protocol',
    caseId: 'protocol-generated-image-states',
    coverage: ['FR-004', 'FR-027', 'generated', 'media', 'states'],
    id: `visual-generated-image-states-${mode}`,
    mode,
    preset: 'default',
    requirementIds: ['FR-004', 'FR-027', 'SC-007'],
    slide: 26,
  },
  {
    buildId: 'protocol',
    caseId: 'protocol-image-equivalence',
    coverage: ['FR-004', 'FR-027', 'generated', 'public', 'media', 'equivalence'],
    id: `visual-generated-image-equivalence-${mode}`,
    mode,
    preset: 'default',
    requirementIds: ['FR-004', 'FR-027', 'SC-007'],
    slide: 27,
  },
])
const compactViewport = Object.freeze({ height: 405, width: 720 })
const coherentCompactDefinitions = [
  {
    caseId: 'visual-callout-authored-compact',
    coverage: ['FR-012', 'compact', 'callout'],
    id: 'callout',
    requirementIds: ['FR-012', 'SC-007'],
    slide: 52,
  },
  {
    caseId: 'us2-closing-metadata',
    coverage: ['FR-005', 'FR-023', 'compact', 'closing', 'rich'],
    id: 'closing-rich',
    requirementIds: ['FR-005', 'FR-023', 'SC-007'],
    slide: 16,
  },
  {
    caseId: 'visual-brand-collision',
    coverage: ['FR-025', 'compact', 'section-brand', 'lockup', 'watermark'],
    id: 'brand-safe-zone',
    requirementIds: ['FR-025', 'SC-007'],
    slide: 58,
  },
  {
    caseId: 'visual-section-header',
    coverage: ['FR-025', 'compact', 'section-brand', 'header', 'lockup-suppression'],
    id: 'section-header',
    requirementIds: ['FR-025', 'SC-007'],
    slide: 61,
  },
  {
    caseId: 'visual-bilingual-heading',
    coverage: ['FR-026', 'compact', 'bilingual'],
    id: 'bilingual-heading',
    requirementIds: ['FR-026', 'SC-007'],
    slide: 57,
  },
]
const coherentCompactScenarios = ['default', 'ucas', 'ict'].flatMap(
  preset => modes.flatMap(mode => coherentCompactDefinitions.map(
    definition => ({
      buildId: `expanded-${preset}`,
      ...definition,
      id: `visual-compact-${definition.id}-${preset}-${mode}`,
      mode,
      preset,
      viewport: compactViewport,
    }),
  )),
)

export const visualScenarios = Object.freeze([
  ...presetScenarios,
  ...layoutScenarios,
  ...chromeScenarios,
  ...protocolScenarios,
  ...us1CalloutScenarios,
  ...correctedCalloutScenarios,
  ...generatedCalloutScenarios,
  ...us1SurfaceScenarios,
  ...correctedLinkScenarios,
  ...generatedLinkScenarios,
  ...correctedMediaScenarios,
  ...figureVariantScenarios,
  ...us2SurfaceScenarios,
  ...us2ClosingScenarios,
  ...us3AccentScenarios,
  ...us4TechnicalScenarios,
  ...us4TitlelessCodeScenarios,
  ...correctedBadgeScenarios,
  ...us5ReadingCueScenarios,
  ...us5GeneratedTaskScenarios,
  ...generatedStatusHighlightScenarios,
  ...correctedSequenceScenarios,
  ...coherentCanonicalScenarios,
  ...coherentGeneratedMediaScenarios,
  ...coherentCompactScenarios,
])

export const visualTolerance = Object.freeze({
  maximumChangedPixelRatio: 0,
  maximumChannelDelta: 0,
  perChannelThreshold: 0,
  rationale: 'Pinned Chromium, DPR 2, settled fonts/images, and disabled font subpixel positioning make the reviewed references exact.',
})

export const sha256 = value => createHash('sha256').update(value).digest('hex')

export const acquireVisualBuildContext = async () => {
  const external = readQualityBuildContext()
  if (external) {
    for (const id of [
      'matrix-default',
      'matrix-ucas',
      'matrix-ict',
      'expanded-default',
      'expanded-ucas',
      'expanded-ict',
      'protocol',
    ]) {
      if (!external[id]) throw new Error(`Quality build context is missing ${id}`)
    }
    return { builds: external, close: async () => {} }
  }

  const [matrixBuilds, expandedBuilds] = await Promise.all([
    generatePresetMatrixBuilds(),
    generateExpandedContentBuilds(),
  ])
  const protocolBuild = {
    id: 'protocol',
    outDir: resolve(qualityArtifactRoot, 'build/visual/protocol'),
    source: resolve(repositoryRoot, 'fixtures/obsidian-protocol.md'),
  }
  await buildDeck(protocolBuild)
  const definitions = [
    ...matrixBuilds.map(build => ({
      ...build,
      id: `matrix-${build.preset}`,
    })),
    ...expandedBuilds,
    protocolBuild,
  ]
  const servers = await Promise.all(
    definitions.map(build => startStaticServer(build.outDir)),
  )
  return {
    builds: Object.fromEntries(definitions.map((build, index) => [
      build.id,
      { ...build, baseUrl: servers[index].baseUrl },
    ])),
    close: () => Promise.all(servers.map(server => server.close())),
  }
}

export const createVisualBrowser = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-font-subpixel-positioning',
      '--disable-lcd-text',
      '--font-render-hinting=none',
    ],
  })
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 552, width: 980 },
  })
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') await route.continue()
    else {
      await route.fulfill({
        body: '',
        contentType: 'text/plain',
        status: 204,
      })
    }
  })
  return { browser, context }
}

export const captureVisualScenario = async (page, build, scenario) => {
  if (scenario.viewport) await page.setViewportSize(scenario.viewport)
  await waitForSlide(
    page,
    build.baseUrl,
    scenario.slide,
    scenario.mode,
    scenario.caseId,
  )
  const state = await page.evaluate(({ caseId, captureId }) => {
    const markedCanvas = caseId
      ? document.querySelector(`[data-quality-case="${caseId}"]`)
        ?.closest('.slidev-layout')
      : null
    const visibleCanvas = [...document.querySelectorAll('.slidev-layout')]
      .find((element) => {
        const rect = element.getBoundingClientRect()
        return rect.right > 0
          && rect.bottom > 0
          && rect.left < innerWidth
          && rect.top < innerHeight
      })
    const canvas = markedCanvas ?? visibleCanvas
    if (!(canvas instanceof HTMLElement)) {
      throw new Error(`Visual canvas is missing for ${captureId}`)
    }
    canvas.dataset.qualityVisual = captureId
    const images = [...canvas.querySelectorAll('img')].map(image => ({
      complete: image.complete,
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      src: image.currentSrc || image.src,
    }))
    return {
      density: canvas.dataset.presentationDensity ?? null,
      images,
      preset: canvas.dataset.presentationPreset ?? null,
    }
  }, {
    captureId: scenario.id,
    caseId: scenario.caseId,
  })
  for (const image of state.images) {
    if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error(`${scenario.id}: broken image ${image.src}`)
    }
  }
  if (state.preset !== scenario.preset) {
    throw new Error(
      `${scenario.id}: expected preset ${scenario.preset}, got ${state.preset}`,
    )
  }
  const screenshot = await page.locator(
    `[data-quality-visual="${scenario.id}"]`,
  ).screenshot({ type: 'png' })
  return { screenshot, state }
}

export const comparePngPixels = async (
  page,
  actual,
  expected,
  tolerance = visualTolerance,
) => page.evaluate(async ({
  actualBase64,
  expectedBase64,
  pixelThreshold,
}) => {
  const decode = async (base64) => {
    const response = await fetch(`data:image/png;base64,${base64}`)
    const bitmap = await createImageBitmap(await response.blob())
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(bitmap, 0, 0)
    return {
      data: context.getImageData(0, 0, bitmap.width, bitmap.height).data,
      height: bitmap.height,
      width: bitmap.width,
    }
  }
  const [actualImage, expectedImage] = await Promise.all([
    decode(actualBase64),
    decode(expectedBase64),
  ])
  if (actualImage.width !== expectedImage.width
    || actualImage.height !== expectedImage.height) {
    return {
      actualHeight: actualImage.height,
      actualWidth: actualImage.width,
      changedPixelRatio: 1,
      changedPixels: Number.POSITIVE_INFINITY,
      expectedHeight: expectedImage.height,
      expectedWidth: expectedImage.width,
      maximumChannelDelta: 255,
    }
  }

  let changedPixels = 0
  let maximumChannelDelta = 0
  for (let index = 0; index < actualImage.data.length; index += 4) {
    let changed = false
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(
        actualImage.data[index + channel] - expectedImage.data[index + channel],
      )
      maximumChannelDelta = Math.max(maximumChannelDelta, delta)
      if (delta > pixelThreshold) changed = true
    }
    if (changed) changedPixels += 1
  }
  return {
    changedPixelRatio: changedPixels / (actualImage.width * actualImage.height),
    changedPixels,
    height: actualImage.height,
    maximumChannelDelta,
    width: actualImage.width,
  }
}, {
  actualBase64: actual.toString('base64'),
  expectedBase64: expected.toString('base64'),
  pixelThreshold: tolerance.perChannelThreshold,
})

export const updateVisualBaselines = async ({
  builds,
  context,
  rationale,
  reviewer,
}) => {
  if (!reviewer?.trim()) throw new Error('Visual baseline reviewer is required')
  if (!rationale?.trim()) throw new Error('Visual baseline rationale is required')
  await mkdir(visualBaselineDirectory, { recursive: true })
  const scenarios = []

  for (const scenario of visualScenarios) {
    const page = await context.newPage()
    try {
      const captured = await captureVisualScenario(
        page,
        builds[scenario.buildId],
        scenario,
      )
      const filename = `${scenario.id}.png`
      const path = resolve(visualBaselineDirectory, filename)
      await writeFile(path, captured.screenshot)
      scenarios.push({
        ...scenario,
        bytes: captured.screenshot.length,
        height: captured.screenshot.readUInt32BE(20),
        path: relative(repositoryRoot, path),
        sha256: sha256(captured.screenshot),
        width: captured.screenshot.readUInt32BE(16),
      })
    } finally {
      await page.close()
    }
  }

  const lockfile = await readFile(resolve(repositoryRoot, 'pnpm-lock.yaml'))
  const { stdout: commit } = await execFileAsync(
    'git',
    ['rev-parse', 'HEAD'],
    { cwd: repositoryRoot },
  )
  const manifest = {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    gitCommit: commit.trim(),
    lockfileSha256: sha256(lockfile),
    reviewer: reviewer.trim(),
    rationale: rationale.trim(),
    viewport: {
      deviceScaleFactor: 2,
      logicalHeight: 552,
      logicalWidth: 980,
      rasterHeight: 1104,
      rasterWidth: 1960,
    },
    tolerance: visualTolerance,
    scenarios,
  }
  await writeFile(
    visualBaselineManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
  )
  return manifest
}
