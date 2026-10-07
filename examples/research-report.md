---
theme: zhibai
layout: cover
title: 置信度，能否经受分布变化？
subtitle: 研究问题、受控实验与结论边界。
eyebrow: Research colloquium · 研究报告
date: 2026 · 秋
lang: zh-CN
footer: 置信度与校准 · 研究报告模板
authors:
  - name: 你的名字
    institution: 你的研究组
themeConfig:
  presentation:
    preset: ucas
---

示例数据用于演示。使用时替换作者、研究背景、结果与参考文献。

---
layout: toc
sections:
  - title: 问题与假设
    slideNo: 3
  - title: 方法与实验
    slideNo: 4
  - title: 结果与边界
    slideNo: 5
  - title: 参考文献
    slideNo: 7
---

---
layout: section
index: 01
kicker: Research question
---

# 排序可靠，是否代表概率可靠？

把区分能力与校准能力分开检验。

---
layout: default
kicker: 方法 · Calibration
---

# 以可靠性，而非排名为目标

令 $B_m$ 表示第 $m$ 个置信度区间：

$$
\operatorname{ECE}=\sum_{m=1}^{M}\frac{|B_m|}{n}
\left|\operatorname{acc}(B_m)-\operatorname{conf}(B_m)\right|
$$

误差应连同分箱方式、样本量和不确定性一起报告。[^ece]

[^ece]: Guo et al. (2017), On Calibration of Modern Neural Networks. 该公式用于展示公式与脚注排版。

---
layout: two-cols-header
columnRatio: 0.6
---

# 结果：区分能力与校准发生分离

::left::

| 指标 | 域内 | 分布变化 |
| --- | ---: | ---: |
| AUROC | .91 | .88 |
| ECE | .03 | .09 |
| 90% 覆盖率 | .89 | .73 |

示例值 · 相同测试预算。

::right::

## 解释

排名仍然有用，置信度却变得不可靠。

<Callout type="note" title="独立评估校准">

单独报告 AUROC 无法支撑概率可靠性的结论。

</Callout>

---
layout: default
kicker: 边界 · Limitations
---

# 一次实验，可以支持多大的结论？

- **成立条件：**固定模型、受控变化、相同预算。
- **尚未覆盖：**自然漂移、类别增减、不同分箱数。
- **下一步：**重复实验，并报告置信区间。

用条件限定结论，保留可复核的证据。

---
layout: references
---

# 参考文献

1. Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). *On Calibration of Modern Neural Networks*. ICML. [原论文](https://proceedings.mlr.press/v70/guo17a.html).

参考文献为作者维护的普通 Markdown；此布局负责排版，不会自动生成引用。

---
layout: end
---

# 置信度，需要上下文

让证据、条件和结论一起被记住。
