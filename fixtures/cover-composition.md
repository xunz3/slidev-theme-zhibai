---
theme: ../
layout: cover
title: A wide, authored figure
subtitle: Native Slidev image frontmatter retains its accessible figure behavior.
eyebrow: COVER COMPOSITION · 01
date: September 2026
image: /author-fixtures/media-landscape.svg
imageAlt: A labelled research diagram with a central target and four marked corners.
imageFit: contain
imagePosition: center
themeConfig:
  presentation:
    preset: zhubai
---

The same layout must keep its title, subtitle, metadata, and figure readable at wide and compact viewports.

---
layout: cover
presentationPreset: zhubai
title: A slot can tell its own story
subtitle: Authored visual content takes precedence over an image fallback.
eyebrow: NATIVE NAMED SLOT
date: Slot composition
image: /author-fixtures/media-landscape.svg
imageAlt: Fallback image that should be replaced by the authored visual slot.
---

This cover authors a small evidence flow directly in Markdown.

::visual::

<div data-visual-slot="evidence-flow">
  <svg viewBox="0 0 720 220" role="img" aria-label="A research flow from question, through method, to evidence.">
    <path d="M174 110h122m128 0h122" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M287 101l9 9-9 9M537 101l9 9-9 9" fill="none" stroke="currentColor" stroke-width="2" />
    <g fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="110" cy="110" r="64" />
      <circle cx="360" cy="110" r="64" />
      <circle cx="610" cy="110" r="64" />
    </g>
    <g fill="currentColor" font-family="system-ui, sans-serif" style="font-size:20px" text-anchor="middle">
      <text x="110" y="116">Question</text>
      <text x="360" y="116">Method</text>
      <text x="610" y="116">Evidence</text>
    </g>
  </svg>
</div>

---
layout: cover
presentationPreset: zhubai
title: Empty by design
subtitle: No image or slot means the headline can use the whole text measure.
eyebrow: DEFAULT · TEXT ONLY
date: September 2026
---

---
layout: cover
presentationPreset: zhubai
title: When the Evidence Changes, How Should Confidence Change?
subtitle: 分布变化时，模型的置信度也应如何变化？ A long bilingual research question remains legible without an empty visual column.
eyebrow: DEFAULT · LONG TITLE
date: September 2026
---

---
layout: cover
presentationPreset: ucas
title: A Composed Academic Opening
subtitle: 学术表达，清晰从容。
eyebrow: UCAS · TEXT ONLY
date: September 2026
---

---
layout: cover
presentationPreset: ucas
title: Geometry, Symmetry, and Generalization Across Scientific Domains
subtitle: 几何、对称性与跨领域泛化
eyebrow: UCAS · LONG TITLE
date: September 2026
---

---
layout: cover
presentationPreset: ucas
title: A Figure with a Clear Question
subtitle: 学术图像与研究论点并行，而不相互遮挡。
eyebrow: UCAS · AUTHORED IMAGE
date: September 2026
image: /author-fixtures/media-portrait.svg
imageAlt: A portrait diagram with labeled measurement points and a central target.
imageFit: cover
imagePosition: 50% 20%
---

---
layout: cover
presentationPreset: ict
title: A Focused Technical Brief
subtitle: 简洁结构，让复杂系统一目了然。
eyebrow: SYSTEMS · TEXT ONLY
date: September 2026
---

---
layout: cover
presentationPreset: ict
title: Reliable Systems Begin with Measurable Constraints
subtitle: 可靠系统始于可衡量的约束条件。
eyebrow: SYSTEMS · LONG TITLE
date: September 2026
---

---
layout: cover
presentationPreset: ict
title: Evidence, in its Proper Context
subtitle: 一张图像，也应清晰说明它的来源与用途。
eyebrow: SYSTEMS · VISUAL SLOT
date: September 2026
---

A second authored slot makes the source order and accessible label explicit.

::visual::

<div data-visual-slot="signal-plot">
  <svg viewBox="0 0 640 360" role="img" aria-label="A rising signal with an observed curve and a smoother model estimate.">
    <path d="M72 48v244h520" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M72 252c70-12 79-14 111-64s38-90 76-53 39 111 80 63 36-130 80-78 51 69 173-23" fill="none" stroke="currentColor" stroke-width="4" />
    <path d="M72 241c100-9 124-31 187-65s123-18 180-14 97-35 153-65" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="7 8" opacity=".55" />
    <text x="74" y="330" fill="currentColor" font-family="system-ui, sans-serif" style="font-size:18px">Observed signal</text>
    <text x="372" y="330" fill="currentColor" font-family="system-ui, sans-serif" style="font-size:18px">Model estimate</text>
  </svg>
</div>

---
layout: cover
presentationPreset: ict
title: Missing image with a useful fallback
subtitle: A failed source retains its authored alternative text.
eyebrow: IMAGE FALLBACK
date: September 2026
image: /author-fixtures/does-not-exist.svg
imageAlt: Missing calibration plot showing the confidence estimate over time.
---

---
layout: cover
presentationPreset: zhubai
eyebrow: MARKDOWN HEADING SOURCE
subtitle: A subtitle follows the authored headline.
date: September 2026
---

# A Markdown heading remains the *single* cover headline

When frontmatter `title` is omitted, ordinary Markdown still provides one visible cover heading.
