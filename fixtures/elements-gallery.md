---
theme: ../
layout: toc
footer: Research notes · 2026
authors:
  - name: Xun Zhang
    institution: Research & systems
    email: xun@example.org
  - name: Lin Chen
    institution: Design & communication
    email: lin@example.org
themeConfig:
  presentation:
    preset: default
    footerAuthors: false
presentationPreset: default
title: A clearer research story
sections:
  - title: The question · 研究问题
    subtitle: Give the audience a useful starting point.
    slideNo: 2
  - title: The evidence · 实验与证据
    subtitle: Make comparisons easy to read.
    slideNo: 3
  - title: The method · 方法与实现
    subtitle: Show the decisions behind the result.
    slideNo: 4
  - title: Discussion · 讨论
    subtitle: Leave room for the next question.
    slideNo: 10
---



---
layout: default
presentationPreset: default
---

# Start with a clear question.

好的表达，让听众知道什么最值得关注。

- **One idea at a time.** Build a line of reasoning the audience can follow.
- **Evidence in context.** Explain what changed and why it matters.
- **Room to reflect.** Leave enough space for the key observation.

<Callout type="note" title="Research note · 研究笔记">
Keep assumptions close to the claim. A short qualification is often enough.
</Callout>

<Callout type="warning" title="A limit to acknowledge · 适用边界">
A useful result should make its limits visible.
</Callout>

---
layout: two-cols
presentationPreset: default
---

# Evidence, made legible.

Illustrative measurements · 示例数据

| Method | Latency ↓ | Quality ↑ |
| :--- | ---: | ---: |
| Baseline | 42 ms | 86.2% |
| Tuned | 31 ms | 89.4% |
| **Proposed** | **24 ms** | **92.1%** |

<Badge tone="positive" marker>Reproduced</Badge> <Tag>experiment / 03</Tag>

::right::

## A reproducible process

<Steps>

1. **Define** a useful comparison.
2. **Measure** under the same conditions.
3. **Report** uncertainty with the result.

</Steps>

Use <Kbd :keys="['Ctrl', 'Enter']" /> to run the notebook.

---
layout: code
presentationPreset: default
---

# Make the method visible.

```ts {all|3-5|all}
type Observation = { latency: number; quality: number }

function summarize(samples: Observation[]) {
  const total = samples.reduce((sum, s) => sum + s.latency, 0)
  const latency = total / samples.length
  return { latency, count: samples.length }
}

const result = summarize(measurements)
console.log(result)
```

<p class="presentation-code-note">A small, readable example · 在相同条件下重复测量，并保留原始记录。</p>

---
layout: quote
presentationPreset: default
author: Research notes
source: 关于表达的一点思考
---

<p lang="zh">让复杂的问题，有清晰的表达。</p>

Good research deserves a clear explanation.

---
layout: image-right
presentationPreset: default
image: /theme/public/lilas-card.svg
imageAlt: A sample card for a presentation
caption: "Figure 1 · From research notes to a presentation. Theme source illustration."
---

# Give the figure a point.

A figure should answer a question before it adds another.

- **Show the relationship.** Keep the comparison visible.
- **Name the limits.** Put context in the caption.

<Callout type="tip" title="Figure practice · 配图原则">
Use a complete caption and a meaningful alternative description.
</Callout>

---
layout: references
presentationPreset: default
---

# Sources & acknowledgements

