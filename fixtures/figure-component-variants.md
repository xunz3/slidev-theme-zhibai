---
theme: ../
title: Ordinary Figure variants
themeConfig:
  presentation:
    preset: default
    density: normal
    chrome: auto
---

<span hidden data-quality-case="figure-component-centered"></span>

# Centered in ordinary flow

Supporting prose remains above the default bounded figure.

<Figure
  variant="centered"
  src="/author-fixtures/media-landscape.svg"
  alt="Centered evaluation landscape"
  caption="Centered keeps the established ordinary Figure treatment."
/>

---
title: Stage in ordinary flow
presentationDensity: compact
---

<span hidden data-quality-case="figure-component-stage"></span>

# Primary result with context

The image receives emphasis without taking over the entire slide composition.

<Figure
  variant="stage"
  src="/author-fixtures/media-landscape.svg"
  alt="Staged evaluation landscape"
  caption="Stage expands the evidence while preserving supporting prose."
/>

---
title: Minimal in ordinary flow
presentationDensity: compact
---

<span hidden data-quality-case="figure-component-minimal"></span>

# Diagram without a tray

The surrounding paragraph and caption retain one reading axis.

<Figure
  variant="minimal"
  src="/author-fixtures/media-portrait.svg"
  alt="Minimal portrait research diagram"
  caption="Minimal removes both viewport and image-layer surfaces."
/>

---
title: Editorial in ordinary flow
presentationDensity: compact
---

<span hidden data-quality-case="figure-component-editorial"></span>

# Evidence with interpretation

The annotation stays attached to the evidence without displacing the heading.

<Figure
  variant="editorial"
  src="/author-fixtures/media-landscape.svg"
  alt="Editorial evaluation landscape"
  caption="Evidence note · Retrieval accounts for most of the measured improvement."
  fit="cover"
/>

---
title: Generated minimal modifier
presentationDensity: compact
---

<span hidden data-quality-case="figure-generated-minimal"></span>

# Native Obsidian embed equivalent

The existing producer `class=` option emits this modifier on generated markup.

<figure class="obsidian-slidev-media obsidian-slidev-media--image obsidian-slidev-media--figure-minimal">
  <img class="obsidian-slidev-media__image obsidian-slidev-media__asset" :src="'/author-fixtures/media-portrait.svg'" alt="Generated minimal portrait diagram" />
  <figcaption class="obsidian-slidev-media__caption">Generated minimal uses the same local composition.</figcaption>
</figure>
