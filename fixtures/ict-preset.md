---
theme: ../
layout: cover
title: Systems That Learn at Scale
subtitle: Efficient architectures for reliable intelligent computing
image: /theme/public/zhubai-card.svg
imageAlt: A note card connected to a presentation canvas
imageFit: contain
footer: Institute of Computing Technology, Chinese Academy of Sciences
authors:
  - name: Xun Zhang
    institution: Institute of Computing Technology, CAS
    email: xun.zhang@ict.ac.cn
themeConfig:
  presentation:
    preset: ict
    chrome: auto
    pageNumber: true
---

**Intelligent Systems Research Seminar**<br>
July 2026 · Beijing

---
title: Research context
subtitle: From computation to dependable intelligence
---

# Computing is a systems problem

Useful intelligence emerges when algorithms, architecture, and infrastructure are designed together.

- **Model** — represent the task with the right inductive structure.
- **System** — move data and computation without wasting either.
- **Evidence** — evaluate quality, efficiency, and robustness as one result.

> **Design principle.** Optimize the whole path from an idea to a reproducible system.

---
layout: toc
title: Research program
subtitle: A concise map of the argument
sections:
  - title: Co-design
    subtitle: Models, architectures, and execution policies
    slideNo: 4
  - title: Reproducible execution
    subtitle: Experiments that remain inspectable
    slideNo: 6
  - title: Evidence
    subtitle: Quality, efficiency, and robustness together
    slideNo: 8
---

# Roadmap

---
layout: section
---

# Co-design

Aligning algorithms with the machines that execute them

---
layout: two-cols
title: Architecture study
subtitle: A model view and a systems view
---

# Learning objective

For model parameters $\theta$ and system policy $\pi$, optimize a shared objective

$$
\min_{\theta,\pi}\; \mathcal{L}(\theta) + \lambda C(\theta,\pi).
$$

The cost term makes latency, memory, and energy visible during design—not after deployment.

::right::

# System evidence

| Metric | Baseline | Co-designed |
| --- | ---: | ---: |
| Accuracy | 87.4% | **89.1%** |
| Latency | 24.8 ms | **13.6 ms** |
| Energy / query | 1.00× | **0.58×** |

One result should explain both capability and computational cost.

---
title: Reproducible execution
subtitle: Keep the experimental contract close to the code
---

# Make every run inspectable

```ts
const run = await experiment({
  model: 'sparse-transformer',
  precision: 'bf16',
  seed: 2026,
  report: ['quality', 'latency', 'energy'],
})
```

Record the configuration, environment, and evaluation protocol with every checkpoint.

---
layout: quote
author: C. Gordon Bell
source: Computer architecture as a research discipline
---

> The most durable computing ideas connect an abstraction to the machine that makes it real.

---
layout: section
---

# Evidence and reproducibility

Connect benchmark results to an inspectable execution path

---
title: Benchmark status
accent: "#b45b2a"
---

# Make operational evidence visible

<Callout type="success" title="System evidence captured">

Record model quality, latency, memory, energy, and the exact execution environment together.

</Callout>

<div class="presentation-label-gallery">
  <Tag>Systems</Tag>
  <Tag>Co-design</Tag>
  <Badge tone="positive" marker>Benchmarked</Badge>
  <Badge tone="caution">环境已归档</Badge>
</div>

Press <Kbd>Esc</Kbd> to leave overview, or use
<Kbd :keys="['Ctrl', 'Shift', 'P']" /> to open commands.

---
layout: two-cols
title: Benchmark record and ownership
---

# Accessible benchmark record

<Figure
  src="/theme/public/zhubai-card.svg"
  alt="A compact card recording one model and system benchmark"
  caption="Figure A. A bounded benchmark record with an authored alternative."
  fit="contain"
/>

::right::

# Study authors

<Authors />

The standalone component exposes the same ordered metadata used by the cover and closing slide.

---
layout: two-cols
title: From profiling to release
---

# Steps

<Steps>

<ol start="3">
  <li><strong>Profile</strong> the workload.</li>
  <li value="7"><strong>Co-design</strong> model and runtime.</li>
  <li><strong>Audit</strong> quality and cost.</li>
</ol>

</Steps>

::right::

# Timeline

<Timeline>

1. <time datetime="2026-03">March</time> — Baseline frozen.
2. <time datetime="2026-06">June</time> — Hardware audit completed.
3. **July** — Artifacts released.

</Timeline>

---
title: Replication status
---

# Presentation-only review checklist

- [x] Record compiler, driver, and accelerator versions.
- [ ] Reproduce the energy measurement on a second host.
- [x] Publish quality and latency from the same run.

The <mark>co-designed execution path</mark> is highlighted as prose, while
`==literal code syntax==` remains code.

---
layout: code
title: Auditable benchmark code
---

# Reproducible benchmark

```ts
const result = await benchmark({
  model: 'sparse-transformer',
  precision: 'bf16',
  warmups: 20,
  samples: 100,
  report: ['quality', 'latency', 'energy'],
})

await result.writeArtifact()
```

---
layout: image-left
title: Benchmark evidence and narrative
image: /theme/public/zhubai-card.svg
imageAlt: Systems benchmark card placed to the left of the narrative
caption: Figure B. The figure moves visually, not structurally.
backgroundSize: contain
---

# Inspectable execution

The left-hand presentation keeps the narrative first for assistive technology and export while
placing the benchmark record beside it.

---
layout: image-right
title: Alternative benchmark orientation
image: /theme/public/zhubai-card.svg
imageAlt: Systems benchmark card placed to the right of the narrative
caption: Figure C. The mirrored layout preserves the same authoring contract.
backgroundSize: contain
---

# One contract, two orientations

Use the right orientation when the system diagram should follow the explanation. Caption,
alternative text, containment, and failure behavior remain unchanged.

---
layout: statement
---

# Better intelligence begins with better systems.

Measure the model and the machine as one research object.

---
layout: references
---

# References

1. Hennessy, J. L. and Patterson, D. A. *A New Golden Age for Computer Architecture.* Communications of the ACM, 2019.
2. Sze, V. et al. *Efficient Processing of Deep Neural Networks: A Tutorial and Survey.* Proceedings of the IEEE, 2017.
3. Institute of Computing Technology, Chinese Academy of Sciences. *Visual Identity Assets.*

---
layout: center
---

# Model quality and system cost belong in the same result.

The claim is complete only when it survives a second execution environment.

---
layout: end
---

# Thank you · 谢谢
