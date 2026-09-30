---
theme: ../
layout: cover
title: The Shape of a Clear Argument
subtitle: One question, a careful method, evidence worth returning to.
eyebrow: Research colloquium · 01
date: September 2026
footer: Field notes / Zhubai
authors:
  - name: Mira Chen
    institution: Systems Research Group
themeConfig:
  presentation:
    preset: zhubai
---

Begin with the question the audience should still remember tomorrow.

---
layout: section
kicker: Inquiry
---

# Start with one good question.

Then make every chart, method, and conclusion answer it.

---
layout: two-cols
title: Confidence under distribution shift
subtitle: A result is useful only inside a stated operating boundary.
---

# What changes when the data changes?

<svg viewBox="0 0 560 300" role="img" aria-label="A conceptual plot shows confidence becoming less reliable as a sample moves farther from the training distribution.">
  <path d="M56 24v224h476" fill="none" stroke="currentColor" stroke-width="2" />
  <path d="M58 74c70 14 91 29 135 54s88 48 126 61 91 23 211 31" fill="none" stroke="var(--zhubai-chart-1)" stroke-width="4" />
  <path d="M58 80c94 7 167 26 240 58s138 51 232 67" fill="none" stroke="var(--zhubai-chart-2)" stroke-width="2" stroke-dasharray="7 8" opacity=".55" />
  <text x="58" y="282" fill="currentColor" font-family="system-ui, sans-serif" style="font-size:16px">In distribution</text>
  <text x="397" y="282" fill="currentColor" font-family="system-ui, sans-serif" style="font-size:16px">Shifted data</text>
</svg>

::right::

# State the boundary

| Measure | In-domain | Shifted |
| --- | ---: | ---: |
| AUROC | .91 | .88 |
| ECE | .03 | .09 |
| 90% coverage | .89 | .73 |

Illustrative values · held-out evaluation.

<Callout type="note" title="Read the whole result">

Ranking stays useful while confidence deteriorates. Calibration needs its own test.

</Callout>

---
layout: end
title: A result is only as strong as its boundary.
---

# Confidence needs context.

---
layout: cover
presentationPreset: ucas
title: 从几何结构，到可信的科学证据
subtitle: Geometry, from symmetry to evidence.
eyebrow: UCAS · research colloquium
date: September 2026
---

等变性给出结构，受控实验检验结构是否真正有用。

---
layout: section
presentationPreset: ucas
kicker: Foundations
---

# Invariants before optimization.

Define the transformation and the quantity that should remain stable.

---
layout: two-cols
presentationPreset: ucas
title: A geometric model
subtitle: Separate mathematical structure from empirical evidence.
---

# State the symmetry

对群 $G$ 在空间 $X$ 上的作用，等变映射保持输入变换与输出变换之间的对应关系：

$$f(g \cdot x) = \rho(g) f(x).$$

The constraint expresses a hypothesis about the data. It does not replace an empirical test.

::right::

# Test the claim

| Evaluation | Baseline | Equivariant |
| --- | ---: | ---: |
| Data efficiency | .71 | .84 |
| Stability | .78 | .91 |
| Scale transfer | .64 | .79 |

Illustrative values across five fixed seeds.

<Callout type="note" title="实验边界">相同划分、相同预算，并报告多次运行的变化范围。</Callout>

---
layout: end
presentationPreset: ucas
title: Symmetry proposes structure.
---

# Experiments decide whether it helps.

---
layout: cover
presentationPreset: ict
title: Measure the Whole System
subtitle: 模型质量与执行成本，应当出现在同一份结果中。
eyebrow: ICT · systems seminar
date: September 2026
---

Trace the full path from an idea to a reproducible run.

---
layout: section
presentationPreset: ict
kicker: Co-design
---

# Model. Runtime. Evidence.

The system boundary is part of the research question.

---
layout: two-cols
presentationPreset: ict
title: A reproducible execution path
subtitle: Report capability and computational cost together.
---

# Record the run

```yaml
model: sparse-transformer
precision: bf16
seed: 2026
report: [quality, latency, energy]
```

Keep the workload, precision, and hardware in the record. A fast result should remain reproducible.

::right::

