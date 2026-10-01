---
theme: ../
lang: en
fonts:
  italic: true
authors:
  - name: Alexandra Morgan
    institution: Institute for Computational Systems, Example University
    email: alexandra.morgan@example.org
  - name: Daniel Kim
    institution: Institute for Computational Systems, Example University
  - name: Sofia Martínez
    institution: Centre for Reliable Machine Learning, Example Institute
    email: sofia.martinez@example.org
footer: Systems & Evidence · illustrative data
themeConfig:
  presentation:
    preset: zhubai
layout: cover
title: Reliable Decisions under Distribution Shift
subtitle: A reproducible workflow for comparing methods, measuring uncertainty, and explaining tradeoffs.
eyebrow: RESEARCH SEMINAR · SYSTEMS & EVIDENCE
date: October 2026
---

A collaborative research talk. Names, affiliations, and measurements are illustrative.

---
layout: "section"
index: "01"
kicker: "QUESTION · MEASUREMENT"
presentation: {"preset":"zhubai"}
---

# What changes when the data changes?

State the question before choosing the metric.

---
layout: "default"
kicker: "RESEARCH QUESTION"
presentation: {"preset":"zhubai"}
---

# A result needs a reproducible comparison

A useful comparison makes its *assumptions*, **measurement conditions, and limitations** visible to the audience.

- Use the same workload and evaluation budget for both methods.
- Report uncertainty alongside the average performance.
- Record the observation window and the source of every measurement.[^data]

<Callout type="note" title="Keep the operating boundary beside the claim">

The measurements in this deck are illustrative and are not experimental findings.

</Callout>

[^data]: Example dataset · identical workloads, budgets, and measurement windows.

---
layout: "two-cols-header"
columnRatio: 0.6
presentation: {"preset":"zhubai"}
---

# Compare coverage and cost together

::left::

<svg viewBox="0 0 560 245" role="img" aria-label="Illustrative chart: coverage improves as the evidence budget increases, then levels off.">
<path d="M50 20v175h475" fill="none" stroke="currentColor" opacity=".4" />
<path d="M50 170C140 110 245 58 525 42" fill="none" stroke="var(--presentation-chart-1)" stroke-width="4" />
<path d="M50 172C200 160 345 126 525 95" fill="none" stroke="var(--presentation-chart-2)" stroke-width="3" stroke-dasharray="8 6" />
<text x="50" y="225" fill="currentColor" style="font-size:17px">Small budget</text>
<text x="410" y="225" fill="currentColor" style="font-size:17px">Full budget</text>
</svg>

Solid: proposed method · Dashed: baseline.

::right::

| Method | Coverage | Latency |
| --- | ---: | ---: |
| Baseline | 73% | 28 ms |
| Proposed | 89% | 34 ms |

The extra 6 ms is part of the result, alongside the 16 percentage point gain.

::bottom::

Illustrative data · equal budgets and identical workloads.

---
layout: "two-cols"
columnRatio: 0.55
presentation: {"preset":"zhubai"}
---

# What the average conceals

The mean describes the centre of the observations. It does not describe every request.

$$\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i$$

Always state the sample and the observation window.

::right::

# Check the long tail

| Measure | Before | After |
| --- | ---: | ---: |
| p50 latency | 180 ms | 110 ms |
| p95 latency | 430 ms | 280 ms |
| Error rate | 0.2% | 0.2% |

Example data · report the distribution, not just a single number.

---
layout: "quote"
author: "Research working principle"
source: "Systems & Evidence seminar"
presentation: {"preset":"zhubai"}
---

> A useful result tells us both what changed and the conditions under which the change holds.

---
layout: "code"
presentation: {"preset":"zhubai"}
---

# Make independent work explicit

```ts
const [documents, profile] = await Promise.all([
  retrieve(query),
  loadProfile(userId),
])
return rank(documents, profile)
```

The two operations must be independent. Each needs a timeout and an observable failure path.

---
layout: "references"
presentation: {"preset":"zhubai"}
---

# Make the evidence traceable

