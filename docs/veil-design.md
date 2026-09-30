# Veil source survey — historical research

This survey preserves the original reference research for the first Veil visual specification. That specification described the 0.2 design and has been superseded by the selected 0.4 design in [veil-redesign.md](./veil-redesign.md). The survey remains useful for source provenance; it does not describe the current visual direction or validate current screenshots.

## Research

The survey covers template galleries, individual decks, editorial grids, presentation guidance, and first-party institutional resources. Observations are based on published descriptions and available preview imagery, not an exhaustive download of every slide or paid template. No third-party deck artwork is copied into the theme.

| Reference | Useful observation | Decision for Veil |
| --- | --- | --- |
| [Pitch: template design process](https://pitch.com/blog/designing-presentation-templates) | Reusable content structure, restrained typography, grayscale exploration, iterative review | Keep the layout API; evaluate identical content across presets |
| [Pitch: template library](https://pitch.com/templates) | Covers, reports, proposals, and image-led layouts need a coherent family | Design content slides as carefully as covers |
| [Pitch: creative pitch decks](https://pitch.com/templates/collections/Pitch-deck) | Large black headline and sparse metadata can carry a white cover | Default cover uses one clear typographic focal point |
| [Plus AI: Swiss Light](https://plusai.com/templates/swiss-light) | White, strong typography, thin rules, very small color accents across 18 preview layouts | White canvas, aligned margins, hairline separators |
| [Stephen Kelman: Insight](https://stephenkelman.co.uk/insight-presentation-grid-system-for-indesign) | Modular columns, baseline alignment, proportional leading | Consistent content grid and aligned text/image columns |
| [Stephen Kelman: Highlight](https://stephenkelman.co.uk/highlight-presentation-grid-system-for-indesign) | Image and text balance with deliberate empty space | Unboxed figures; intentional space around captions |
| [SlidesCarnival: Minimalist White](https://www.slidescarnival.com/template/minimalist-white-slides/237932) | Neutral white presentations can serve general-purpose content | Pure white, without beige or lavender page fills |
| [SlidesCarnival: minimalist gallery](https://www.slidescarnival.com/tag/minimalist) | Many decorative approaches compete with content | Prefer a restrained common foundation |
| [Slidesgo: Minimalist Thesis Defense](https://slidesgo.com/theme/minimalist-thesis-defense) | Clear chapter and academic content hierarchy; 24 editable designs | Adopt hierarchy, not its pink palette or decorative motifs |
| [Beautiful.ai: portfolio templates](https://www.beautiful.ai/template-categories/portfolio) | Minimal layouts foreground content and imagery | Secondary surfaces only when they group real content |
| [Duarte: Beyond the cluttered slide](https://www.duarte.com/resources/webinars-videos/beyond-the-cluttered-slide/) | White space guides attention | Remove persistent rails, frames, and multiple competing accents |
| [Verzus minimal deck](https://graphicriver.net/item/verzus-minimal-powerpoint-template/18127423) | Paired columns, architectural imagery, thin dividers | Open two-column composition; no nested card grid |
| [Monochrome Swiss company profile](https://graphicriver.net/item/monochrome-swiss-style-company-profile-presentation/53054155) | Numbered content, grayscale images, consistent chapter rhythm | Quiet numbering and clear hierarchy; omit ornamental symbols |
| [MIT brand downloads](https://brand.mit.edu/downloads) | Institutional slides live within a larger identity system | Preserve original institutional signatures and their proportions |
| [Yale presentation guidelines](https://yaleidentity.yale.edu/guidelines/presentations) | Separate title, section, project, and feedback examples; a system-font template accompanies the branded font version | Keep font fallbacks and prioritize clear academic hierarchy |
| [Stanford GSE desktop toolkit](https://ed.stanford.edu/identity/desktop) | Multiple presentation masters with explicit color and typography guidance | A preset is a coordinated set of layouts, not just a cover |

## Institutional sources

- [UCAS identity resources](https://onestop.ucas.edu.cn/home/info/6b9e95dc-5785-4eee-b25f-1f884698cfc3): retain the repository's official bilingual signature and seal without redrawing them.
- [UCAS presentation resources](https://onestop.ucas.edu.cn/Home/Info/e1e7b553-14c1-42f3-910a-88d25ebf9c48): official resource index lists several template generations, including 2018 and 2023. The linked ZIP is not rendered by web research; no claim of a full slide-by-slide inspection.
- [ICT institutional profile](https://www.ict.ac.cn/jssgk/jssjj/): computing, processors, and systems provide a meaningful technical identity.
- [ICT research overview](https://www.ict.ac.cn/ky/kygk/): processors, computer systems, networks, data, and intelligence support a restrained interconnect motif.
- [ICT official site](https://www.ict.ac.cn/) and [signature asset](https://www.ict.ac.cn/images/header_ict.png): preserve the existing official horizontal signature. Source information remains in `assets/ICT/SOURCES.md`.

Palette and composition choices are theme design decisions, not claims of official brand standards. The former crystal and circuit studies are historical references; the current theme does not render them.

## Current direction

The first visual specification and its artwork rules are superseded. Veil 0.3 uses preset typography, native Slidev cover imagery, and authored slot content instead of automatic background motifs. See the [0.4 design contract](./veil-redesign.md), [current preset identities](./preset-identities.md), and [implementation review](./veil-review.md). The current review document is the place for new test results and screenshots after they are generated.