# Compare under one protocol

| Measure | Baseline | Co-designed |
| --- | ---: | ---: |
| Accuracy | 87.4% | 89.1% |
| Latency | 24.8 ms | 13.6 ms |
| Energy / query | 1.00× | 0.58× |

Illustrative benchmark values; same host and workload.

<Callout type="tip" title="Joint evaluation">Accuracy rises by 1.7 points while latency falls by 45% in this illustrative comparison.</Callout>

---
layout: end
presentationPreset: ict
title: A faster result must still be right.
---

# Keep quality and cost together.

---
layout: cover
presentationCoverAlign: center
title: One question. Three useful habits.
subtitle: Ask clearly · test carefully · show the evidence
eyebrow: Research notes
date: September 2026
---

Let the question determine what the audience sees first.

::visual::

<div data-visual-slot="centered-research-flow">
  <svg viewBox="0 0 720 180" role="img" aria-label="A research sequence connecting a question, a method, and evidence.">
    <path d="M164 90h144m104 0h144" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M299 82l9 8-9 8M547 82l9 8-9 8" fill="none" stroke="currentColor" stroke-width="2" />
    <g fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="112" cy="90" r="52" />
      <circle cx="360" cy="90" r="52" />
      <circle cx="608" cy="90" r="52" />
    </g>
    <g fill="currentColor" font-family="system-ui, sans-serif" style="font-size:18px" text-anchor="middle">
      <text x="112" y="96">Question</text>
      <text x="360" y="96">Method</text>
      <text x="608" y="96">Evidence</text>
    </g>
  </svg>
</div>

---
layout: cover
presentationPreset: ucas
presentationCoverAlign: center
title: One question. Three useful habits.
subtitle: Ask clearly · test carefully · show the evidence
eyebrow: Research notes
date: September 2026
---

Let the question determine what the audience sees first.

::visual::

<div data-visual-slot="centered-research-flow">
  <svg viewBox="0 0 720 180" role="img" aria-label="A research sequence connecting a question, a method, and evidence.">
    <path d="M164 90h144m104 0h144" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M299 82l9 8-9 8M547 82l9 8-9 8" fill="none" stroke="currentColor" stroke-width="2" />
    <g fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="112" cy="90" r="52" />
      <circle cx="360" cy="90" r="52" />
      <circle cx="608" cy="90" r="52" />
    </g>
    <g fill="currentColor" font-family="system-ui, sans-serif" style="font-size:18px" text-anchor="middle">
      <text x="112" y="96">Question</text>
      <text x="360" y="96">Method</text>
      <text x="608" y="96">Evidence</text>
    </g>
  </svg>
</div>

---
layout: cover
presentationPreset: ict
presentationCoverAlign: center
title: One question. Three useful habits.
subtitle: Ask clearly · test carefully · show the evidence
eyebrow: Research notes
date: September 2026
---

Let the question determine what the audience sees first.

::visual::

<div data-visual-slot="centered-research-flow">
  <svg viewBox="0 0 720 180" role="img" aria-label="A research sequence connecting a question, a method, and evidence.">
    <path d="M164 90h144m104 0h144" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M299 82l9 8-9 8M547 82l9 8-9 8" fill="none" stroke="currentColor" stroke-width="2" />
    <g fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="112" cy="90" r="52" />
      <circle cx="360" cy="90" r="52" />
      <circle cx="608" cy="90" r="52" />
    </g>
    <g fill="currentColor" font-family="system-ui, sans-serif" style="font-size:18px" text-anchor="middle">
      <text x="112" y="96">Question</text>
      <text x="360" y="96">Method</text>
      <text x="608" y="96">Evidence</text>
    </g>
  </svg>
</div>

---
layout: statement
presentationPreset: zhubai
---

# Make <mark>evidence</mark> count.

<p lang="zh-CN">让证据成为判断的依据。</p>

---
layout: statement
presentationPreset: ucas
---

# Make <mark>evidence</mark> count.

<p lang="zh-CN">让证据成为判断的依据。</p>

---
layout: statement
presentationPreset: ict
---

# Make <mark>evidence</mark> count.

<p lang="zh-CN">让证据成为判断的依据。</p>
