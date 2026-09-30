# Veil 视觉设计建议书

> 状态：方向提案（供评审）。面向 0.4 版本。
> 本文只谈**视觉设计**；现有 token 架构、组件 API、可访问性与质量门禁都是好资产，予以保留。
> 证据：`docs/assets/veil/light.png`、`docs/assets/veil/preview.png`（18 页三 preset 对比图）。

---

## 1. 诊断：为什么"一看就是 GPT 做的"

当前设计的问题不在细节执行，而在于它是一套**没有观点的设计**。具体症状：

### 1.1 没有色彩观点
- 三 preset 全部是纯白 `#ffffff` 底 + 近黑 `#24282f` 字 + 单一深色 accent。没有色温（冷暖）、没有色调表面（tinted surface），所有层次都靠 1px 灰线划分。
- `--presentation-bg-muted` 是 `#f4f6f8` 这类"系统自动灰"，callout、表头、代码块底色都靠 `color-mix` 把 accent 冲淡 5–8% —— 结果就是满眼"脏白色"，没有一块**被设计过的颜色**。
- 深色模式 `#20262d` / `#101923` 是蓝灰色，显脏显闷，不是"墨色"。

### 1.2 没有字体对比
- 标题、正文、标签、页眉页脚全部是 Inter 400/600，字重和字号拉不开档次。
- Libertinus Serif 被分配去给 **18px 正文**（`--presentation-font-body: serif`）—— 投影距离下衬线细节全部丢失，反而降低可读性；而它本该发光的场合（封面大字、章节大字、引文）却全是 Inter 600。**职责完全颠倒**。
- 中文标题用 Noto Sans SC 600，笔画糊成一团，没有针对 CJK 的字号/行高/字重策略（typography 文档只规定了"不倾斜、不加字距"）。

### 1.3 没有版式构图
- 封面 = 左上角一堆字（eyebrow + 标题 + 副标题 + 作者），大片"死白"没有被组织。statement 页是一句话漂浮在虚空里。section 页的序号（`01`）只有 2rem，畏缩在标题旁边。
- 每一页都有 header 线、footer 线、表格上下粗线 —— 共三到五条 hairline，气质是 **LaTeX 论文页**，不是幻灯片。
- footer 三栏（作者 / FIELD NOTES / 03/18）+ header 两行小字，chrome 面积和存在感过大。

### 1.4 AI 模板签名式元素
- 全大写、加宽字距（0.1em+）的小灰字 eyebrow（"RESEARCH COLLOQUIUM · 01"）是当前最典型的"GPT 排版指纹"。
- 组件一招鲜：callout = 左边框条、blockquote = 左边框条、ICT 标题 = 左边框条、tag = 灰边小框。所有强调手段都是"一根竖线"。
- 蓝色小方块/短粗蓝线（ICT 的 `::before` 3px 蓝杠）是 2018 年企业 PPT 模板的手法。

### 1.5 Preset 之间没有真正的差异
- `#164b80`（ucas）与 `#075e91`（ict）在投影上**肉眼不可区分**；default 的石墨 `#343d46` 约等于"没有颜色"。
- 三个 preset 共享同一套构图（左对齐封面、相同 section 结构、相同组件），差异只是换了 logo 和 5% 的色调。换皮不换骨。

### 1.6 名字与设计无关
"Veil（面纱）"是一个极好的名字 —— 半透明、层次、揭幕、若隐若现 —— 但当前设计是**不透明的、平面的、一览无余的**。名字承诺的气质完全没有兑现。

> **保留清单**：token 分层架构（`--presentation-*` + preset 覆盖 + `color-mix` 派生）、preset 隔离机制、语义组件族（callout/badge family）、媒体可访问性、质量门禁体系。骨架是好的，需要换的是**皮和气质**。

---

## 2. 设计概念：让 "Veil" 名副其实

三个关键词，作为后续所有决策的评判标准：

1. **层（Layers）** —— 用色层而非线条建立层次：canvas（纸）→ tonal surface（纱）→ raised surface（台）。层级由**明度与饱和度的递进**表达，而不是 1px 灰线。
2. **揭幕（Reveal）** —— 动效与构图的母题：内容以柔和的上升 + 淡入进入；封面的视觉重心从"顶部堆字"改为"自下而上的展开"。
3. **一抹浓色（One strong note）** —— 每页只允许一个高饱和焦点（accent 关键词、一个数据、一个图表元素）。其余全部退到中性层。当前的"accent 平均涂抹在边框、marker、链接、页码上"等于没有焦点。

---

## 3. 色彩系统

### 3.1 从"单色 accent"到"色阶 + 表面"