1. **Measurement protocol.** Equal workloads, budgets, and observation windows.
2. **Dataset record.** All values in this demonstration are illustrative.
3. **Reproduction notes.** Record parameters, source revisions, and known limitations.

Use this page for the actual sources and reproduction details of your talk.

---
layout: "end"
presentation: {"preset":"zhubai"}
---

# Better evidence, clearer decisions

Explain the improvement, its cost, and the boundary of the claim.

---
layout: "cover"
title: "Reliable Decisions under Distribution Shift"
subtitle: "A reproducible workflow for comparing methods, measuring uncertainty, and explaining tradeoffs."
eyebrow: "RESEARCH SEMINAR · SYSTEMS & EVIDENCE"
date: "October 2026"
presentation: {"preset":"qingdai"}
---

A collaborative research talk. Names, affiliations, and measurements are illustrative.

---
layout: "section"
index: "01"
kicker: "QUESTION · MEASUREMENT"
presentation: {"preset":"qingdai"}
---

# What changes when the data changes?

State the question before choosing the metric.

---
layout: "default"
kicker: "RESEARCH QUESTION"
presentation: {"preset":"qingdai"}
---

# A result needs a reproducible comparison

A useful comparison makes its *assumptions*, **measurement conditions, and limitations** visible to the audience.

- Use the same workload and evaluation budget for both methods.
- Report uncertainty alongside the average performance.
- Record the observation window and the source of every measurement.[^data]

<Callout type="note" title="Keep the operating boundary beside the claim">

The measurements in this deck are illustrative and are not experimental findings.

</Callout>

[^data]: Example dataset · identical workloads, budgets, and measurement windows.

---
layout: "two-cols-header"
columnRatio: 0.6
presentation: {"preset":"qingdai"}
---

# Compare coverage and cost together

::left::

<svg viewBox="0 0 560 245" role="img" aria-label="Illustrative chart: coverage improves as the evidence budget increases, then levels off.">
<path d="M50 20v175h475" fill="none" stroke="currentColor" opacity=".4" />
<path d="M50 170C140 110 245 58 525 42" fill="none" stroke="var(--presentation-chart-1)" stroke-width="4" />
<path d="M50 172C200 160 345 126 525 95" fill="none" stroke="var(--presentation-chart-2)" stroke-width="3" stroke-dasharray="8 6" />
<text x="50" y="225" fill="currentColor" style="font-size:17px">Small budget</text>
<text x="410" y="225" fill="currentColor" style="font-size:17px">Full budget</text>
</svg>

Solid: proposed method · Dashed: baseline.

::right::

| Method | Coverage | Latency |
| --- | ---: | ---: |
| Baseline | 73% | 28 ms |
| Proposed | 89% | 34 ms |

The extra 6 ms is part of the result, alongside the 16 percentage point gain.

::bottom::

Illustrative data · equal budgets and identical workloads.

---
layout: "two-cols"
columnRatio: 0.55
presentation: {"preset":"qingdai"}
---

# What the average conceals

The mean describes the centre of the observations. It does not describe every request.

$$\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i$$

Always state the sample and the observation window.

::right::

# Check the long tail

| Measure | Before | After |
| --- | ---: | ---: |
| p50 latency | 180 ms | 110 ms |
| p95 latency | 430 ms | 280 ms |
| Error rate | 0.2% | 0.2% |

Example data · report the distribution, not just a single number.

---
layout: "quote"
author: "Research working principle"
source: "Systems & Evidence seminar"
presentation: {"preset":"qingdai"}
---

> A useful result tells us both what changed and the conditions under which the change holds.

---
layout: "code"
presentation: {"preset":"qingdai"}
---

# Make independent work explicit

```ts
const [documents, profile] = await Promise.all([
  retrieve(query),
  loadProfile(userId),
])
return rank(documents, profile)
```

The two operations must be independent. Each needs a timeout and an observable failure path.

---
layout: "references"
presentation: {"preset":"qingdai"}
---

# Make the evidence traceable

1. **Measurement protocol.** Equal workloads, budgets, and observation windows.
2. **Dataset record.** All values in this demonstration are illustrative.
3. **Reproduction notes.** Record parameters, source revisions, and known limitations.

