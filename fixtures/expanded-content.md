---
theme: ../
layout: cover
title: Expanded Theme Content
subtitle: Standalone semantic authoring · 独立语义内容创作
footer: Expanded content quality fixture
authors:
  - Ada Lovelace
  - name: Grace Hopper
    institution: US Navy
    email: grace@example.org
  - institution: Institute for Reproducible Research
  - email: contributor@example.org
  - email: not-an-email
  - name: " Equal Value "
    institution: Equal Value
    email: equal@example.org
  - name: Duplicate Fields
    institution: Duplicate Fields
    email: Duplicate Fields
  - name: Intentional Duplicate
  - name: Intentional Duplicate
  - ""
author:
  name: Legacy Author
  institution: Compatibility Institute
themeConfig:
  presentation:
    preset: default # __EXPANDED_PRESET__
    chrome: auto
    header: false
    footerAuthors: true
    pageNumber: true
    accent: "color-mix(in srgb, currentColor 72%, #5b4fc4)"
---

<div data-quality-case="expanded-control-start">

# Expanded theme content

Standalone components, academic layouts, local accents, technical aids, and Markdown reading
cues share one production-built fixture.

</div>

---
title: Stable navigation control
---

<div data-quality-case="expanded-control-target">

# Stable navigation control

This unchanged text-only slide gives the navigation gate a deterministic control transition
before any feature-specific media or component content.

</div>

<!-- EXPANDED-US1-START -->
---
title: Informational callouts
---

<div data-quality-case="us1-callouts-info" class="presentation-callout-gallery">

<Callout type="note">Canonical note body.</Callout>
<Callout type="info">Canonical info body.</Callout>
<Callout type="todo">Canonical to-do body.</Callout>
<Callout type="abstract">Canonical abstract body.</Callout>
<Callout type="summary">Canonical summary body.</Callout>

</div>

---
title: Positive callouts
---

<div data-quality-case="us1-callouts-positive" class="presentation-callout-gallery">

<Callout type="tip">Canonical tip body.</Callout>
<Callout type="success">Canonical success body.</Callout>
<Callout type="check">Canonical check body.</Callout>

</div>

---
title: Caution callouts
---

<div data-quality-case="us1-callouts-caution" class="presentation-callout-gallery">

<Callout type="warning">Canonical warning body.</Callout>
<Callout type="caution">Canonical caution body.</Callout>
<Callout type="attention">Canonical attention body.</Callout>

</div>

---
title: Danger callouts
---

<div data-quality-case="us1-callouts-danger" class="presentation-callout-gallery">

<Callout type="danger">Canonical danger body.</Callout>
<Callout type="error">Canonical error body.</Callout>
<Callout type="failure">Canonical failure body.</Callout>

</div>

---
title: Question callouts
---

<div data-quality-case="us1-callouts-question" class="presentation-callout-gallery">

<Callout type="question">Canonical question body.</Callout>
<Callout type="help">Canonical help body.</Callout>
<Callout type="faq">Canonical FAQ body.</Callout>

</div>

---
title: Quotation callouts
---

<div data-quality-case="us1-callouts-quotation" class="presentation-callout-gallery">

<Callout type="quote">Canonical quotation body.</Callout>
<Callout type="cite">Canonical citation body.</Callout>

</div>

---
title: Callout normalization and rich content
---

<div data-quality-case="us1-callout-fallbacks">

<Callout>Omitted type remains neutral.</Callout>
<Callout type="" title="Authored neutral">Empty type retains its authored title.</Callout>
<Callout type="unsupported">Unsupported type remains neutral.</Callout>
<Callout
  type=" WARNING "
  title="Reproducibility protocol · 可复现性协议与双语长标题"
>

