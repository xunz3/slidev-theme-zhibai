# Cover composition review

Veil 0.3 removes the automatic preset artwork engine. Historical artwork screenshots and assertions describe an earlier implementation and are not evidence for the current cover layouts.

A cover uses its headline, eyebrow, subtitle, and optional date/author metadata as its core composition. When a visual supports the argument, choose one of these author-owned inputs:

- `image` with `imageAlt` for a native image figure, including its accessible loading fallback.
- The native `::visual::` slot for authored Markdown, SVG, HTML, or components. The slot takes precedence when `image` is also supplied.
- The cover `background` prop for a full-slide background image.

For a text-only cover, omit both `image` and `::visual::`; the text region uses the available measure. See the [cover API](../README.md#covers-and-visuals), the [composition fixture](../fixtures/cover-composition.md), and its [quality test](../tests/quality/cover-composition.spec.mjs).

The fixture includes all three presets, long titles, image loading and failure, a slot-over-image case, and a Markdown-only headline. Its current review checks both color modes at 980px and 720px. Final 0.4 results and current screenshots will be recorded in [veil-review.md](./veil-review.md) after validation; earlier screenshot directories are retained only as historical artifacts.
