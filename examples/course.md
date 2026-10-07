---
theme: zhibai
layout: cover
title: 为什么平均值，还不够？
subtitle: 从一个反例，理解波动与不确定性。
eyebrow: Statistics · 课程讲义
date: 第 03 讲
lang: zh-CN
footer: 平均值与波动 · 课程模板
authors:
  - name: 你的名字
    institution: 你的课程
themeConfig:
  presentation:
    preset: qingdai
---

替换课程、教师和练习内容，即可用于一次完整的课堂讲解。

---
layout: default
kicker: 学习目标 · Learning goals
---

# 这节课，我们要回答什么？

- 同样的平均值，为什么可能对应不同的表现？
- 方差描述了什么，又没有描述什么？
- 如何在真实决策中同时报告位置与波动？

<Callout type="question" title="先作判断">

两组成绩的平均值都是 80 分，是否代表同样稳定？

</Callout>

---
layout: two-cols-header
---

# 同一个平均值，两种分布

::left::

## 组 A

78，79，80，81，82

集中在平均值附近。

::right::

## 组 B

60，70，80，90，100

相同中心，更大的波动。

::bottom::

先观察数据，再引入描述波动的量。

---
layout: default
kicker: 定义与解释 · Definition
---

# 方差：偏离中心的平方平均

$$
\sigma^2=\frac{1}{n}\sum_{i=1}^{n}(x_i-\mu)^2
$$

<Callout type="note" title="这是什么定义？">

这里描述的是给定总体的方差；估计总体方差时，样本方差通常使用 $n-1$。

</Callout>

平方防止正负偏差抵消；标准差再把单位还原到原数据的尺度。

---
layout: two-cols
columnRatio: 0.55
---

# 从定义走到计算

<Steps>

1. 求平均值
2. 计算每个数的偏差
3. 将偏差平方
4. 求平方偏差的平均值

</Steps>

::right::

# 回到最初的例子

| 组别 | 平均值 | 总体方差 |
| --- | ---: | ---: |
| A | 80 | 2 |
| B | 80 | 200 |

组 B 的标准差是组 A 的 10 倍。

---
layout: default
kicker: 练习 · Check your understanding
---

# 把每个数都加 10，会怎样？

先独立思考，再用一组数据验证。

- 平均值怎样变化？
- 每个数相对平均值的偏差怎样变化？
- 方差是否改变？

<Callout type="tip" title="提示">

先写出 $(x_i+10)-(\mu+10)$，再回到方差的定义。

</Callout>

---
layout: quote
author: 本讲要点
---

> 报告一个中心，也要报告围绕它的变化。

---
layout: end
---

# 从数据出发，回到判断

课后：为一个熟悉的平均值，补上它的波动与条件。
