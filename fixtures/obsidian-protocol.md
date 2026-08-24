---
theme: ../
addons:
  - slidev-pane
title: Protocol Fixture
subtitle: Theme-side contract for markup emitted by obsidian-slidev.
footer: Obsidian Slidev Theme Protocol
authors:
  - name: Obsidian Slidev
    institution: Protocol fixture
    email: fixture@example.com
  - name: Theme Contract
    institution: Slidev fixture
    email: contract@example.com
  - name: A Contract
    institution: Slidev fixture
    email: contract@example.com
  - name: B Contract
    institution: Slidev fixture
    email: contract@example.com
themeConfig:
  presentation:
    density: normal
    chrome: auto
    header: false
    footerAuthors: true
    pageNumber: true
---

# Protocol Fixture

---
layout: intro
title: Fixture Structure
subtitle: Section-driven validation
---

# Fixture Structure

This deck is intentionally organized as `section -> slides`, matching how a real report or lab-meeting deck should read.

1. Generated protocol
2. Preset contrast
3. Layout gallery
4. Completion checks

---
layout: toc
title: Outline
subtitle: "Sections extracted from `layout: section`"
---

The TOC layout is generated from section divider slides, so the fixture follows the same structure expected from real decks.

---
layout: section
title: Generated Protocol
subtitle: Obsidian semantics emitted by the plugin
---

# Generated Protocol

Callouts, media, links, diagnostics, tables, and code.

---
title: Generated Callouts
subtitle: Semantic HTML
---

# Generated Callouts

The plugin converts Obsidian callouts into stable semantic blocks.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Note callout</div>
  <div class="obsidian-slidev-callout__content">
    <p>Default note styling should work in ordinary generated decks.</p>
  </div>
</div>

<div class="obsidian-slidev-callout obsidian-slidev-callout--tip" data-callout="tip">
  <div class="obsidian-slidev-callout__title">Tip callout</div>
  <div class="obsidian-slidev-callout__content">
    <p>Callout variants are driven by class names, not inline styles.</p>
  </div>
</div>

<div class="obsidian-slidev-callout obsidian-slidev-callout--warning" data-callout="warning">
  <div class="obsidian-slidev-callout__title">Warning callout</div>
  <div class="obsidian-slidev-callout__content">
    <p>Warnings need to stay readable in every supported preset.</p>
  </div>
</div>

---
layout: two-cols
title: Generated Media
subtitle: Image, video, audio
---

# Image Figure

<figure class="obsidian-slidev-media obsidian-slidev-media--image">
  <img src="../public/obsidian-card.svg" alt="Obsidian card fixture" class="obsidian-slidev-media__image obsidian-slidev-media__asset" />
  <figcaption class="obsidian-slidev-media__caption">Image figure emitted from a vault attachment.</figcaption>
</figure>

::right::

# Video Figure

<figure class="obsidian-slidev-media obsidian-slidev-media--video" data-quality-case="protocol-video-viewport">
  <SlidevVideo controls class="obsidian-slidev-media__video obsidian-slidev-media__asset" aria-label="Protocol fixture video">
    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
    <p>Your browser does not support videos. <a class="obsidian-slidev-link" href="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">Open video</a></p>
  </SlidevVideo>
  <figcaption class="obsidian-slidev-media__caption">Video figure emitted through Slidev's built-in component.</figcaption>
</figure>

---
layout: two-cols
title: Audio And YouTube
subtitle: Built-ins and native tags
---

# Audio Figure

<figure class="obsidian-slidev-media obsidian-slidev-media--audio">
  <audio controls preload="metadata" src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3" class="obsidian-slidev-media__audio obsidian-slidev-media__asset" aria-label="Protocol fixture audio"></audio>
  <figcaption class="obsidian-slidev-media__caption">Audio figure emitted from a vault attachment.</figcaption>
</figure>

::right::

# YouTube Figure

<figure class="obsidian-slidev-media obsidian-slidev-media--youtube">
  <Youtube id="dQw4w9WgXcQ" />
  <figcaption class="obsidian-slidev-media__caption">YouTube links render through Slidev's built-in component.</figcaption>
</figure>

---
title: Links And Warnings
subtitle: Runtime diagnostics
---

# Links And Warnings

