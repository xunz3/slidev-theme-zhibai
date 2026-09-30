---
theme: ../
layout: cover
title: Confidence Under Distribution Shift
subtitle: 分布变化下科学模型的置信度校准
footer: Methods Colloquium · Reproducible Machine Learning
authors:
  - name: 王若衡 · Ruoheng Wang
    institution: Computational Science Methods Group
    email: ruoheng.wang@example.edu
themeConfig:
  presentation:
    preset: zhubai
    seal: "陈"
    chrome: auto
    header: false
    footerAuthors: true
    pageNumber: true
---

**Methods Colloquium · 方法学报告**<br>
July 2026 · Beijing

---
title: Research question
subtitle: Separate predictive quality from confidence quality
---

# Prediction is not confidence

When a microscopy classifier leaves its validation distribution, does its confidence remain reliable enough to prioritize samples for manual review?

- **Unit of analysis** — image batch, grouped by site and scanner.
- **Primary endpoint** — expected calibration error (ECE) and 90% coverage.
- **Guardrail** — discrimination must not degrade after recalibration.

The evaluation asks whether a score can support a workflow—not merely rank a benchmark.

---
layout: toc
title: Argument structure
subtitle: 研究问题、证据与边界
sections:
  - title: Method · 方法
    subtitle: Define the estimand before fitting
    slideNo: 4
  - title: Evidence · 证据
    subtitle: Connect results, artifacts, and ownership
    slideNo: 8
  - title: Implication · 启示
    subtitle: State the operating boundary
    slideNo: 16
---

# From estimand to operating rule

---
layout: section
---

# Method / 方法

Separate model quality from confidence quality

---
layout: two-cols
title: Preregistered comparison
subtitle: One hypothesis, three evaluation conditions
---

# Estimand

Temperature scaling fits a single parameter $T$ on validation data:

$$
\hat{p}(y \mid x) = \operatorname{softmax}\!\left(\frac{z(x)}{T}\right).
$$

The primary contrast is the change in ECE under scanner shift, before and after held-out recalibration.

::right::

# Held-out pilot

| Condition | AUROC ↑ | ECE ↓ | 90% coverage |
| --- | ---: | ---: | ---: |
| In-domain | .91 | **.028** | .89 |
| Scanner shift | .88 | .094 | .73 |
| Shift + recalibration | .88 | **.041** | **.86** |

*Illustrative fixture data · 12 batches*

---
title: Analysis contract
subtitle: Make the decision rule inspectable
---

# The analysis contract fits on one screen

```yaml
primary_metric: expected_calibration_error
bootstrap_resamples: 2000
group_by: [site, scanner]
recalibrate_on: validation_only
report: [estimate, ci95, missingness]
```

<div class="presentation-callout presentation-callout--note" data-callout="note">
  <div class="presentation-callout__title">Decision rule · 判定规则</div>
  <div class="presentation-callout__content">
    <p>If ECE exceeds .05 or 90% coverage falls below .85, route the batch to review; never tune the threshold on test data.</p>
  </div>
</div>

---
layout: quote
author: George E. P. Box
source: Robustness in the Strategy of Scientific Model Building, 1979
---

> All models are wrong, but some are useful.

---
layout: section
---

# Evidence and reproducibility / 证据与复现

Connect decisions, artifacts, workflow, and ownership

---
title: Decision boundary
accent: "#8a4b2a"
---

# Communicate the calibration boundary

<Callout type="warning" title="Calibration boundary">

Do not reuse the held-out test batches when fitting the temperature parameter.

</Callout>

<div class="presentation-label-gallery">
  <Tag>Method</Tag>
  <Tag>Shift analysis</Tag>
  <Badge tone="positive" marker>Reviewed</Badge>
  <Badge tone="info">Ready to replicate</Badge>
</div>

Press <Kbd>Esc</Kbd> to leave overview, or use
<Kbd :keys="['Ctrl', 'Shift', 'P']" /> to open commands.

---
layout: two-cols
title: Evidence record and ownership
---

# Accessible evidence record

<Figure
  src="/theme/public/zhubai-card.svg"
  alt="A compact research card summarizing one evidence record"
  caption="Figure A. A bounded, captioned fixture image."
  fit="contain"
/>

::right::

# Study authors

<Authors />

The component reads the deck-level author collection and keeps valid email addresses actionable.

---
layout: two-cols
title: Reproducibility workflow
---

# Steps

<Steps>

<ol start="2">
  <li><strong>Collect</strong> shifted batches.</li>
  <li value="5"><strong>Calibrate</strong> on validation data.</li>
  <li><strong>Report</strong> uncertainty.</li>
</ol>

</Steps>

::right::

# Timeline

<Timeline>

1. <time datetime="2026-05">May</time> — Protocol frozen.
2. <time datetime="2026-06">June</time> — Audit completed.
3. **July** — Evidence released.

</Timeline>

---
title: Replication status
---

# Presentation-only review checklist

- [x] Preserve the raw logits and environment metadata.
- [ ] Reproduce calibration on the held-out scanner.
- [x] Publish confidence intervals with every primary estimate.

The <mark>reviewed operating boundary</mark> is emphasized as prose, while
`==literal code syntax==` remains code.

---
layout: code
title: Auditable calibration code
---

# Calibration contract

```ts
const report = calibrate({
  metric: 'expected-calibration-error',
  fitOn: 'validation',
  groupBy: ['site', 'scanner'],
  confidence: 0.95,
})

assert(report.testDataUsedForFit === false)
```

---
layout: image-left
title: Evidence card and narrative
image: /theme/public/zhubai-card.svg
imageAlt: Research evidence card placed to the left of the narrative
caption: Figure B. Narrative remains first in source order.
backgroundSize: contain
---

# Evidence before ornament

The narrative stays first in the document. CSS places the accessible figure on the left while
preserving reading order, caption semantics, and bounded geometry.

---
layout: image-right
title: Alternative evidence orientation
image: /theme/public/zhubai-card.svg
imageAlt: Research evidence card placed to the right of the narrative
caption: Figure C. The mirrored visual orientation uses the same source order.
backgroundSize: contain
---

# Mirrored presentation

Use the right-hand orientation when the prose should lead visually. The authoring and
accessibility contract is otherwise identical to `image-left`.

---
layout: statement
---

# Calibration is part of the result—not a footnote to accuracy.

置信度校准属于研究结论本身，而不是准确率之后的附注。

---
layout: references
---

# References

1. Guo, C., Pleiss, G., Sun, Y., and Weinberger, K. Q. *On Calibration of Modern Neural Networks.* ICML, 2017.
2. Ovadia, Y. et al. *Can You Trust Your Model's Uncertainty? Evaluating Predictive Uncertainty Under Dataset Shift.* NeurIPS, 2019.
3. Gneiting, T. and Raftery, A. E. *Strictly Proper Scoring Rules, Prediction, and Estimation.* JASA, 2007.

---
layout: center
---

# A confidence score is useful only when its operating boundary is explicit.

One estimand, one calibration rule, and one auditable workflow.

---
layout: end
---

# Thank you · 谢谢
