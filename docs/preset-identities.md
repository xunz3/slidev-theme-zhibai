# Veil 0.4 preset identities

The three presets share an editorial type system and differ in paper tint, accent/highlight pairing, signature, and opening composition. The default light theme remains predominantly white. Dark mode uses an ink canvas with a slight institutional tint.

| | `default` · Paper | `ucas` · Folio | `ict` · Blueprint |
| --- | --- | --- | --- |
| Paper | Warm `#faf9f6` | Cool `#f9fafc` | Blue-gray `#f7f9fb` |
| Accent / highlight | `#2f3b46` / `#c2572e` | `#1d4e8e` / `#b3352c` | `#0b6bcb` / `#d9730d` |
| Cover | Left-aligned serif title and a fine eyebrow rule | Centered academic title with the original bilingual signature | Left-aligned title, original horizontal signature, faint 8px grid |
| Chapter | Pale, large serif folio | Oldstyle folio and a composed academic opening | Monospaced `SEC. 03` index and a faint grid |
| Content canvas | Untextured warm paper | Untextured cool paper | Quiet 1.5% drafting grid |
| Reading | Inter + Noto Sans SC | Inter + Noto Sans SC | Inter + Noto Sans SC |
| Display | Libertinus Serif + Noto Serif SC | Libertinus Serif + Noto Serif SC | Libertinus Serif + Noto Serif SC |

All covers place author/date metadata in a bottom tonal band. Authored visuals occupy a dedicated region, while explicit centered covers retain their centered alignment. Quotations use the serif voice; code, page numbers, and technical indices use JetBrains Mono. The [typography specification](./veil-typography.md) records sizes, weights, and font delivery.

Preset colors are theme design choices. The institutional signatures are authentic assets; the theme does not claim that every selected palette color is an official brand specification. The original [source survey](./veil-design.md) records research and asset provenance.

For the cover API, see [README](../README.md#covers-and-visuals). The 18-slide [preset fixture](../fixtures/preset-design.md) compares openings, chapters, content, closings, centered visual covers, and bilingual statements with consistent content.

![Veil covers and content](./assets/veil/preview.png)

[Complete light preview](./assets/veil/light.png) · [Complete dark preview](./assets/veil/dark.png)

Columns are Default, UCAS, and ICT. See the [implementation review](./veil-review.md) for the verification status and the [design contract](./veil-redesign.md) for component behavior.