Open a source note with <a class="obsidian-slidev-link" href="obsidian://open?vault=Vault&file=04%20Journal%2F2026%2F05%2F2026-05-03.md">an Obsidian link</a>.

<div class="obsidian-slidev-warning">
  <strong>Slidev warning:</strong> Missing note, heading, block, or attachment diagnostics should stay visible inside a deck.
</div>

| Generated item | Theme responsibility |
| --- | --- |
| `.obsidian-slidev-link` | Make vault links visually distinct |
| `.obsidian-slidev-warning` | Surface unresolved references |
| `.obsidian-slidev-callout` | Preserve Obsidian callout meaning |
| `.obsidian-slidev-media` | Normalize generated media blocks |

---
title: Long Content
subtitle: Lists, tables, inline code, code blocks
---

# Long Content

- The default preset should handle ordinary note-like bullet density.
- The theme owns spacing, typography, and slide chrome.
- The plugin only emits markdown, semantic HTML, and Slidev-native components.
- Inline code such as `obsidian-slidev`, `themeConfig.presentation`, and `frontmatter.footer` should remain readable.
- Tables and code should stay legible at normal presentation scale.

```ts
export function isObsidianSlidevDeck(frontmatter: Record<string, unknown>) {
  return frontmatter["obsidian-slidev"] === true
}
```

---
title: Generated Tasks And Highlights
subtitle: Presentation-only reading cues
presentationDensity: compact
---

# Generated Tasks And Highlights

<ul class="obsidian-slidev-task-list contains-task-list">
  <li class="obsidian-slidev-task-list-item task-list-item" data-task="">
    <input type="checkbox" />
    Generated unchecked protocol task.
  </li>
  <li class="obsidian-slidev-task-list-item task-list-item is-checked" data-task="x">
    <input type="checkbox" checked />
    Generated checked protocol task.
  </li>
</ul>

Generated <span class="obsidian-slidev-highlight">highlighted evidence</span> remains distinct
from <a class="obsidian-slidev-link" href="https://example.com/protocol">a protocol link</a>
and `inline code`.

---
title: Footnotes
subtitle: Markdown footnote support
---

# Footnotes

Footnote references should remain readable inside ordinary slides.[^protocol-footnote] They should be visible without dominating the page.

[^protocol-footnote]: Footnotes are rendered by Markdown and styled by the theme through standard `footnote-ref` and `footnotes` classes.

---
layout: section
title: Preset Overrides
subtitle: Default by default, branded when requested
---

# Preset Overrides

The default preset is selected automatically; UCAS and ICT remain opt-in visual systems over the same markup.

---
title: Default Preset
presentationDensity: compact
footer: Default compact preset
---

# Default Preset

With no preset override, the default visual system keeps the generated markup contract intact.

<div class="obsidian-slidev-callout obsidian-slidev-callout--quote" data-callout="quote">
  <div class="obsidian-slidev-callout__title">Protocol rule</div>
  <div class="obsidian-slidev-callout__content">
    <p>Style decisions belong in the theme; Obsidian parsing belongs in the plugin.</p>
  </div>
</div>

---
title: UCAS Preset Contrast
presentationPreset: ucas
footerAuthors: false
---

# UCAS Preset Contrast

UCAS applies institutional identity while preserving the same generated content structure.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Working note</div>
  <div class="obsidian-slidev-callout__content">
    <p>Use this mode for UCAS courses, seminars, project reviews, and research talks.</p>
  </div>
</div>

| Area | UCAS expectation |
| --- | --- |
| Headings | Restrained serif with institutional blue |
| Tables | Research-oriented structure with clear rules |
| Code | Quiet technical block |
| Callouts | Branded but content-first annotation |

---
title: ICT Preset Contrast
presentationPreset: ict
---

# ICT Preset Contrast

ICT uses the same generated markup, but shifts toward a contemporary technical system with navy fields, cyan accents, and mono labels.

<div class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">Research note</div>
  <div class="obsidian-slidev-callout__content">
    <p>Use this mode for systems, architecture, AI, and computing research talks.</p>
  </div>
</div>

| Area | ICT expectation |
| --- | --- |
| Headings | Precise sans-serif hierarchy |
| Tables | Technical structure with strong labels |
| Code | Dark, high-contrast technical block |
| Callouts | Compact systems-oriented annotation |

