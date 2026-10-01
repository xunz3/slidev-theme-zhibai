---
theme: ../
layout: fact
title: Native layouts
fonts:
  sans: Arial
  serif: Georgia
  mono: Courier New
  provider: none
themeConfig:
  presentation:
    preset: qingdai
    accent: "#345f8f"
---

# 42%

A native Slidev fact layout, styled by Zhubai.

---
layout: two-cols-header
---

# Native slots, shared typography.

::left::

## Observation

Keep the evidence readable.

::right::

## Interpretation

Let the argument follow.

::bottom::

A shared conclusion.

---
layout: full
---

<div class="w-full h-full flex items-center justify-center">

# The whole canvas.

</div>

---
layout: none
---

<div class="w-full h-full flex items-center justify-center bg-white text-black">

# An authored canvas.

</div>


---
layout: fact
presentation:
  preset: zhubai
  accent: auto
---

# 83%

A page restores its own preset accent.

---
layout: fact
presentation:
  preset: songmo
  showFooter: false
---

# 64%

A quiet slide without a footer.

---
layout: two-cols-header
columnRatio: 0.65
presentation:
  preset: ucas
  pageNumber: false
---

# Method and result

::left::

## Method

A wider explanation column.

::right::

## Result

A concise observation.

::bottom::

Evidence comes before interpretation.

---
layout: two-cols-header
presentation:
  preset: ict
  accent: auto
  showFooter: true
footer: A slide-specific label
---

# A technical comparison

::left::

## Baseline

A fixed evaluation budget.

::right::

## Proposed

A documented improvement.

::bottom::

Labels and line styles distinguish the series.

---
layout: two-cols
columnRatio: 0.65
---

# A wider argument

The theme layout follows the same proportion.

::right::

# Evidence

A compact summary.
