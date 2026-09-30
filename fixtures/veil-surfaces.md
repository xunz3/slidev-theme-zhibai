---
theme: ../
layout: two-cols
footer: Zhubai · material studies
themeConfig:
  presentation:
    preset: zhubai
---

# Native code metadata

```javascript
const signal = samples.map(read)
```

```typescript
const count: number = 12
```

::right::

# Language labels

```python
mean = sum(values) / len(values)
```

```
This is plain text, without a language.
```

---
layout: default
---

# Images, with useful captions

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
  <Figure src="/author-fixtures/media-landscape.svg" alt="A research diagram." caption="A plain research figure." treatment="plain" />
  <Figure src="/author-fixtures/media-landscape.svg" alt="The same diagram framed in a raised surface." caption="A framed research figure." treatment="framed" />
</div>

---
layout: section
kicker: Observation
---

# A figure can set the scene.

<Figure src="/author-fixtures/media-landscape.svg" alt="A research diagram fills the scene." treatment="bleed" />

---
layout: default
---

# Caption numbering respects authors

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
  <Figure src="/author-fixtures/media-landscape.svg" alt="First diagram on a new slide." caption="Numbering starts again on this slide." />
  <Figure src="/author-fixtures/media-landscape.svg" alt="A diagram with its own reference number." caption="Fig. S2 — Supplementary experiment." />
</div>

---
layout: cover
title: A setting for the argument
subtitle: An authored image can fill the opening canvas.
eyebrow: Material study
date: September 2026
---

::visual::

<Figure src="/author-fixtures/media-landscape.svg" alt="A research diagram behind the opening." treatment="bleed" />