Use this page for the actual sources and reproduction details of your talk.

---
layout: "end"
presentation: {"preset":"qingdai"}
---

# Better evidence, clearer decisions

Explain the improvement, its cost, and the boundary of the claim.

---
layout: "cover"
title: "Reliable Decisions under Distribution Shift"
subtitle: "A reproducible workflow for comparing methods, measuring uncertainty, and explaining tradeoffs."
eyebrow: "RESEARCH SEMINAR · SYSTEMS & EVIDENCE"
date: "October 2026"
presentation: {"preset":"songmo"}
---

A collaborative research talk. Names, affiliations, and measurements are illustrative.

---
layout: "section"
index: "01"
kicker: "QUESTION · MEASUREMENT"
presentation: {"preset":"songmo"}
---

# What changes when the data changes?

State the question before choosing the metric.

---
layout: "default"
kicker: "RESEARCH QUESTION"
presentation: {"preset":"songmo"}
---

# A result needs a reproducible comparison

A useful comparison makes its *assumptions*, **measurement conditions, and limitations** visible to the audience.

- Use the same workload and evaluation budget for both methods.
- Report uncertainty alongside the average performance.
- Record the observation window and the source of every measurement.[^data]

<Callout type="note" title="Keep the operating boundary beside the claim">

The measurements in this deck are illustrative and are not experimental findings.

</Callout>

[^data]: Example dataset · identical workloads, budgets, and measurement windows.

---
layout: "two-cols-header"
columnRatio: 0.6
presentation: {"preset":"songmo"}
---

# Compare coverage and cost together

::left::

<svg viewBox="0 0 560 245" role="img" aria-label="Illustrative chart: coverage improves as the evidence budget increases, then levels off.">
<path d="M50 20v175h475" fill="none" stroke="currentColor" opacity=".4" />
<path d="M50 170C140 110 245 58 525 42" fill="none" stroke="var(--presentation-chart-1)" stroke-width="4" />
<path d="M50 172C200 160 345 126 525 95" fill="none" stroke="var(--presentation-chart-2)" stroke-width="3" stroke-dasharray="8 6" />
<text x="50" y="225" fill="currentColor" style="font-size:17px">Small budget</text>
<text x="410" y="225" fill="currentColor" style="font-size:17px">Full budget</text>
</svg>

Solid: proposed method · Dashed: baseline.

::right::

| Method | Coverage | Latency |
| --- | ---: | ---: |
| Baseline | 73% | 28 ms |
| Proposed | 89% | 34 ms |

The extra 6 ms is part of the result, alongside the 16 percentage point gain.

::bottom::

Illustrative data · equal budgets and identical workloads.

---
layout: "two-cols"
columnRatio: 0.55
presentation: {"preset":"songmo"}
---

# What the average conceals

The mean describes the centre of the observations. It does not describe every request.

$$\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i$$

Always state the sample and the observation window.

::right::

# Check the long tail

| Measure | Before | After |
| --- | ---: | ---: |
| p50 latency | 180 ms | 110 ms |
| p95 latency | 430 ms | 280 ms |
| Error rate | 0.2% | 0.2% |

Example data · report the distribution, not just a single number.

---
layout: "quote"
author: "Research working principle"
source: "Systems & Evidence seminar"
presentation: {"preset":"songmo"}
---

> A useful result tells us both what changed and the conditions under which the change holds.

---
layout: "code"
presentation: {"preset":"songmo"}
---

# Make independent work explicit

```ts
const [documents, profile] = await Promise.all([
  retrieve(query),
  loadProfile(userId),
])
return rank(documents, profile)
```

The two operations must be independent. Each needs a timeout and an observable failure path.

---
layout: "references"
presentation: {"preset":"songmo"}
---

# Make the evidence traceable

1. **Measurement protocol.** Equal workloads, budgets, and observation windows.
2. **Dataset record.** All values in this demonstration are illustrative.
3. **Reproduction notes.** Record parameters, source revisions, and known limitations.