1. **Method and implementation.** Experiment protocol, measurement conditions, and reusable analysis code.
2. **Evidence and limitations.** Complete results, failure cases, and the assumptions used in interpretation.
3. **Related work.** [Slidev documentation](https://sli.dev) · presentation authoring and reproducible examples.

## Research team

<Authors />

Thank you to everyone who questioned, measured, and refined the work.

---
layout: default
presentationPreset: default
---

# A little structure, a lot of clarity.

<Timeline>

1. **Explore** — ask a precise question.
2. **Build** — turn the idea into a useful test.
3. **Reflect** — connect the result to the next question.

</Timeline>

> A useful observation connects the evidence with the question.

A simple `config` value, a <Tag>research note</Tag>, and a <Badge tone="info" marker>Draft</Badge> should support the reading rhythm.

---
layout: section
presentationPreset: default
---

# From evidence to insight.

把观察，变成可以讨论的结论。

---
layout: end
presentationPreset: default
contact: xun@example.org
showAuthors: true
---

# Let’s keep the conversation going.

感谢聆听，欢迎交流。

---
layout: toc
presentationPreset: ucas
title: A clearer research story
sections:
  - title: The question · 研究问题
    subtitle: Give the audience a useful starting point.
    slideNo: 12
  - title: The evidence · 实验与证据
    subtitle: Make comparisons easy to read.
    slideNo: 13
  - title: The method · 方法与实现
    subtitle: Show the decisions behind the result.
    slideNo: 14
  - title: Discussion · 讨论
    subtitle: Leave room for the next question.
    slideNo: 20
---



---
layout: default
presentationPreset: ucas
---

# Start with a clear question.

好的表达，让听众知道什么最值得关注。

- **One idea at a time.** Build a line of reasoning the audience can follow.
- **Evidence in context.** Explain what changed and why it matters.
- **Room to reflect.** Leave enough space for the key observation.

<Callout type="note" title="Research note · 研究笔记">
Keep assumptions close to the claim. A short qualification is often enough.
</Callout>

<Callout type="warning" title="A limit to acknowledge · 适用边界">
A useful result should make its limits visible.
</Callout>

---
layout: two-cols
presentationPreset: ucas
---

# Evidence, made legible.

Illustrative measurements · 示例数据

| Method | Latency ↓ | Quality ↑ |
| :--- | ---: | ---: |
| Baseline | 42 ms | 86.2% |
| Tuned | 31 ms | 89.4% |
| **Proposed** | **24 ms** | **92.1%** |

<Badge tone="positive" marker>Reproduced</Badge> <Tag>experiment / 03</Tag>

::right::

## A reproducible process

<Steps>

1. **Define** a useful comparison.
2. **Measure** under the same conditions.
3. **Report** uncertainty with the result.

</Steps>

Use <Kbd :keys="['Ctrl', 'Enter']" /> to run the notebook.

---
layout: code
presentationPreset: ucas
---

# Make the method visible.

```ts {all|3-5|all}
type Observation = { latency: number; quality: number }

function summarize(samples: Observation[]) {
  const total = samples.reduce((sum, s) => sum + s.latency, 0)
  const latency = total / samples.length
  return { latency, count: samples.length }
}

const result = summarize(measurements)
console.log(result)
```

<p class="presentation-code-note">A small, readable example · 在相同条件下重复测量，并保留原始记录。</p>

---
layout: quote
presentationPreset: ucas
author: Research notes
source: 关于表达的一点思考
---

<p lang="zh">让复杂的问题，有清晰的表达。</p>

Good research deserves a clear explanation.

---
layout: image-right
presentationPreset: ucas
image: /theme/public/lilas-card.svg
imageAlt: A sample card for a presentation
caption: "Figure 1 · From research notes to a presentation. Theme source illustration."
---

# Give the figure a point.

A figure should answer a question before it adds another.

- **Show the relationship.** Keep the comparison visible.
- **Name the limits.** Put context in the caption.

<Callout type="tip" title="Figure practice · 配图原则">
Use a complete caption and a meaningful alternative description.
</Callout>

---
layout: references
presentationPreset: ucas
---

# Sources & acknowledgements

1. **Method and implementation.** Experiment protocol, measurement conditions, and reusable analysis code.
2. **Evidence and limitations.** Complete results, failure cases, and the assumptions used in interpretation.
3. **Related work.** [Slidev documentation](https://sli.dev) · presentation authoring and reproducible examples.

## Research team

<Authors />

Thank you to everyone who questioned, measured, and refined the work.

---
layout: default
presentationPreset: ucas
---

# A little structure, a lot of clarity.

<Timeline>

1. **Explore** — ask a precise question.
2. **Build** — turn the idea into a useful test.
3. **Reflect** — connect the result to the next question.

</Timeline>

> A useful observation connects the evidence with the question.

A simple `config` value, a <Tag>research note</Tag>, and a <Badge tone="info" marker>Draft</Badge> should support the reading rhythm.

---
layout: section
presentationPreset: ucas
---

# From evidence to insight.

把观察，变成可以讨论的结论。

---
layout: end
presentationPreset: ucas
contact: xun@example.org
showAuthors: true
---

# Let’s keep the conversation going.

感谢聆听，欢迎交流。

---
layout: toc
presentationPreset: ict
title: A clearer research story
sections:
  - title: The question · 研究问题
    subtitle: Give the audience a useful starting point.
    slideNo: 22
  - title: The evidence · 实验与证据
    subtitle: Make comparisons easy to read.
    slideNo: 23
  - title: The method · 方法与实现
    subtitle: Show the decisions behind the result.
    slideNo: 24
  - title: Discussion · 讨论
    subtitle: Leave room for the next question.
    slideNo: 30
---



---
layout: default
presentationPreset: ict
---

# Start with a clear question.

好的表达，让听众知道什么最值得关注。

- **One idea at a time.** Build a line of reasoning the audience can follow.
- **Evidence in context.** Explain what changed and why it matters.
- **Room to reflect.** Leave enough space for the key observation.

<Callout type="note" title="Research note · 研究笔记">
Keep assumptions close to the claim. A short qualification is often enough.
</Callout>

<Callout type="warning" title="A limit to acknowledge · 适用边界">
A useful result should make its limits visible.
</Callout>

---
layout: two-cols
presentationPreset: ict
---

# Evidence, made legible.

Illustrative measurements · 示例数据

| Method | Latency ↓ | Quality ↑ |
| :--- | ---: | ---: |
| Baseline | 42 ms | 86.2% |
| Tuned | 31 ms | 89.4% |
| **Proposed** | **24 ms** | **92.1%** |

<Badge tone="positive" marker>Reproduced</Badge> <Tag>experiment / 03</Tag>

::right::

## A reproducible process

<Steps>

1. **Define** a useful comparison.
2. **Measure** under the same conditions.
3. **Report** uncertainty with the result.

</Steps>

Use <Kbd :keys="['Ctrl', 'Enter']" /> to run the notebook.

---
layout: code
presentationPreset: ict
---

# Make the method visible.

```ts {all|3-5|all}
type Observation = { latency: number; quality: number }

function summarize(samples: Observation[]) {
  const total = samples.reduce((sum, s) => sum + s.latency, 0)
  const latency = total / samples.length
  return { latency, count: samples.length }
}

const result = summarize(measurements)
console.log(result)
```

<p class="presentation-code-note">A small, readable example · 在相同条件下重复测量，并保留原始记录。</p>

---
layout: quote
presentationPreset: ict
author: Research notes
source: 关于表达的一点思考
---

<p lang="zh">让复杂的问题，有清晰的表达。</p>

Good research deserves a clear explanation.

---
layout: image-right
presentationPreset: ict
image: /theme/public/lilas-card.svg
imageAlt: A sample card for a presentation
caption: "Figure 1 · From research notes to a presentation. Theme source illustration."
---

# Give the figure a point.

A figure should answer a question before it adds another.

- **Show the relationship.** Keep the comparison visible.
- **Name the limits.** Put context in the caption.

<Callout type="tip" title="Figure practice · 配图原则">
Use a complete caption and a meaningful alternative description.
</Callout>

---
layout: references
presentationPreset: ict
---

# Sources & acknowledgements

1. **Method and implementation.** Experiment protocol, measurement conditions, and reusable analysis code.
2. **Evidence and limitations.** Complete results, failure cases, and the assumptions used in interpretation.
3. **Related work.** [Slidev documentation](https://sli.dev) · presentation authoring and reproducible examples.

## Research team

<Authors />

Thank you to everyone who questioned, measured, and refined the work.

---
layout: default
presentationPreset: ict
---

# A little structure, a lot of clarity.

<Timeline>

1. **Explore** — ask a precise question.
2. **Build** — turn the idea into a useful test.
3. **Reflect** — connect the result to the next question.

</Timeline>

> A useful observation connects the evidence with the question.

A simple `config` value, a <Tag>research note</Tag>, and a <Badge tone="info" marker>Draft</Badge> should support the reading rhythm.

---
layout: section
presentationPreset: ict
---

# From evidence to insight.

把观察，变成可以讨论的结论。

---
layout: end
presentationPreset: ict
contact: xun@example.org
showAuthors: true
---

# Let’s keep the conversation going.

感谢聆听，欢迎交流。

---
layout: toc
presentationPreset: default
title: An outline without numbers
showNumbers: false
sections:
  - title: A clear title uses the full row
    subtitle: Longer supporting text should remain easy to scan.
    slideNo: 2
  - title: A static item has the same alignment
    subtitle: Useful when the destination is outside this deck.
---

---
layout: toc
presentationPreset: ucas
title: An outline without numbers
showNumbers: false
sections:
  - title: A clear title uses the full row
    subtitle: Longer supporting text should remain easy to scan.
    slideNo: 12
  - title: A static item has the same alignment
    subtitle: Useful when the destination is outside this deck.
---

---
layout: toc
presentationPreset: ict
title: An outline without numbers
showNumbers: false
sections:
  - title: A clear title uses the full row
    subtitle: Longer supporting text should remain easy to scan.
    slideNo: 22
  - title: A static item has the same alignment
    subtitle: Useful when the destination is outside this deck.
---

---
layout: two-cols
presentationPreset: default
reverse: true
gap: 4rem
---

# Second, on screen.

The source order stays meaningful. Both columns have the same usable width.

::right::

# First, on screen.

An authored gutter belongs between the columns; it should not indent either one.

---
layout: two-cols
presentationPreset: ucas
reverse: true
gap: 4rem
---

# Second, on screen.

The source order stays meaningful. Both columns have the same usable width.

::right::

# First, on screen.

An authored gutter belongs between the columns; it should not indent either one.

---
layout: two-cols
presentationPreset: ict
reverse: true
gap: 4rem
---

# Second, on screen.

The source order stays meaningful. Both columns have the same usable width.

::right::

# First, on screen.

An authored gutter belongs between the columns; it should not indent either one.