---
title: Optional Header
subtitle: Explicit opt-in
presentationHeader: true
---

# Optional Header

The default chrome is footer-only. A slide can opt into the header when per-slide metadata is intentionally useful.

The visible slide title remains the Markdown `# Optional Header`; metadata `title` and `subtitle` belong to navigation and optional chrome.

---
layout: section
title: Layout Gallery
subtitle: Theme-owned presentation primitives
---

# Layout Gallery

Statement, quote, figure, references, center, and default content layouts.

---
layout: statement
title: Statement Layout
---

# Theme Owns Presentation

The plugin should emit stable semantics; the theme should turn those semantics into presentation-native slides.

---
layout: quote
title: Quote Layout
author: Obsidian Slidev protocol
source: Theme contract fixture
presentationPreset: default
---

Generated Obsidian semantics should remain simple enough to inspect, but expressive enough for a theme to elevate across multiple lines without collapsing the quote rhythm.

---
layout: figure
title: Figure Layout
---

<figure class="obsidian-slidev-media obsidian-slidev-media--image">
  <img src="../public/obsidian-card.svg" alt="Figure layout fixture" class="obsidian-slidev-media__image obsidian-slidev-media__asset" />
  <figcaption class="obsidian-slidev-media__caption">A media-first slide should not need plugin-owned layout classes.</figcaption>
</figure>

---
layout: references
title: References Layout
presentationPreset: default
---

# References

1. Obsidian vault notes and generated semantic HTML.
2. Slidev built-in components for media and presentation runtime.
3. Theme-owned visual presets for default, UCAS, and ICT decks.

---
layout: section
title: Completion Checks
subtitle: Final validation slides
---

# Completion Checks

The fixture ends with centered confirmation and ordinary default content.

---
layout: center
title: Center Layout
footer: Center layout validation
---

# Center Layout

The centered layout should keep one message visually stable.

---
title: Fixture Complete
---

# Fixture Complete

If this deck builds and previews, the current plugin/theme protocol is still coherent.

<!-- FIX-THEME-VISUALS-PROTOCOL-START -->
---
title: Generated Semantic Families
subtitle: Canonical class fallback and authored casing
presentationDensity: compact
---

<div data-quality-case="protocol-callout-families" class="presentation-callout-gallery">

<aside class="obsidian-slidev-callout obsidian-slidev-callout--note" data-callout="note">
  <div class="obsidian-slidev-callout__title">API note</div>
  <div class="obsidian-slidev-callout__content">Informational family.</div>
</aside>
<aside class="obsidian-slidev-callout obsidian-slidev-callout--success" data-callout="success">
  <div class="obsidian-slidev-callout__title">mixedCase success</div>
  <div class="obsidian-slidev-callout__content">Positive family.</div>
</aside>
<aside class="obsidian-slidev-callout obsidian-slidev-callout--warning" data-callout="warning">
  <div class="obsidian-slidev-callout__title">Caution · 注意事项</div>
  <div class="obsidian-slidev-callout__content">Caution family.</div>
</aside>
<aside class="obsidian-slidev-callout obsidian-slidev-callout--danger" data-callout="danger">
  <div class="obsidian-slidev-callout__title">DO NOT recase</div>
  <div class="obsidian-slidev-callout__content">Danger family.</div>
</aside>
<aside class="obsidian-slidev-callout obsidian-slidev-callout--question" data-callout="question">
  <div class="obsidian-slidev-callout__title">Why this result?</div>
  <div class="obsidian-slidev-callout__content">Question family.</div>
</aside>
<aside class="obsidian-slidev-callout obsidian-slidev-callout--quote" data-callout="quote">
  <div class="obsidian-slidev-callout__title">Quoted evidence · 引用</div>
  <div class="obsidian-slidev-callout__content">Quotation family.</div>
</aside>
<aside class="obsidian-slidev-callout" data-callout="unsupported">
  <div class="obsidian-slidev-callout__title">Neutral fallback</div>
  <div class="obsidian-slidev-callout__content">Unsupported type remains neutral.</div>
</aside>

</div>

---
title: Generated Image States
subtitle: Ready, delayed, decorative, and failed
presentationDensity: compact
---

