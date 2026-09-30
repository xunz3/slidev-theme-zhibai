---
theme: ./
layout: cover
title: Evidence Begins with a Question
subtitle: A quiet structure for ideas that deserve to be understood.
eyebrow: Zhubai / field notes
date: September 2026
footer: slidev-theme-zhubai · Theme example
authors:
  - name: Zhubai
    institution: A Slidev theme for clear thinking
themeConfig:
  presentation:
    preset: zhubai
    seal: 朱白
---

Make the question visible. Give each result a reason to be here.

::visual::

<div data-visual-slot="question-method-evidence">
  <svg viewBox="0 0 720 220" role="img" aria-label="A clear argument connects a question to a method and then to evidence.">
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
layout: section
kicker: Research practice
---

# Keep the question in view.

The audience should be able to trace every result back to the claim it supports.

---
layout: two-cols
title: Measure what matters
subtitle: Separate predictive quality from confidence quality.
---

# Define the decision boundary

Use held-out data to test whether confidence stays useful after a distribution shift.

<Callout type="note" title="Evaluation rule">

Report discrimination, calibration, and coverage on the same held-out batches.

</Callout>

::right::

# Example results

| Condition | AUROC | ECE | 90% coverage |
| --- | ---: | ---: | ---: |
| In-domain | .91 | .03 | .89 |
| Shifted | .88 | .09 | .73 |

Illustrative values · 12 batches

---
layout: code
title: Make the rule inspectable
subtitle: Keep the operating boundary close to the result.
---

# A simple review rule

```ts
const needsReview =
  calibrationError > 0.05 || coverage90 < 0.85

if (needsReview) {
  routeBatchToManualReview()
}
```

Choose thresholds on validation data. Report performance on held-out test batches.

---
layout: two-cols
title: An auditable workflow
subtitle: One claim, one protocol, one evidence record.
---

# Steps

<Steps>

<ol>
  <li><strong>Define</strong> the target decision.</li>
  <li><strong>Measure</strong> quality and calibration together.</li>
  <li><strong>Record</strong> the limits and owners.</li>
</ol>

</Steps>

::right::

# Slidev-native building blocks

<Callout type="tip" title="Use the same structure">

Layouts, callouts, figures, and author details share one visual system.

</Callout>

<Tag>research</Tag> <Tag>evidence</Tag> <Badge tone="positive" marker>ready to review</Badge>

---
layout: end
title: State the boundary.
---

# Give the evidence room to speak.
