---
theme: __THEME_PATH__
layout: default
title: Preset isolation contract
subtitle: Identical bilingual content · 相同双语内容
footer: Theme architecture regression
authors:
  - name: Quality Gate
    institution: Obsidian Theme Lilas
themeConfig:
  presentation:
    preset: __GLOBAL_PRESET__
    density: compact
    chrome: auto
    header: true
    footerAuthors: false
    pageNumber: false
---

<span hidden data-quality-case="matrix-prelude"></span>

# Preset matrix

The following slides contain the canonical same-run equivalence cases.

---
layout: two-cols
title: Preset isolation contract
subtitle: Identical bilingual content · 相同双语内容
presentationDensity: compact
presentationHeader: true
footerAuthors: false
pageNumber: false
---

<span hidden data-quality-case="baseline-__GLOBAL_PRESET__"></span>

# Preset isolation · 预设隔离

Identical content must depend only on the **resolved preset**, including `inline code`.

- First-valid configuration keeps valid deck values.
- 标题、列表与表格在局部覆盖时保持一致。

| Surface | Expected behavior |
| --- | --- |
| Canvas | Target background and typography |
| Chrome | Target header and footer treatment |

::right::

```text
const resolved = localPreset ?? deckPreset
```

> Shared quotations keep their hierarchy across visual identities.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Generated callout · 生成标注</div>
  <div class="obsidian-slidev-callout__content"><p>Semantic content remains preset-neutral.</p></div>
</div>

<div class="obsidian-slidev-warning"><strong>Warning:</strong> root preset leakage must fail this case.</div>

<figure class="obsidian-slidev-media"><figcaption class="obsidian-slidev-media__caption">Stable generated caption · 稳定图注</figcaption></figure>

---
layout: two-cols
title: Preset isolation contract
subtitle: Identical bilingual content · 相同双语内容
presentationPreset: default
presentationDensity: compact
presentationHeader: true
footerAuthors: false
pageNumber: false
---

<span hidden data-quality-case="local-default"></span>

# Preset isolation · 预设隔离

Identical content must depend only on the **resolved preset**, including `inline code`.

- First-valid configuration keeps valid deck values.
- 标题、列表与表格在局部覆盖时保持一致。

| Surface | Expected behavior |
| --- | --- |
| Canvas | Target background and typography |
| Chrome | Target header and footer treatment |

::right::

```text
const resolved = localPreset ?? deckPreset
```

> Shared quotations keep their hierarchy across visual identities.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Generated callout · 生成标注</div>
  <div class="obsidian-slidev-callout__content"><p>Semantic content remains preset-neutral.</p></div>
</div>

<div class="obsidian-slidev-warning"><strong>Warning:</strong> root preset leakage must fail this case.</div>

<figure class="obsidian-slidev-media"><figcaption class="obsidian-slidev-media__caption">Stable generated caption · 稳定图注</figcaption></figure>

---
layout: two-cols
title: Preset isolation contract
subtitle: Identical bilingual content · 相同双语内容
presentationPreset: ucas
presentationDensity: compact
presentationHeader: true
footerAuthors: false
pageNumber: false
---

<span hidden data-quality-case="local-ucas"></span>

# Preset isolation · 预设隔离

Identical content must depend only on the **resolved preset**, including `inline code`.

- First-valid configuration keeps valid deck values.
- 标题、列表与表格在局部覆盖时保持一致。

| Surface | Expected behavior |
| --- | --- |
| Canvas | Target background and typography |
| Chrome | Target header and footer treatment |

::right::

```text
const resolved = localPreset ?? deckPreset
```

> Shared quotations keep their hierarchy across visual identities.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Generated callout · 生成标注</div>
  <div class="obsidian-slidev-callout__content"><p>Semantic content remains preset-neutral.</p></div>
</div>

<div class="obsidian-slidev-warning"><strong>Warning:</strong> root preset leakage must fail this case.</div>

<figure class="obsidian-slidev-media"><figcaption class="obsidian-slidev-media__caption">Stable generated caption · 稳定图注</figcaption></figure>