Use this page for the actual sources and reproduction details of your talk.

---
layout: "end"
presentation: {"preset":"songmo"}
---

# Better evidence, clearer decisions

Explain the improvement, its cost, and the boundary of the claim.

---
layout: "cover"
title: "Reliable Decisions under Distribution Shift"
subtitle: "A reproducible workflow for comparing methods, measuring uncertainty, and explaining tradeoffs."
eyebrow: "RESEARCH SEMINAR · SYSTEMS & EVIDENCE"
date: "October 2026"
presentation: {"preset":"ucas"}
---

A collaborative research talk. Names, affiliations, and measurements are illustrative.

---
layout: "section"
index: "01"
kicker: "QUESTION · MEASUREMENT"
presentation: {"preset":"ucas"}
---

# What changes when the data changes?

State the question before choosing the metric.

---
layout: "default"
kicker: "RESEARCH QUESTION"
presentation: {"preset":"ucas"}
---

# A result needs a reproducible comparison

A useful comparison makes its *assumptions*, **measurement conditions, and limitations** visible to the audience.

- Use the same workload and evaluation budget for both methods.
- Report uncertainty alongside the average performance.
- Record the observation window and the source of every measurement.[^data]

<Callout type="note" title="Keep the operating boundary beside the claim">

The measurements in this deck are illustrative and are not experimental findings.

</Callout>

[^data]: Example dataset · identical workloads, budgets, and measurement windows.

---
layout: "two-cols-header"
columnRatio: 0.6
presentation: {"preset":"ucas"}
---

# Compare coverage and cost together

::left::

<svg viewBox="0 0 560 245" role="img" aria-label="Illustrative chart: coverage improves as the evidence budget increases, then levels off.">
<path d="M50 20v175h475" fill="none" stroke="currentColor" opacity=".4" />
<path d="M50 170C140 110 245 58 525 42" fill="none" stroke="var(--presentation-chart-1)" stroke-width="4" />
<path d="M50 172C200 160 345 126 525 95" fill="none" stroke="var(--presentation-chart-2)" stroke-width="3" stroke-dasharray="8 6" />
<text x="50" y="225" fill="currentColor" style="font-size:17px">Small budget</text>
<text x="410" y="225" fill="currentColor" style="font-size:17px">Full budget</text>
</svg>

Solid: proposed method · Dashed: baseline.

::right::

| Method | Coverage | Latency |
| --- | ---: | ---: |
| Baseline | 73% | 28 ms |
| Proposed | 89% | 34 ms |

The extra 6 ms is part of the result, alongside the 16 percentage point gain.

::bottom::

Illustrative data · equal budgets and identical workloads.

---
layout: "two-cols"
columnRatio: 0.55
presentation: {"preset":"ucas"}
---

# What the average conceals

The mean describes the centre of the observations. It does not describe every request.

$$\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i$$

Always state the sample and the observation window.

::right::

# Check the long tail

| Measure | Before | After |
| --- | ---: | ---: |
| p50 latency | 180 ms | 110 ms |
| p95 latency | 430 ms | 280 ms |
| Error rate | 0.2% | 0.2% |

Example data · report the distribution, not just a single number.

---
layout: "quote"
author: "Research working principle"
source: "Systems & Evidence seminar"
presentation: {"preset":"ucas"}
---

> A useful result tells us both what changed and the conditions under which the change holds.

---
layout: "code"
presentation: {"preset":"ucas"}
---

# Make independent work explicit

```ts
const [documents, profile] = await Promise.all([
  retrieve(query),
  loadProfile(userId),
])
return rank(documents, profile)
```

The two operations must be independent. Each needs a timeout and an observable failure path.

---
layout: "references"
presentation: {"preset":"ucas"}
---

# Make the evidence traceable

1. **Measurement protocol.** Equal workloads, budgets, and observation windows.
2. **Dataset record.** All values in this demonstration are illustrative.
3. **Reproduction notes.** Record parameters, source revisions, and known limitations.

Use this page for the actual sources and reproduction details of your talk.

---
layout: "end"
presentation: {"preset":"ucas"}
---