每个 preset 提供三层表面，全部由 `color-mix` 从基色派生，保持现有 token 架构：

```css
.slidev-layout[data-presentation-preset="default"] .slide-frame {
  /* 基色：纸 + 墨 + 主色 + 点缀色 */
  --veil-paper:      #faf9f6;   /* 暖纸白，取代 #ffffff */
  --veil-ink:        #1d2126;
  --veil-accent:     #2f3b46;   /* 石墨 */
  --veil-highlight:  #c2572e;   /* 赭石橙：mark、关键数据、图表第二色 */

  /* 三层表面：层次靠明度递进，不靠线 */
  --presentation-bg:          var(--veil-paper);
  --presentation-bg-muted:    color-mix(in srgb, var(--veil-accent) 5%, var(--veil-paper));
  --presentation-bg-elevated: #ffffff;

  /* 线条只用于仍有功能的地方，且更淡 */
  --presentation-border:        color-mix(in srgb, var(--veil-ink) 10%, transparent);
  --presentation-border-strong: color-mix(in srgb, var(--veil-ink) 22%, transparent);
}
```

规则：
- **纸不是纯白**。default 用暖纸白（`#faf9f6`），ucas 用冷白（`#f9fafc`），ict 用极浅蓝灰白（`#f7f9fb`）。仅这一个改动就能消除"默认 HTML 文档"感。
- **每个 preset 一个 highlight 对比色**，用于 `<mark>`、关键数字、图表强调系列。这是目前完全缺失的维度。
- accent 不再涂抹在页码、marker、所有边框上；边框回到中性墨色派生，accent 只出现在真正需要引导视线的地方。
- 阴影：raised 表面用极软的环境阴影（`0 1px 2px rgb(29 33 38 / 4%), 0 8px 24px rgb(29 33 38 / 6%)`），媒体/代码浮在纸面上 —— 呼应"层"。

### 3.2 Preset 色板（分化到"一眼可辨"）

| Preset | 母题 | 纸 | Accent | Highlight | 气质参照 |
| --- | --- | --- | --- | --- | --- |
| `default` | **Paper / 编辑部** | 暖纸白 `#faf9f6` | 石墨 `#2f3b46` | 赭石 `#c2572e` | Monocle / 杂志长文排版 |
| `ucas` | **Folio / 学术卷宗** | 冷白 `#f9fafc` | 学术蓝 `#1d4e8e` | 朱红 `#b3352c`（校徽红） | 大学出版社文集 |
| `ict` | **Blueprint / 工程图** | 蓝灰白 `#f7f9fb` | 信号蓝 `#0b6bcb` | 警示橙 `#d9730d` | 工程蓝图 / 技术规范 |

- 两个蓝的**色相与明度必须拉开**（`#1d4e8e` 偏皇家蓝，`#0b6bcb` 偏亮青蓝），并在构图上进一步强化差异（见 §7）。
- highlight 三色（赭石 / 朱红 / 橙）色相相近但归属不同母题，保证跨 preset 的"veil 家族感"。

### 3.3 深色模式：墨色，不是蓝灰

```css
html.dark .slidev-layout[data-presentation-preset] .slide-frame {
  --presentation-bg:          #101214;  /* 中性墨，不带蓝色倾向 */
  --presentation-bg-muted:    #17191c;
  --presentation-bg-elevated: #1e2125;
  /* accent 提亮并去饱和 10%，highlight 提亮 15% */
}
```

深色的层次同样用明度递进表达；ucas/ict 可在墨色中保留 2–3% 的 accent 色相倾向（`color-mix(in srgb, var(--veil-accent) 4%, #101214)`），维持 preset 气质。

---

## 4. 字体排印

### 4.1 职责对调：serif 做展示，sans 做阅读

| 角色 | 现状 | 建议 |
| --- | --- | --- |
| 封面/章节/statement 大字 | Inter 600 | **Libertinus Serif 500–600**（display），字距 -0.01em |
| 页内标题 h1–h4 | Inter 600 | Inter 600（不变，但见 §4.3 尺寸阶梯） |
| 正文 | Libertinus 19px | **Inter 400，18px，行高 1.55** |
| 引文 quote | serif italic（√） | 保持，放大到 28px |
| 标签/页码/表注 | Inter / mono | Inter 500，**停用全大写 + 加宽字距**（见 §4.4） |

投影环境下，serif 的笔画对比在 18–19px 处全是噪点，在 56px+ 处才是气质。把 Libertinus 从正文解放出来，封面和章节立刻获得当前完全缺失的"编辑感"。

### 4.2 CJK 策略（当前完全缺失）