---
layout: two-cols
title: Preset isolation contract
subtitle: Identical bilingual content · 相同双语内容
presentationPreset: ict
presentationDensity: compact
presentationHeader: true
footerAuthors: false
pageNumber: false
---

<span hidden data-quality-case="local-ict"></span>

# Preset isolation · 预设隔离

Identical content must depend only on the **resolved preset**, including `inline code`.

- First-valid configuration keeps valid deck values.
- 标题、列表与表格在局部覆盖时保持一致。

| Surface | Expected behavior |
| --- | --- |
| Canvas | Target background and typography |
| Chrome | Target header and footer treatment |

::right::

```text
const resolved = localPreset ?? deckPreset
```

> Shared quotations keep their hierarchy across visual identities.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Generated callout · 生成标注</div>
  <div class="obsidian-slidev-callout__content"><p>Semantic content remains preset-neutral.</p></div>
</div>

<div class="obsidian-slidev-warning"><strong>Warning:</strong> root preset leakage must fail this case.</div>

<figure class="obsidian-slidev-media"><figcaption class="obsidian-slidev-media__caption">Stable generated caption · 稳定图注</figcaption></figure>

---
title: Invalid local values inherit
presentationPreset: unsupported
presentationDensity: spacious
presentationChrome: sometimes
presentationHeader: maybe
footerAuthors: no
pageNumber: yes
---

<span hidden data-quality-case="invalid-inputs"></span>

# Invalid local values inherit

Unsupported local values must not suppress a valid deck configuration.

---
title: Textual booleans
presentationChrome: "on"
presentationHeader: "true"
footerAuthors: "off"
pageNumber: "false"
---

<span hidden data-quality-case="textual-booleans"></span>

# Textual booleans

`true`, `false`, `on`, and `off` use the documented normalization policy.

---
layout: cover
title: Cover layout
subtitle: 品牌锁定与稳定几何
pageNumber: false
---

<span hidden data-quality-case="layout-cover"></span>

Canonical cover content

---
layout: intro
title: Intro layout
subtitle: Shared frame introduction
---

<span hidden data-quality-case="layout-intro"></span>

# Intro layout

The intro preserves optional canvas styling through the shared frame.

---
layout: section
title: Section layout
subtitle: 章节分隔
---

<span hidden data-quality-case="layout-section"></span>

# Section layout

Shared section structure

---
layout: toc
title: Outline
subtitle: Keyboard and pointer behavior
sections:
  - title: Center
    subtitle: Focused layout
    slideNo: 12
  - title: Two columns
    subtitle: Parallel evidence
    slideNo: 13
---

<span hidden data-quality-case="layout-toc"></span>

TOC controls remain keyboard accessible.

---
layout: center
title: Center layout
---

<span hidden data-quality-case="layout-center"></span>

# Center layout · 居中布局

---
layout: two-cols
title: Two columns
subtitle: Shared responsive panes
---

<span hidden data-quality-case="layout-two-cols"></span>

# Left pane

- Evidence A
- Evidence B

::right::

# Right pane

| Metric | Value |
| --- | ---: |
| Stable | 100% |

---
layout: statement
title: Statement layout
---

<span hidden data-quality-case="layout-statement"></span>

# One shared render tree supports every preset.

---
layout: quote
title: Quote layout
author: Architecture contract
source: spec-001
---

<span hidden data-quality-case="layout-quote"></span>

> Local presentation state must be the sole styling authority.

---
layout: figure
title: Figure layout
subtitle: Stable caption geometry
---

<span hidden data-quality-case="layout-figure"></span>

<figure class="obsidian-slidev-media">
  <div role="img" aria-label="Abstract regression figure">▰ ▱ ▰</div>
  <figcaption class="obsidian-slidev-media__caption">Representative figure · 代表图形</figcaption>
</figure>

---
layout: references
title: References layout
---

<span hidden data-quality-case="layout-references"></span>

# References

1. Presentation configuration contract.
2. Resolved preset canvas and shared frame contract.
3. Quality-gate evidence contract.
