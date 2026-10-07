---
theme: zhibai
layout: cover
title: 检索系统，如何减少等待？
subtitle: 一次从观测、改造到验证的技术分享。
eyebrow: Engineering · 技术分享
date: 2026 · 秋
lang: zh-CN
footer: 检索系统 · 技术分享模板
authors:
  - name: 你的名字
    institution: 你的团队
themeConfig:
  presentation:
    preset: ict
---

示例数据用于演示结构。开始使用时，替换标题、作者和全部实验结果。

---
layout: toc
sections:
  - title: 为什么慢
    subtitle: 观测用户等待的路径
    slideNo: 3
  - title: 如何改
    subtitle: 并行计算与有界缓存
    slideNo: 4
  - title: 怎样验证
    subtitle: 同时检查延迟与正确性
    slideNo: 6
---

---
layout: section
index: 01
kicker: 问题 · Observation
---

# 用户在等哪一步？

先画出请求路径，再选择值得优化的部分。

---
layout: two-cols-header
columnRatio: 0.6
---

# 方法：把独立工作并行执行

::left::

```ts
const [documents, profile] = await Promise.all([
  retrieve(query),
  loadProfile(userId),
])
return rank(documents, profile)
```

::right::

## 成立的条件

- 两项任务彼此独立。
- 每项任务有超时预算。
- 失败必须能够被观测。

::bottom::

先验证依赖关系，再讨论并发收益。

---
layout: two-cols
columnRatio: 0.55
---

# 方法与代价

<Steps>

1. 测量关键路径
2. 识别独立工作
3. 加入超时与取消
4. 使用同一负载复测

</Steps>

::right::

# 不只看平均值

| 指标 | 改造前 | 改造后 |
| --- | ---: | ---: |
| p50 延迟 | 180 ms | 110 ms |
| p95 延迟 | 430 ms | 280 ms |
| 错误率 | 0.2% | 0.2% |

示例数据 · 相同负载。

---
layout: fact
---

# 35%

p95 等待时间的示例降幅 · 430 ms → 280 ms。

---
layout: default
kicker: 验证 · Operating boundary
---

# 结论旁边，写清适用条件

<Callout type="warning" title="负载变化后需要重新测量">

缓存命中率、下游限流和请求分布会改变关键路径。

</Callout>

- 报告负载、样本量和测量窗口。
- 检查成功率与资源使用是否恶化。
- 记录回滚条件与尚未覆盖的场景。

---
layout: end
---

# 让优化回到用户的等待

用可复现的观测，解释收益与代价。