<div data-quality-case="protocol-generated-image-states" class="presentation-figure-gallery">

<figure class="obsidian-slidev-media obsidian-slidev-media--image" data-generated-state-case="ready">
  <img class="obsidian-slidev-media__image obsidian-slidev-media__asset" :src="'/author-fixtures/media-landscape.svg'" alt="Ready generated landscape fixture" />
  <figcaption class="obsidian-slidev-media__caption">Ready generated image.</figcaption>
</figure>
<figure class="obsidian-slidev-media obsidian-slidev-media--image" data-generated-state-case="delayed">
  <img class="obsidian-slidev-media__image obsidian-slidev-media__asset" :src="'/author-fixtures/media-portrait.svg?delay=generated'" alt="Delayed generated portrait fixture" />
  <figcaption class="obsidian-slidev-media__caption">Delayed generated image.</figcaption>
</figure>
<figure class="obsidian-slidev-media obsidian-slidev-media--image" data-generated-state-case="decorative">
  <img class="obsidian-slidev-media__image obsidian-slidev-media__asset" :src="'/author-fixtures/media-landscape.svg?decorative=1'" alt="" />
  <figcaption class="obsidian-slidev-media__caption">Decorative generated image.</figcaption>
</figure>
<figure class="obsidian-slidev-media obsidian-slidev-media--image" data-generated-state-case="failed">
  <img class="obsidian-slidev-media__image obsidian-slidev-media__asset" src="data:image/svg+xml,not-an-image" alt="Generated image unavailable" />
  <figcaption class="obsidian-slidev-media__caption">Failed generated image retains a description.</figcaption>
</figure>

</div>

---
title: Public and Generated Image Equivalence
subtitle: Default contained presentation
presentationDensity: compact
---

<div data-quality-case="protocol-image-equivalence" class="presentation-media-fit-gallery">

<Figure
  src="/theme/public/obsidian-card.svg"
  alt="Equivalent Obsidian card fixture"
  caption="Public Figure default"
/>

<figure class="obsidian-slidev-media obsidian-slidev-media--image" data-generated-equivalent="image">
  <img class="obsidian-slidev-media__image obsidian-slidev-media__asset" src="../public/obsidian-card.svg" alt="Equivalent Obsidian card fixture" />
  <figcaption class="obsidian-slidev-media__caption">Generated Figure default</figcaption>
</figure>

</div>

---
title: Generated Link Forms
subtitle: Inline, wrapped, and block
presentationDensity: compact
---

<div data-quality-case="protocol-link-forms" class="presentation-link-probe">

An <a class="obsidian-slidev-link" data-link-form="inline" href="https://example.com/generated-inline">inline generated link</a>
stays bounded beside punctuation.

<p style="max-width: 15rem">
  <a class="obsidian-slidev-link" data-link-form="wrapped" href="https://example.com/generated-wrapped">
    A deliberately long generated bilingual link · 生成链接换行检查
  </a>
</p>

<a class="obsidian-slidev-link" data-link-form="block" href="https://example.com/generated-block" style="display: block">
  Block generated link treatment stays bounded to rendered text.
</a>

</div>

---
title: Generated Task and Highlight Scope
subtitle: Nested states and code resets
presentationDensity: compact
---

<div data-quality-case="protocol-task-highlight-scope">

<ul class="obsidian-slidev-task-list contains-task-list">
  <li class="obsidian-slidev-task-list-item task-list-item is-checked" data-task="x">
    <input type="checkbox" checked />
    Completed generated parent.
    <ul class="obsidian-slidev-task-list contains-task-list">
      <li class="obsidian-slidev-task-list-item task-list-item" data-task="">
        <input type="checkbox" />
        Unfinished generated child resets to primary emphasis.
      </li>
    </ul>
  </li>
</ul>

Generated <span class="obsidian-slidev-highlight">flat prose highlight · 平面高亮</span> remains
distinct from <a class="obsidian-slidev-link" href="https://example.com/generated-scope">a link</a>,
`inline code`, and <Kbd>Esc</Kbd>.

<pre><code><span class="obsidian-slidev-highlight">generated highlight class inside code</span></code></pre>

</div>
<!-- FIX-THEME-VISUALS-PROTOCOL-END -->