Formatted body with **strong meaning**, `inline code`, a [link](https://example.org), and:

1. a first observation;
2. a second observation.

</Callout>

</div>

---
title: Callout component equivalence
---

<div data-quality-case="us1-callout-equivalence" class="presentation-callout-gallery">

<Callout type="warning" title="Equivalent warning">
  Component-authored warning content.
</Callout>

<Callout type="warning" title="Equivalent warning">
  Component-authored warning content.
</Callout>

</div>

---
title: Figure alternatives and failure states
---

<div data-quality-case="us1-figures-alternatives" class="presentation-figure-gallery">

<Figure
  src="/theme/public/lilas-card.svg"
  alt="Lilas card connected to a presentation"
  caption="Meaningful authored alternative text."
/>
<Figure
  src="/theme/public/lilas-card.svg"
  caption="Caption supplies the omitted alternative."
/>
<Figure
  src="/theme/public/lilas-card.svg"
  alt=""
  caption="Decorative image with a visible caption."
/>
<Figure src="" alt="Missing source description" caption="Missing source fallback." />
<Figure
  src="data:image/svg+xml,not-an-image"
  alt="Failed source description"
  caption="Failed source fallback."
/>

</div>

---
title: Figure geometry
---

<div data-quality-case="us1-figures-geometry" class="presentation-figure-gallery">

<Figure
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='480' viewBox='0 0 120 480'%3E%3Crect width='120' height='480' fill='%2377b5aa'/%3E%3C/svg%3E"
  alt="Tall teal rectangle"
  fit="contain"
/>
<Figure
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='120' viewBox='0 0 800 120'%3E%3Crect width='800' height='120' fill='%23b8793f'/%3E%3C/svg%3E"
  alt="Wide amber rectangle"
  fit="cover"
/>
<Figure
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Ccircle cx='160' cy='90' r='64' fill='%236f63a6' fill-opacity='.55'/%3E%3C/svg%3E"
  alt="Translucent violet circle"
/>

</div>

---
title: Root author normalization
---

<div data-quality-case="us1-authors-mixed">

# Contributors

<Authors />

<p data-author-case="string-mixed-partial-duplicate-empty">
  Root metadata includes a string, structured and partial records, an intentional duplicate,
  and an empty entry that must not create a card.
</p>

</div>
<!-- EXPANDED-US1-END -->

<!-- EXPANDED-US2-START -->
---
layout: end
title: Minimal closing
---

<div data-quality-case="us2-end-minimal">

# Thank you · 谢谢

</div>

---
layout: end
title: Minimal closing comparison
---

<div data-quality-case="us2-thanks-minimal">

# Thank you · 谢谢

</div>

---
layout: end
title: Closing with metadata
contact: research@example.org
showAuthors: true
logo: /theme/public/lilas-card.svg
logoAlt: Lilas presentation research mark
---

<div data-quality-case="us2-closing-metadata">

# Reproducible research continues

Thank you for reviewing the evidence and its operating boundaries.

</div>

---
layout: end
title: Decorative closing logo
logo: /theme/public/lilas-card.svg
logoAlt: ""
---

<div data-quality-case="us2-closing-decorative-logo">

# Questions?

The decorative mark has an explicit empty alternative.

</div>

---
layout: end
title: Failed closing logo
contact: Not an actionable address
logo: "data:image/svg+xml,not-an-image"
logoAlt: Research group logo unavailable
---

<div data-quality-case="us2-closing-failed-logo">

# Keep the description

Failed media must not destabilize the closing message.

</div>

---
layout: end
title: Omitted closing regions
---

<div data-quality-case="us2-closing-omitted">

# A complete minimal ending

No contact, author collection, or logo region is emitted.

</div>

---
layout: image-left
title: Image left
image: /theme/public/lilas-card.svg
imageAlt: Lilas card connected to a presentation canvas
caption: Figure 2. The narrative remains first in source order.
---

<div data-quality-case="us2-image-left">

# Experimental design

The narrative comes first in the document. The figure is placed on the left only through CSS.

</div>

---
layout: image-right
title: Image right
image: /theme/public/lilas-card.svg
imageAlt: Lilas card connected to a presentation canvas
caption: Figure 2. The narrative remains first in source order.
backgroundSize: auto 72%
---

<div data-quality-case="us2-image-right">

# Experimental design

The narrative comes first in the document. The figure is placed on the right only through CSS.

</div>

---
layout: image-left
title: Legacy image inputs
image: /theme/public/lilas-card.svg
caption: Caption fallback supplies the omitted image alternative.
backgroundSize: 80%
class: legacy-image-layout
---

<div data-quality-case="us2-image-legacy">

# Existing Slidev metadata remains accepted

The `image`, `class`, and `backgroundSize` keys retain their established authoring surface.

</div>

---
layout: image-right
title: Missing image
image: ""
imageAlt: Missing experimental figure
---

<div data-quality-case="us2-image-missing">

# Narrative-only fallback

An empty image value collapses the media region without leaving an empty landmark.

</div>

---
layout: image-left
title: Failed image
image: "data:image/svg+xml,not-an-image"
imageAlt: Failed experimental figure
caption: The description and caption remain after failure.
---

<div data-quality-case="us2-image-failed">

# Stable failure geometry

The narrative position remains unchanged when the image fails.

</div>

---
layout: image-right
title: Long bilingual image narrative
image: /theme/public/lilas-card.svg
imageAlt: Diagram showing a bilingual research workflow
caption: Figure 3. Collection, normalization, validation, publication · 采集、规范化、验证与发布。
backgroundSize: contain
---

<div data-quality-case="us2-image-bilingual">

# Evidence workflow · 证据工作流

The same logical order supports a longer bilingual explanation. 数据采集以后，研究团队保留原始观察、
环境信息与不确定性，再进行规范化、验证和发布，确保投影画布中的叙述与图像都保持清晰。

</div>
<!-- EXPANDED-US2-END -->

<!-- EXPANDED-US3-START -->
---
title: Valid local accent
presentationHeader: true
accent: "color-mix(in srgb, currentColor 68%, #c2410c)"
---

<div data-quality-case="us3-accent-local-a" class="presentation-accent-probe presentation-accent-probe--overview">

# Local accent A

[Accent-aware link](https://example.com/accent) · `inline accent` · **common emphasis**

1. Accent-aware list marker

| Consumer | State |
| --- | --- |
| Table | Local |

<div class="presentation-callout-gallery">

<Callout type="info">General accent follows the slide.</Callout>
<Callout type="success">Success remains semantic.</Callout>
<Callout type="warning">Warning remains semantic.</Callout>
<Callout type="danger">Danger remains semantic.</Callout>
<Callout type="question">Question remains semantic.</Callout>

</div>

</div>

---
title: Unaccented fallback
presentationHeader: true
---

<div data-quality-case="us3-accent-unaccented" class="presentation-accent-probe presentation-accent-probe--overview">

# Deck fallback

[Accent-aware link](https://example.com/fallback) and `inline accent` use the deck value.

1. Accent-aware list marker

| Consumer | State |
| --- | --- |
| Table | Deck |

<div class="presentation-callout-gallery">

<Callout type="info">General accent follows the deck.</Callout>
<Callout type="success">Success remains semantic.</Callout>
<Callout type="warning">Warning remains semantic.</Callout>
<Callout type="danger">Danger remains semantic.</Callout>
<Callout type="question">Question remains semantic.</Callout>

</div>

</div>

---
title: Empty local accent
presentationHeader: true
accent: ""
---

<div data-quality-case="us3-accent-empty" class="presentation-accent-probe">

# Empty values inherit

[Accent-aware link](https://example.com/empty) and informational content use the deck value.

<Callout type="info">An empty higher-priority value never clears a valid fallback.</Callout>

</div>

---
title: Invalid local accent
presentationHeader: true
accent: definitely-not-a-css-color
---

<div data-quality-case="us3-accent-invalid" class="presentation-accent-probe">

# Invalid values inherit

[Accent-aware link](https://example.com/invalid) and informational content use the deck value.

<Callout type="info">An invalid higher-priority value never clears a valid fallback.</Callout>

</div>

---
title: Valid local accent B
presentationHeader: true
accent: "color-mix(in srgb, currentColor 68%, #047857)"
---

<div data-quality-case="us3-accent-local-b" class="presentation-accent-probe">

# Local accent B

[Accent-aware link](https://example.com/accent-b) · `inline accent` · **common emphasis**

<div class="presentation-callout-gallery">

<Callout type="info">The second local value is isolated.</Callout>
<Callout type="success">Success remains semantic.</Callout>
<Callout type="warning">Warning remains semantic.</Callout>
<Callout type="danger">Danger remains semantic.</Callout>
<Callout type="question">Question remains semantic.</Callout>

</div>

</div>

---
title: Local accent equal to deck
presentationHeader: true
accent: "color-mix(in srgb, currentColor 72%, #5b4fc4)"
---

<div data-quality-case="us3-accent-equal-deck" class="presentation-accent-probe">

# Equal values remain local-valid

[Accent-aware link](https://example.com/equal) and informational content resolve deterministically.

<Callout type="info">The authored value equals the deck value.</Callout>

</div>
<!-- EXPANDED-US3-END -->

<!-- EXPANDED-US4-START -->
---
layout: code
title: Solver implementation
---

<div data-quality-case="us4-code-titled">

# Solver implementation

```ts {2,6-8|10-14}
export type Observation = {
  id: string
  value: number
}

export const normalizeObservations = (
  observations: readonly Observation[],
  environment: Readonly<Record<string, string>>,
) => {
  const auditLabel = "collection→normalization→validation→publication::采集→规范化→验证→发布::this-is-an-intentionally-long-unbroken-technical-token-for-contained-horizontal-overflow"
  const valid = observations.filter(observation => Number.isFinite(observation.value))
  const total = valid.reduce((sum, observation) => sum + observation.value, 0)
  const mean = valid.length === 0 ? 0 : total / valid.length
  const centered = valid.map(observation => ({
    ...observation,
    value: observation.value - mean,
  }))
  return {
    auditLabel,
    centered,
    environment,
    mean,
  }
}
```

<p class="presentation-code-note">Highlighted and annotated code remains owned by Slidev.</p>

</div>

---
layout: code
title: Code without a visible heading
---

<div data-quality-case="us4-code-titleless">

```text
line-01: prepare reproducible environment
line-02: collect observations
line-03: preserve raw inputs
line-04: normalize measurements
line-05: validate assumptions
line-06: calculate uncertainty
line-07: compare baselines
line-08: inspect residuals
line-09: document exclusions
line-10: publish intermediate evidence
line-11: request peer review
line-12: incorporate corrections
line-13: rerun the workflow
line-14: archive the environment
line-15: freeze the dataset
line-16: release the report
line-17: 这是一条用于验证纵向滚动 containment 的双语技术记录
line-18: finish
line-19: retain source metadata
line-20: verify checksums
line-21: record package versions
line-22: compare deterministic output
line-23: inspect accessibility evidence
line-24: inspect visual evidence
line-25: inspect performance evidence
line-26: reconcile review notes
line-27: publish reproducibility notes
line-28: archive generated artifacts
line-29: close the review loop
line-30: done
```

</div>

---
title: Steps with zero items
---

<div data-quality-case="us4-steps-zero">

# Empty process

<Steps>

No ordered list was authored, so this readable note receives no sequence decoration.

</Steps>

</div>

---
title: Steps with one item
---

<div data-quality-case="us4-steps-one">

# One-step process

<Steps>

1. **Freeze** the reviewed dataset.

</Steps>

</div>

---
title: Steps with many items
---

<div data-quality-case="us4-steps-many">

# Reproducible workflow · 可复现流程

<Steps>

1. **Collect · 采集** raw observations and environment details.
2. **Normalize · 规范化** measurements without discarding provenance.
3. **Validate · 验证** assumptions, uncertainty, and exclusions.
4. **Publish · 发布** evidence with a rerunnable audit trail.

</Steps>

</div>

---
title: Timeline with zero events
---

<div data-quality-case="us4-timeline-zero">

# Empty chronology

<Timeline>

No ordered event list was authored, so no orphan rail or marker is displayed.

</Timeline>

</div>

---
title: Timeline with one undated event
---

<div data-quality-case="us4-timeline-one">

# One milestone

<Timeline>

1. **Today** — Results released without an artificial date.

</Timeline>

</div>

---
title: Timeline with dated and undated events
---

<div data-quality-case="us4-timeline-many">

# Research chronology · 研究时间线

<Timeline>

1. <time datetime="2024-09">Sep 2024</time> — Dataset frozen.
2. <time datetime="2025-02">Feb 2025</time> — Evaluation completed.
3. **Today · 今天** — Results and uncertainty released.
4. **Next** — Independent replication and bilingual documentation.

</Timeline>

</div>

---
title: Category and status labels
---

<div data-quality-case="us4-status-labels">

# Compact labels · 紧凑标签

<p class="presentation-label-gallery">
  <Tag>Method</Tag>
  <Tag>Δ sensitivity-analysis / 灵敏度分析</Tag>
  <Badge>Complete</Badge>
  <Badge>✓ Peer-reviewed · 已同行评审</Badge>
</p>

The category outline and status fill/icon remain distinct without relying on hue.

</div>

---
title: Keyboard input
---

<div data-quality-case="us4-keyboard">

# Keyboard sequences · 键盘序列

Press <Kbd>Esc</Kbd> to leave the overview.

Open the command menu with <Kbd :keys="['Ctrl', 'Shift', 'P']" />.

Use <Kbd :keys="['⌘', '', ' K ', '语言']" /> for a filtered symbolic bilingual chord.

<Kbd :keys="['', '  ']">Fallback key</Kbd>

<span hidden data-quality-kbd-runtime-guard>
  <Kbd :keys="['Ctrl', 5, null, ' P ']" />
</span>

</div>
<!-- EXPANDED-US4-END -->

<!-- EXPANDED-US5-START -->
---
title: Native task-list cues
---

<div data-quality-case="us5-tasks-native">

# Presentation tasks · 演示任务

- [ ] Preserve the raw observations and environment metadata.
- [x] Freeze the reviewed dataset.
- [ ] Wrap a deliberately long bilingual task label across the available reading width while
      keeping its empty box aligned with the first line · 长任务文本换行后仍与首行复选框对齐。
  - [x] Record the checksum and package versions.
  - [ ] Request independent replication.
- [x] Publish the uncertainty statement.

</div>

---
title: Standard HTML task lists
---

<div data-quality-case="us5-tasks-generated">

# Standard task list markup

<ul class="contains-task-list">
  <li class="task-list-item" data-task="">
    <input type="checkbox" />
    Generated unchecked task.
  </li>
  <li class="task-list-item is-checked" data-task="x">
    <input type="checkbox" checked />
    Generated checked task with a wrapped bilingual explanation · 已完成的生成任务保留状态。
    <ul class="contains-task-list">
      <li class="task-list-item" data-task="">
        <input type="checkbox" />
        Nested generated follow-up.
      </li>
    </ul>
  </li>
</ul>

</div>

---
title: Semantic highlights
---

<div data-quality-case="us5-highlights">

# Highlighted evidence · 高亮证据

Native <mark data-highlight-case="native">reviewed evidence · 已审核证据</mark> and generated
<mark data-highlight-case="generated">reviewed evidence · 已审核证据</mark>
share one treatment.

The cue remains distinct beside [a link](https://example.com/evidence), *emphasis*, and
`inline ==not a highlight== code`.

```text
==literal highlight-like characters stay code==
<mark>literal markup text stays code text</mark>
```

<pre data-highlight-code-scope><code><mark>authored mark inside code</mark> <mark>generated highlight class inside code</mark></code></pre>

</div>
<!-- EXPANDED-US5-END -->

<!-- FIX-THEME-VISUALS-MATRIX-START -->
---
title: Same-source Figure fit matrix
---

<div data-quality-case="visual-media-figure-fits" class="presentation-media-fit-gallery">

<Figure
  src="/author-fixtures/media-portrait.svg"
  alt="Labeled portrait geometry fixture contained"
  caption="Portrait · contain"
  fit="contain"
/>
<Figure
  src="/author-fixtures/media-portrait.svg"
  alt="Labeled portrait geometry fixture covered"
  caption="Portrait · cover"
  fit="cover"
/>
<Figure
  src="/author-fixtures/media-landscape.svg"
  alt="Labeled landscape geometry fixture contained"
  caption="Landscape · contain"
  fit="contain"
/>
<Figure
  src="/author-fixtures/media-landscape.svg"
  alt="Labeled landscape geometry fixture covered"
  caption="Landscape · cover"
  fit="cover"
/>

</div>

---
layout: image-left
title: Image-left portrait containment
image: /author-fixtures/media-portrait.svg
imageAlt: Labeled portrait geometry fixture
caption: The complete portrait remains visible.
backgroundSize: contain
---

<div data-quality-case="visual-image-left-contain">

# Image-left contain

Narrative-first source order stays stable while all four labeled corners remain visible.

</div>

---
layout: image-left
title: Image-left portrait coverage
image: /author-fixtures/media-portrait.svg
imageAlt: Labeled portrait geometry fixture
caption: The portrait fills the same media region.
backgroundSize: cover
imagePosition: 35% 45%
mediaRatio: 60
---

<div data-quality-case="visual-image-left-cover">

# Image-left cover

The same portrait source fills the viewport and crops only the necessary vertical overflow.

</div>

---
layout: image-right
title: Image-right landscape containment
image: /author-fixtures/media-landscape.svg
imageAlt: Labeled landscape geometry fixture
caption: The complete landscape remains visible.
backgroundSize: contain
---

<div data-quality-case="visual-image-right-contain">

# Image-right contain

Narrative-first source order stays stable while all four labeled corners remain visible.

</div>

---
layout: image-right
title: Image-right landscape coverage
image: /author-fixtures/media-landscape.svg
imageAlt: Labeled landscape geometry fixture
caption: The landscape fills the same media region.
backgroundSize: cover
imagePosition: 65% 55%
mediaRatio: 40
---

<div data-quality-case="visual-image-right-cover">

# Image-right cover

The same landscape source fills the viewport and crops only the necessary horizontal overflow.

</div>

---
layout: end
title: Transparent wide closing logo
contact: closing@example.org
logo: /author-fixtures/transparent-logo-wide.svg
logoAlt: Transparent wide research logo
---

<div data-quality-case="visual-closing-logo-wide">

# Complete wide logo

The transparent end caps remain visible without a Figure tray or decode shift.

</div>

---
layout: end
title: Transparent tall closing logo
showAuthors: true
logo: /author-fixtures/transparent-logo-tall.svg
logoAlt: Transparent tall research logo
---

<div data-quality-case="visual-closing-logo-tall">

# Complete tall logo

Rich closing content remains balanced and preserves message, authors, then logo source order.

</div>

---
title: Authored callout casing and compact risk
---

<div data-quality-case="visual-callout-authored-compact" class="presentation-callout-gallery presentation-callout-gallery--dense">

<Callout type="note" title="API note">Authored acronym casing is unchanged.</Callout>
<Callout type="success" title="mixedCase success">Positive geometry remains protected.</Callout>
<Callout type="warning" title="Caution · 注意事项">Bilingual spacing remains authored.</Callout>
<Callout type="danger" title="DO NOT recase">Danger remains stronger than neutral.</Callout>
<Callout type="question" title="Why this result?">The question ring remains visible.</Callout>
<Callout type="quote" title="Quoted evidence · 引用">The quotation bar remains visible.</Callout>
<Callout type="unsupported" title="Neutral fallback">Invalid type remains neutral.</Callout>

</div>

---
title: Link forms and author fallbacks
---

<div data-quality-case="visual-links-authors" class="presentation-link-probe">

# Read every value once

An [inline link](https://example.com/inline) stays glyph-bounded beside punctuation.

<p style="max-width: 20rem">
  A <a data-link-form="wrapped" href="https://example.com/wrapped">deliberately long wrapped
  evidence link for bilingual review · 双语链接换行检查</a> retains one underline.
</p>

<a data-link-form="block" href="https://example.com/block">
  Block-authored link treatment stays bounded to its rendered text.
</a>

<Authors />

</div>

---
title: Seven Badge tones and marker states
---

<div data-quality-case="visual-badge-matrix" class="presentation-badge-gallery">

<Badge>Neutral</Badge>
<Badge tone="info">Info</Badge>
<Badge tone="positive">Positive</Badge>
<Badge tone="caution">Caution</Badge>
<Badge tone="danger">Danger</Badge>
<Badge tone="question">Question</Badge>
<Badge tone="quotation">Quotation</Badge>
<Badge tone=" POSITIVE " marker>Requested marker</Badge>
<Badge tone="unsupported">Invalid → neutral</Badge>
<Badge tone="danger">⚠ Authored icon only</Badge>
<Badge tone="caution" marker>⚠ Marker plus authored icon</Badge>
<Badge marker="false">Text false</Badge>
<Badge marker="off">Text off</Badge>
<Badge marker="true">Text true</Badge>
<Badge marker="on">Text on</Badge>
<Badge marker="invalid">Invalid marker</Badge>

</div>

---
title: Authored sequence numbering
---

<div data-quality-case="visual-sequences-custom">

# Procedure and chronology

<Steps>

<ol start="4">
  <li><strong>Collect</strong> evidence from the maintained source.</li>
  <li value="8"><strong>Validate</strong> the authored number and connector.</li>
  <li><strong>Publish</strong> the reviewed result.</li>
</ol>

</Steps>

<Timeline>

1. <time datetime="2025-01">Jan 2025</time> — First dated event.
2. **Undated · 未注明日期** — Equivalent label geometry.
3. Plain readable event without an invented label.

</Timeline>

</div>

---
title: Frame chrome and brand safe-zone probe
presentationHeader: true
---

<div data-quality-case="visual-chrome-safe-zone" class="presentation-safe-zone-probe">

<div>

# Safe heading · 安全标题

[Focusable safe-zone link](https://example.com/safe-zone)

1. Ordinary list marker

| Chrome consumer | Expected role |
| --- | --- |
| Header / footer | Secondary |
| Table / list | Secondary |

</div>

<Figure
  src="/author-fixtures/media-landscape.svg"
  alt="Top-right safe-zone geometry probe"
  caption="Figure and caption avoid the preset mark."
/>

</div>

---
title: Bilingual separator wrapping
---

<div data-quality-case="visual-bilingual-heading">

# Reproducible evidence workflow · 可复现证据工作流

## A deliberately constrained bilingual heading · 受约束的双语标题

The centered separator remains with the preceding phrase while the following phrase can wrap.

</div>

---
layout: section
title: Section brand collision probe
presentationHeader: false
---

<div data-quality-case="visual-brand-collision" class="presentation-safe-zone-probe">

<div>

# Section evidence · 章节证据

[Section-safe link](https://example.com/brand-safe-zone)

<button type="button" data-brand-safe-control>Review control</button>

</div>

<Figure
  src="/author-fixtures/media-landscape.svg"
  alt="Section lockup collision probe"
  caption="Figure, caption, heading, link, and control remain outside the section lockup."
/>

</div>

---
layout: section
title: Protected section identity
kicker: false
presentationHeader: false
accent: "color-mix(in srgb, currentColor 68%, #c2410c)"
---

<div data-quality-case="us3-section-accent-local">

# Protected institutional identity

Local accents may change content roles, never official section artwork.

</div>

---
layout: section
title: Protected section identity
kicker: false
presentationHeader: false
---

<div data-quality-case="us3-section-accent-unaccented">

# Protected institutional identity

Local accents may change content roles, never official section artwork.

</div>

---
layout: section
title: Header-safe section branding
subtitle: Optional chrome owns the top row
presentationChrome: "on"
presentationHeader: true
---

<div data-quality-case="visual-section-header">

# Section lockups yield to the header

The illustration stays behind content while the institutional lockup is omitted.

</div>

---
layout: figure
title: Stage figure · 主视觉
figureVariant: stage
---

<span hidden data-quality-case="figure-variant-stage"></span>

<Figure
  src="/author-fixtures/media-landscape.svg"
  alt="Wide evaluation landscape used as the primary visual"
  caption="Stage preserves the full source while giving the evidence more of the canvas."
  fit="contain"
/>

---
layout: figure
title: Minimal figure · 极简图形
figureVariant: minimal
---

<span hidden data-quality-case="figure-variant-minimal"></span>

<Figure
  src="/author-fixtures/media-portrait.svg"
  alt="Portrait research diagram without a surrounding tray"
  caption="Minimal removes the media tray so diagrams sit directly on the slide surface."
  fit="contain"
/>

---
layout: figure
title: Editorial figure · 证据边注
figureVariant: editorial
---

<span hidden data-quality-case="figure-variant-editorial"></span>

<Figure
  src="/author-fixtures/media-landscape.svg"
  alt="Evaluation landscape with a side annotation"
  caption="Evidence note · The annotation rail keeps interpretation close to the image without competing with the visual."
  fit="cover"
  image-position="35% 45%"
/>
<!-- FIX-THEME-VISUALS-MATRIX-END -->
