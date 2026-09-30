---
theme: ../
layout: cover
title: Geometric Learning and Scientific Discovery
subtitle: From mathematical structure to reliable models
footer: University of Chinese Academy of Sciences
authors:
  - name: Xun Zhang
    institution: UCAS · School of Computer Science
    email: xun.zhang@ucas.ac.cn
themeConfig:
  presentation:
    preset: ucas
    chrome: auto
    header: false
    footerAuthors: true
    pageNumber: true
---

**Summer Geometry Initiative**<br>
July 2026 · Beijing

---
title: Research motivation
subtitle: A calm, rigorous visual system for scientific arguments
---

# Geometry gives models structure

Scientific presentations need to make the chain of reasoning visible before they make it impressive.

- **Structure** — encode invariance and symmetry explicitly.
- **Evidence** — distinguish observation, assumption, and conclusion.
- **Communication** — let diagrams, equations, and results share one hierarchy.

> **Research note.** The UCAS preset keeps the institutional identity present without competing with the scientific content.

---
layout: section
---

# Foundations

From geometric priors to testable hypotheses

---
layout: two-cols
title: Model design
subtitle: Two complementary views
---

# Mathematical view

Let $G$ act on the input space $X$. A representation $f$ is equivariant when

$$
f(g \cdot x) = \rho(g) f(x).
$$

This constraint reduces the hypothesis space while preserving relevant structure.

::right::

# Experimental view

| Criterion | Baseline | UCAS model |
| --- | ---: | ---: |
| Data efficiency | 0.71 | **0.84** |
| Stability | 0.78 | **0.91** |
| Interpretability | 0.62 | **0.86** |

The gain should remain visible across seeds, scales, and ablations.

---
layout: quote
author: Shiing-Shen Chern
source: Geometric insight as a research practice
---

> The most useful abstraction is the one that makes the next experiment clearer.

---
layout: section
---

# Evidence and reproducibility

From an equivariant hypothesis to an inspectable result

---
title: Review signals
accent: "#a24b2a"
---

# Make the evidence state visible

<Callout type="note" title="Invariant under review">

State the group action, the tested equivariance error, and the seeds used for every ablation.

</Callout>

<div class="presentation-label-gallery">
  <Tag>Geometry</Tag>
  <Tag>Equivariance</Tag>
  <Badge tone="positive" marker>Verified</Badge>
  <Badge tone="question">可复现</Badge>
</div>

Press <Kbd>Esc</Kbd> to leave overview, or use
<Kbd :keys="['Ctrl', 'Shift', 'P']" /> to open commands.

---
layout: two-cols
title: Experiment record and ownership
---

# Accessible experiment record

<Figure
  src="/theme/public/zhubai-card.svg"
  alt="A compact research card representing a geometric experiment record"
  caption="Figure A. Caption and alternative text are authored separately."
  fit="contain"
/>

::right::

# Study authors

<Authors />

Deck metadata is reused without duplicating author markup on the slide.

---
layout: two-cols
title: From hypothesis to release
---

# Steps

<Steps>

<ol start="4">
  <li><strong>Define</strong> the symmetry.</li>
  <li value="8"><strong>Construct</strong> the representation.</li>
  <li><strong>Test</strong> the equivariance error.</li>
</ol>

</Steps>

::right::

# Timeline

<Timeline>

1. <time datetime="2026-04">April</time> — Hypothesis registered.
2. <time datetime="2026-06">June</time> — Ablations completed.
3. **July** — Results released.

</Timeline>

---
title: Replication status
---

# Presentation-only review checklist

- [x] Archive every seed and configuration.
- [ ] Replicate the scale-transfer experiment.
- [x] Publish the equivariance error distribution.

The <mark>pre-registered geometric prior</mark> is highlighted as prose, while
`==literal code syntax==` remains code.

---
layout: code
title: Auditable equivariance code
---

# Equivariance check

```python
def equivariance_error(model, group, sample):
    transformed = model(group.act(sample))
    expected = group.represent(model(sample))
    return (transformed - expected).norm()

assert equivariance_error(model, rotation, x) < 1e-4
```

---
layout: image-left
title: Geometric evidence and narrative
image: /theme/public/zhubai-card.svg
imageAlt: Geometric experiment card placed to the left of the narrative
caption: Figure B. The narrative remains first in source order.
backgroundSize: contain
---

# Structure made visible

The left orientation pairs an accessible research figure with the argument while retaining
logical narrative-first DOM order.

---
layout: image-right
title: Alternative evidence orientation
image: /theme/public/zhubai-card.svg
imageAlt: Geometric experiment card placed to the right of the narrative
caption: Figure C. Visual orientation changes without changing reading order.
backgroundSize: contain
---

# Evidence beside the model

The mirrored orientation uses the same inputs, figure semantics, fallback behavior, and
containment rules.

---
layout: statement
---

# Structure first. Evidence always.

A UCAS presentation should feel composed, exact, and ready for scrutiny.

---
layout: references
---

# References

1. Bronstein, M. M. et al. *Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges.* 2021.
2. Cohen, T. and Welling, M. *Group Equivariant Convolutional Networks.* ICML, 2016.
3. University of Chinese Academy of Sciences. *Visual Identity Assets.*

---
layout: center
---

# Geometry proposes structure. Experiments decide whether it helps.

Keep the symmetry, ablations, and scale-transfer evidence together.

---
layout: end
---

# Thank you · 谢谢