- 中文 display：标题用 **Noto Serif SC 600**（宋体感与 Libertinus 的拉丁 display 角色对齐）；如坚持黑体标题，用 **Noto Sans SC 500 而非 700** —— 思源黑体 Bold 在投影下笔画粘连。
- 中文正文：Noto Sans SC 400，行高 **1.6**（高于拉丁的 1.55），字号同拉丁。
- 中文禁止斜体（已有）、禁止 letter-spacing（已有）；新增 `hanging-punctuation: first allow-end`，浏览器支持时启用中西文自动间距。
- 中西文混排时 CJK 字号 ×1.02 补偿视觉大小差。

### 4.3 尺寸阶梯（取代目前的零散 rem）

```
12  14  16  18  21  28  36  48  64  96
└─ caption/footnote ─┘ └body┘ └h3┘ └h2┘ └h1┘ └section┘ └cover┘ └display┘
```

关键改动：cover 64px、section 48px、statement 可到 **96px**（当前 statement 只有约 49px，所以"一句话在虚空里飘"）。display 级别必须大到产生压迫感，留白才被组织成"构图"而非"没排完"。

### 4.4 杀掉 AI 指纹

- eyebrow / kicker：改为**小写或首字母大写、字距 +0.02em、字号 13px、accent 色 500 字重**。全大写 + 0.14em 字距是 GPT 排版指纹，留给真正的法律文档。
- 页码保留 mono + tabular-nums（这是好细节），但颜色退回 text-muted，不再用 accent。
- ICT 标题的"左边框条"、封面 eyebrow 的"3px 蓝杠"全部删除。

---

## 5. 版式与空间

### 5.1 减重 chrome（从"论文页"到"幻灯片"）

- 删除 header 的整条 hairline 与 footer 的整条 hairline；header/footer 信息**靠空间分隔**，不靠线。
- footer 从三栏减到两栏：左侧 deck 标题（一行，可省略），右侧页码。作者名不进 footer（封面已有）。
- 内容区 padding 从 3rem 增加到 **4rem 左右**，给构图让位。

### 5.2 封面：自下而上的"揭幕"构图

```
┌────────────────────────────────────┐
│  ( signature / 留白 )              │
│                                    │
│  eyebrow（小、quiet）              │
│  标题 64px serif，最多 3 行        │
│  副标题 21px，text-muted           │
│                                    │
│ ══ meta 带：tonal surface 通栏 ══  │  ← 作者 · 机构 · 日期
└────────────────────────────────────┘
```

- 底部的作者/日期从"hairline 上方的小字"改为一条 **tonal surface 横带**（accent 4% 底，无线）—— 这是"层"母题在封面上的落点，也是当前封面最缺的"一块被设计过的颜色"。
- `::visual::` / `image` 存在时，视觉占右 5/12 列，标题区左 7/12，meta 带仍在底部通栏。
- default 左对齐、ucas 居中（保留其典礼感）、ict 左对齐（不变），但三者共享同一套"meta 带 + display serif"骨架。

### 5.3 章节页：序号成为构图元素

- 序号放大到 **120–180px、accent 8–10% 色**，作为标题背后的"背景字"（类似大号 folio），标题 48px serif 压在其基线处。当前 2rem 的序号畏缩且无意义。
- ucas 保持居中，但序号用旧式数字（oldstyle figures）体现学术感；ict 序号用 JetBrains Mono。

### 5.4 statement：大到成立

96px、measure 14ch、居中，允许其中一个关键词用 highlight 色。一行话撑满视野，才是 statement。

### 5.5 two-cols 与内容页

- 删除两栏中间的 1px 分隔线，用 **4rem gutter** 分隔（空间 > 线条）。
- 内容页 h1 下增加 0.2em 的呼吸空间；阅读栏宽从 100% 收到 **68ch**（当前 `--presentation-reading-width: 100%` 导致长行）。

---

## 6. 组件：从"竖线条"到"色层面"

| 组件 | 现状 | 建议 |
| --- | --- | --- |
| Callout | 2px 左边框 + 5% 底色 | **全圆角 8px 色面**：family 色 6% 底 + 同族 500 字重标题 + 图标；无边框。形状 marker（▲◆●）保留做区分 |
| 表格 | 上下粗线 + 斑马纹 | 只保留 header 下一条线；斑马纹取消或仅在 hover 出现；数字右对齐已有（√） |
| 代码块 | 灰底 + 边框 + 阴影 | muted 表面 + **无边框** + 顶部 28px 语言标签条（mono 12px）；阴影去掉，归入"层"体系 |
| Tag/Badge | 灰边小框 | 描边改 family 色 30%，圆角 999px 统一；字号 13px |
| blockquote | 左边框条 | serif italic + **悬挂大引号**（accent 20% 色的 64px 引号字符），无线 |
| Steps/Timeline | 圆点 + 竖线（√） | 保留，节点数字改 accent 实底白字，增强完成感 |
| 图片/Figure | 1px 边 + 阴影 | 圆角 8px + 软阴影（raised 层），caption 统一 "Fig. n —" 编号体系 |

