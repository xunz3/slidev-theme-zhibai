---
theme: ./
addons:
  - slidev-pane
title: Slidev Presentation Theme
subtitle: Reusable presets with optional Obsidian integration
presentationPreset: ict
image: /obsidian-card.svg
imageAlt: A note card connected to a presentation canvas
imageFit: contain
authors:
  - name: Theme Demo
    institution: Slidev presentations
    email: deck@example.com
  - name: Slidev Theme
    institution: Frontend-native rendering
    email: theme@example.com
themeConfig:
  presentation:
    density: normal
    chrome: auto
    header: false
    footerAuthors: true
    pageNumber: true
---

# Slidev Presentation Theme

---
title: Notes as Slides
subtitle: Standalone components
---

# Notes as Slides

The theme works with ordinary Slidev Markdown and also styles markup emitted by `obsidian-slidev`.

<Callout type="note" title="One rendering vocabulary">

Write semantic content directly with theme components, or let the conversion plugin emit its compatible frontend structure.

</Callout>

Open a source note with <a class="obsidian-slidev-link" href="obsidian://open?vault=Vault&file=Notes%2FDeck.md">an Obsidian link</a>.

---
layout: two-cols
title: Figure and authors
---

# Accessible Figure

<Figure
  src="/obsidian-card.svg"
  alt="A note card connected to a presentation canvas"
  caption="Figure 1. Media reserves space before it loads."
  fit="contain"
/>

::right::

# Deck Authors

<Authors />

---
layout: section
---

# Presets

The same authoring surface switches visual systems without changing its content structure.

---
title: UCAS preset
presentationPreset: ucas
---

# UCAS Is an Override

UCAS can be selected for institutional decks without changing the standalone or generated-markup contracts.

<Callout type="warning" title="Visible failure">

Unresolved links and missing assets stay visible instead of silently disappearing.

</Callout>

| Layer | Responsibility |
| --- | --- |
| `obsidian-slidev` | Convert vault notes into Slidev-native markup |
| `slidev-theme-lilas` | Render layouts, presets, components, and optional Obsidian semantics |

---
title: Local accent
accent: "#9a3412"
---

# Accent Belongs to This Slide

The local accent affects [links](https://example.com), focus, general callouts, and reading cues without changing semantic or institutional colors.

<Callout type="info">This informational surface follows the local accent.</Callout>
<Callout type="success">Success keeps its own semantic treatment.</Callout>

---
layout: image-left
title: Image and text
image: /obsidian-card.svg
imageAlt: A note card connected to a presentation canvas
caption: Figure 2. Narrative stays first in document order.
backgroundSize: contain
---

# Image-and-Text Layout

The image is visually left, but this narrative remains first for reading order.

- Existing `image`, `class`, and `backgroundSize` inputs remain accepted.
- `imageAlt` and `caption` add accessible figure semantics.

---
layout: code
title: Code layout
---

# Full-Width Code

```ts
export const resolveAccent = (
  local: string | undefined,
  deck: string | undefined,
) => firstValidCssColor(local, deck)
```

Long lines scroll inside the code region while the slide frame and chrome remain fixed.

---
layout: two-cols
title: Process components
---

# Steps

<Steps>

<ol start="2">
  <li><strong>Collect</strong> observations.</li>
  <li value="5"><strong>Normalize</strong> measurements.</li>
  <li><strong>Report</strong> uncertainty.</li>
</ol>

</Steps>

::right::

# Timeline

<Timeline>

1. <time datetime="2026-06">June</time> — Dataset frozen.
2. **July** — Results released.

</Timeline>

---
title: Status and keyboard
---

# Compact Reading Cues · 紧凑阅读提示

<Tag>Method</Tag>
<Tag>双语标签</Tag>

<Badge tone="positive" marker>Complete</Badge>
<Badge tone="info">Reviewed</Badge>

Press <Kbd>Esc</Kbd> to leave the overview.

Open the command menu with <Kbd :keys="['Ctrl', 'Shift', 'P']" />.

---
title: Tasks and highlights
---

# Presentation-Only Tasks

- [x] Reproduce the result
- [ ] Archive the environment
  - [x] Preserve raw observations
  - [ ] Record a wrapped bilingual follow-up with enough text to demonstrate stable alignment · 记录换行后的双语任务

Compare the <mark>validated cohort</mark> with a [linked cohort](https://example.com), *emphasis*, and `inline code`.

```md
Literal ==highlight-like syntax== stays code.
```

---
title: Generated compatibility
---

# Existing Generated Markup Still Works

<div class="obsidian-slidev-warning">
  <strong>Compatibility:</strong> existing <code>.obsidian-slidev-*</code> structures need no migration.
</div>

<ul class="obsidian-slidev-task-list">
  <li class="task-list-item"><input type="checkbox" checked> Generated checked task</li>
  <li class="task-list-item"><input type="checkbox"> Generated open task</li>
</ul>

Generated <span class="obsidian-slidev-highlight">highlight markup</span> receives the same prose treatment without adding a parser.

---
layout: end
title: Closing
---

# Thank You