# Better evidence, clearer decisions

Explain the improvement, its cost, and the boundary of the claim.

---
layout: "cover"
title: "Reliable Decisions under Distribution Shift"
subtitle: "A reproducible workflow for comparing methods, measuring uncertainty, and explaining tradeoffs."
eyebrow: "RESEARCH SEMINAR · SYSTEMS & EVIDENCE"
date: "October 2026"
presentation: {"preset":"ict"}
---

A collaborative research talk. Names, affiliations, and measurements are illustrative.

---
layout: "section"
index: "01"
kicker: "QUESTION · MEASUREMENT"
presentation: {"preset":"ict"}
---

# What changes when the data changes?

State the question before choosing the metric.

---
layout: "default"
kicker: "RESEARCH QUESTION"
presentation: {"preset":"ict"}
---

# A result needs a reproducible comparison

A useful comparison makes its *assumptions*, **measurement conditions, and limitations** visible to the audience.

- Use the same workload and evaluation budget for both methods.
- Report uncertainty alongside the average performance.
- Record the observation window and the source of every measurement.[^data]

<Callout type="note" title="Keep the operating boundary beside the claim">

The measurements in this deck are illustrative and are not experimental findings.

</Callout>

[^data]: Example dataset · identical workloads, budgets, and measurement windows.

---
layout: "two-cols-header"
columnRatio: 0.6
presentation: {"preset":"ict"}
---

# Compare coverage and cost together

::left::

<svg viewBox="0 0 560 245" role="img" aria-label="Illustrative chart: coverage improves as the evidence budget increases, then levels off.">
<path d="M50 20v175h475" fill="none" stroke="currentColor" opacity=".4" />
<path d="M50 170C140 110 245 58 525 42" fill="none" stroke="var(--presentation-chart-1)" stroke-width="4" />
<path d="M50 172C200 160 345 126 525 95" fill="none" stroke="var(--presentation-chart-2)" stroke-width="3" stroke-dasharray="8 6" />
<text x="50" y="225" fill="currentColor" style="font-size:17px">Small budget</text>
<text x="410" y="225" fill="currentColor" style="font-size:17px">Full budget</text>
</svg>

Solid: proposed method · Dashed: baseline.

::right::

| Method | Coverage | Latency |
| --- | ---: | ---: |
| Baseline | 73% | 28 ms |
| Proposed | 89% | 34 ms |

The extra 6 ms is part of the result, alongside the 16 percentage point gain.

::bottom::

Illustrative data · equal budgets and identical workloads.

---
layout: "two-cols"
columnRatio: 0.55
presentation: {"preset":"ict"}
---

# What the average conceals

The mean describes the centre of the observations. It does not describe every request.

$$\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i$$

Always state the sample and the observation window.

::right::

# Check the long tail

| Measure | Before | After |
| --- | ---: | ---: |
| p50 latency | 180 ms | 110 ms |
| p95 latency | 430 ms | 280 ms |
| Error rate | 0.2% | 0.2% |

Example data · report the distribution, not just a single number.

---
layout: "quote"
author: "Research working principle"
source: "Systems & Evidence seminar"
presentation: {"preset":"ict"}
---

> A useful result tells us both what changed and the conditions under which the change holds.

---
layout: "code"
presentation: {"preset":"ict"}
---

# Make independent work explicit

```ts
const [documents, profile] = await Promise.all([
  retrieve(query),
  loadProfile(userId),
])
return rank(documents, profile)
```

The two operations must be independent. Each needs a timeout and an observable failure path.

---
layout: "references"
presentation: {"preset":"ict"}
---

# Make the evidence traceable

1. **Measurement protocol.** Equal workloads, budgets, and observation windows.
2. **Dataset record.** All values in this demonstration are illustrative.
3. **Reproduction notes.** Record parameters, source revisions, and known limitations.

Use this page for the actual sources and reproduction details of your talk.

---
layout: "end"
presentation: {"preset":"ict"}
---

# Better evidence, clearer decisions

Explain the improvement, its cost, and the boundary of the claim.