原则重申：**线条退出装饰，只保留功能分隔；层次交给色面与阴影。**

---

## 7. Preset 分化策略（换骨，不只换皮）

在共享骨架（§5.2 封面结构、type scale、组件体系）之上，每个 preset 拥有一个**排他的构图母题**：

- **default「Paper」**：暖纸 + serif display + 赭石 highlight。eyebrow 前 24px 细线。无机构签名，最宽敞。面向通用演讲与写作型分享。
- **ucas「Folio」**：冷白 + 居中典礼构图 + 签名居顶中。章节序号用旧式数字（oldstyle figures）体现学术感；引文与副标题用 serif；朱红 highlight 仅用于关键结论。面向学位答辩、学术报告。
- **ict「Blueprint」**：蓝灰白 + **2.5% 透明度的方格蓝图纹**（8px 网格，仅封面与章节页背景，内容页关闭）+ mono 标签系统 + 工程图式序号（`SEC.03`）。这是三 preset 中唯一允许背景纹理的，与"技术海报"定位匹配。面向技术分享、项目评审。

这样即使遮住 logo 和颜色，三者的**构图语言**也不同 —— 这是当前完全没有做到的。

---

## 8. 动效语言（Veil 的"揭幕"）

- 页面进入：内容上移 16px + 淡入，520ms，`cubic-bezier(0.22, 1, 0.36, 1)`（现有曲线很好，保留）。
- 子元素 stagger 40ms（标题 → 正文 → meta 带），仅 cover/section/statement 启用。
- `v-click`：fade-rise 8px / 300ms，不用 slide-left（与"揭幕"母题冲突）。
- `prefers-reduced-motion` 与 print 全部降级（现有机制保留）。

---

## 9. 图像与图表

- 主题提供一套**图表默认色序**（accent → highlight → 中性灰 ×2），SVG/图表库可从 CSS 变量取色，避免示例里"默认细黑线图表"直接上幻灯片。
- 图片处理三选一并写入文档：`plain`（圆角 + 阴影）、`framed`（raised 表面内 padding）、`bleed`（封面/section 可用全幅 + 20% 暗角渐变保证文字可读）。
- 正文中的图片最大高度从 62vh 收到 52vh，把呼吸还给版面。

---

## 10. 落地路线

| 阶段 | 内容 | 风险与验证 |
| --- | --- | --- |
| 0. 打样 | 先做 3 张封面 + 1 张内容页的高保真打样（可直接在 fixture 里改 token 实现），评审通过再全面铺开 | 用 `screenshot:*` 脚本出图评审 |
| 1. Tokens | 色阶/表面/highlight/墨色深色版；type scale 常量化 | `preset-isolation` 与 `accessibility` 门禁必须全绿 |
| 2. 骨架 | chrome 减重、封面 meta 带、章节大序号、statement 放大 | `cover-*`、`layout-stability` 门禁 |
| 3. 组件 | 色面化改造（callout/code/tag/blockquote/table） | `elements`、`content-contracts` 门禁 |
| 4. Preset 分化 | 三套构图母题 + 蓝图纹 + 字体角色对调 | `veil-design` 画廊检查更新后通过 |
| 5. 动效与图像 | stagger、v-click 曲线、图表色序 | `motion` 门禁 + reduced-motion 抽查 |
| 6. 文档 | 更新 `veil-redesign.md` 为 0.4 契约、重拍 `docs/assets/veil/*` 联系表 | — |

顺序原则：**先色和字（收益最大、风险最小），再版式，再组件，最后动效。** 每阶段结束重出三 preset 联系图对比。

### 验收清单（新版"一眼测试"）

1. 遮住 logo，3 秒内能区分三个 preset。
2. 任意一页截图，找不到一条纯装饰性 hairline。
3. 任意一页只有一个高饱和焦点。
4. 封面截图发给没看过项目的人，问"这是什么工具做的" —— 答案不再是"AI 生成的"。
5. 投影距离（2m 外看 24 寸屏）正文清晰、serif 只出现在大字。

---

## 11. 一句话总结

> 现在的 Veil 是一份**用幻灯片尺寸排版的论文**；它应该成为一场**被精心布光的揭幕** —— 纸有温度，色有层次，字有对比，preset 有性格。
