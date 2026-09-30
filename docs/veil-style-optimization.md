# Veil 样式优化设计文档

> **状态：已被 [朱白设计文档](./zhubai-design.md) 吸收并取代。** 本文保留审计结论（第 2–3 章的问题诊断仍然有效），方案以朱白文档为准。

> 状态：提案（未实施） · 面向版本：0.5 · 撰写依据：0.4.0 源码审计 + `docs/assets/veil/{light,dark,preview}.png` 渲染审查
> 相关文档：[0.4 设计契约](./veil-redesign.md) · [字体规范](./veil-typography.md) · [预设身份](./preset-identities.md)

## 0. 摘要

Veil 0.4 已经具备扎实的工程基础：完整的 token 体系、15 个布局、8 个组件、双模式色彩、系统的质量门。但从渲染结果看，视觉表达落后于工程能力，核心症状是**三个预设看起来几乎一样、页面近乎单色、演示感弱于文档感**。

本文档提出一次不改公共 API 的视觉刷新：以色彩系统和暗色模式修复为基础，把预设差异从"换 hue"升级为"结构性差异"，并对封面、章节页、内容页、组件做分层精修。全部改动限定在 token 与样式层，布局 props、组件 props、frontmatter 字段保持兼容。

## 1. 背景与目标

### 1.1 现状

- 三预设（Paper / Folio / Blueprint）共享同一套构图：左轴封面 + 底部 meta 带、章节大数字 + 标题、内容页 36px sans 标题 + 18px 正文。
- 差异仅体现在：accent 色相、eyebrow 字体（ICT 用 mono）、机构签名、ICT 一层 1.5% 透明度网格。
- 暗色模式三预设差异进一步收窄：背景只混入 4% 预设色，accent 被 `color-mix(accent 65%, white)` 统一去饱和成灰色。

### 1.2 目标

| # | 目标 | 衡量方式 |
| --- | --- | --- |
| G1 | 三预设在缩略图尺寸（约 300px 宽）下即可互相区分 | 联系表目检：不看 logo 也能认出预设 |
| G2 | 每页有且仅有一个明确的视觉焦点 | 页面审查清单 |
| G3 | 暗色模式保留预设性格，accent 不发灰 | 暗色联系表目检 + 对比度测试 |
| G4 | 内容页从"文档排版"转向"演示排版" | 标题/正文占比、焦点审查 |
| G5 | 零公共 API 破坏 | 现有 quality gates 全绿（契约允许的断言更新除外） |

非目标：不恢复 0.3 移除的 artwork 引擎；不重绘机构签名；不新增布局或组件 props；不改变 Slidev 原生布局语义。

## 2. 现状审计

### 2.1 视觉审计（基于渲染联系表）

**封面**
- 默认预设左对齐封面右上象限存在大面积无信息空间，视觉重心沉在左下，页面显得"空"而非"留白"。
- 底部 meta 带是一条平涂浅灰横带，作者/单位/日期之间无分隔节奏，信息层级弱。
- 三预设封面构图完全一致；遮住 logo 与 eyebrow 后无法区分。

**章节页**
- 144px folio 大数字透明度仅 9%（暗色 10–12%），在投影与截图下接近不可见，成为"渲染噪点"而非设计资产。
- ICT 的 `SEC.` 前缀同样过淡。

**内容页**
- 36px 标题在 980×552 画布上视觉占比偏小，标题区缺少结构（无 kicker、无规则线），页面顶部"飘"。
- 表格为单 hairline 表头线，学术感可以，但数字列缺少视觉锚定。
- Callout 为平涂 tonal 块，family 色只出现在 0.48rem 的小 marker 上，3 米外不可辨。
- 除链接与列表 marker 外，accent 几乎不出现在内容页——页面实际呈单色 graphite。

**Statement / Quote / Center**
- 三个居中布局的区分度低：都是"居中 serif 大字 +  muted 小字"。
- `mark` 高亮是矩形色块补丁，叠在 96px serif 上边缘生硬，暗色模式下更粗糙。

**暗色模式**
- accent 统一 `color-mix(accent 65%, #eef0f2)`：UCAS 蓝、ICT 蓝、default 石墨全部退化为相近的浅灰蓝，品牌感丢失。
- 三预设背景仅 4% 色相差异，肉眼不可辨。
- ICT 网格在暗色下完全消失。

### 2.2 工程审计

| 问题 | 位置 | 影响 |
| --- | --- | --- |
| 三个 preset CSS 约 90% 内容重复（同一 token 块复制三遍，仅数个值不同） | `styles/presets/{default,ucas,ict}.css` | 改一处要改三处；重复代码与预设趋同互为因果 |
| `--presentation-*` 与 `--veil-*` 双命名并存，职责边界未文档化 | `styles/tokens.css`、各 preset | 贡献者不知道新 token 该用哪个前缀 |
| token 定义层级分散：`:root`、`.slidev-layout`、`.slide-frame`、preset 层各有定义 | tokens / presets / shared | 覆盖优先级靠经验，preset 隔离测试成本高 |
| 动效参数硬编码（520ms、cubic-bezier(0.22,1,0.36,1)、40ms stagger） | `presets/shared.css` | 无法按预设或按用户偏好调整 |
| 阴影只有一档（`--presentation-shadow` 即 media shadow） | preset CSS | elevated/framed/bleed 无层级区分 |
| 图表色板仅 4 色，且 3/4 号色是 ink 透明度变体 | preset CSS | 多系列数据可视化不够用 |

## 3. 问题诊断（按影响排序）

1. **P1 预设无结构差异** — 差异化只靠 hue，违背"three distinct presentation presets"的产品承诺。
2. **P1 暗色模式 accent 去饱和** — 暗色下三预设趋同且品牌色丢失，属于实现缺陷而非设计意图。
3. **P2 色彩角色系统缺失** — accent 没有"结构性提示 vs 焦点强调"的使用规则，导致全局近乎单色。
4. **P2 封面与章节页构图单薄** — 重心偏移、meta 带信息层级弱、folio 数字不可见。
5. **P2 内容页演示感不足** — 标题占比小、缺页首节奏、accent 缺席。
6. **P3 组件识别度** — callout family 色太弱、mark 高亮粗糙、表格缺三线表选项。
7. **P3 token 架构** — 重复与双命名阻碍后续所有视觉迭代。

## 4. 设计原则

1. **结构承载身份，颜色承载情绪。** 预设差异首先体现在网格、构图、字排处理上，颜色是最后一层。
2. **一页一个焦点。** accent/highlight 的全页使用次数有预算，焦点由作者内容决定，主题只提供机制。
3. **纸面层级可感知。** canvas → tonal → raised 三层表面在任何模式下可分辨，但不依赖投影堆叠。
4. **暗色是再设计，不是反色。** 暗色独立定义 accent 与表面，保持色相、提高明度。
5. **中文是一等公民。** 所有字排决策同时在 Latin 与 CJK 渲染下验收。
6. **API 冻结。** 本次刷新不新增必需 props，不改变既有 props 语义；新能力全部为可选。

## 5. 优化方案

### 5.1 色彩系统：从"一个 accent"到"角色 + 预算"

**角色定义**（新 token，均派生自现有 `--veil-*` 基础色，不引入新的裸色值）：

| 角色 | Token | 用途 | 全页预算 |
| --- | --- | --- | --- |
| 结构提示 | `--presentation-accent`（现有） | eyebrow、链接、当前态、编号 | 不限（低饱和场景） |
| 焦点强调 | `--presentation-focus`（新增，默认 = `--veil-highlight`） | 每页一个关键数字、关键词、关键曲线 | ≤ 1 处 |
| 表面层级 | `--presentation-bg` / `-bg-muted` / `-bg-elevated`（现有） | canvas / tonal / raised | — |
| 墨水层级 | `--presentation-text` / `-text-muted`（现有）+ 新增 `--presentation-text-faint`（muted 的 70%） | 三级文字 | — |

**焦点机制**：新增工具类 `.presentation-focus`（文字色 = focus 色）与 `<mark>` 的新处理（见 5.6）。图表 token 从 4 色扩到 6 色：`--veil-chart-1` accent、`--veil-chart-2` highlight、3–4 为 ink 中性（现有）、新增 5–6 为 accent 的 55%/30% 明度变体，保证与 1 号色同族和谐。

**预期效果**：内容页不再是纯石墨单色；作者用 `==文本==` 或 `.presentation-focus` 即可获得与预设协调的焦点色。

### 5.2 暗色模式：按预设重新定义 accent

废弃统一的 `color-mix(accent 65%, white)` 公式，为每个预设声明暗色专用 accent（保持色相、提升到 65–75% 明度）：

| 预设 | 亮色 accent | 暗色 accent（提案） | 暗色背景（提案） |
| --- | --- | --- | --- |
| default | `#2f3b46` | `#8fa3b0`（亮石墨） | `#131514`（微暖墨） |
| ucas | `#1d4e8e` | `#7aa5e0`（学术蓝） | `#101419`（冷墨，6% 蓝） |
| ict | `#0b6bcb` | `#5aa3e8`（信号蓝） | `#0f1418`（蓝灰墨，6% 蓝） |

- 暗色背景预设色混入从 4% 提到 6–8%，使三预设暗色可辨。
- highlight 暗色值保留现有做法（已按预设定义），但同步检查 `mark`、focus 在暗色的对比度（目标 ≥ 4.5:1 对背景）。
- ICT 网格暗色下使用 accent 6% 透明度（亮色 2.5%/1.5% 体系不变，见 5.3）。

### 5.3 预设差异化：结构层

每个预设获得一组"别人没有"的构图/字排特征。以下全部为 CSS 层差异，不改布局组件结构。

**default · Paper（编辑纸面）**
- 内容页标题下增加 2.5rem 短 hairline（accent 色，1px），与封面 eyebrow 的短 rule 呼应，形成该预设的签名节奏。
- 封面 meta 带顶部加 1px hairline，带内作者 | 单位 | 日期分为三栏（当前是两栏混排）。
- 章节 folio 数字用 oldstyle 衬线（现状），透明度从 9% 提到 16%，并允许使用 `--presentation-section-index-color` 的 accent 版本。

**ucas · Folio（学术礼仪）**
- 内容页标题居中 + 标题上下各一条 1px 细线（双线夹题，folio 书的章首处理）——这是三预设中唯一居中标题的内容页。
- 章节页维持居中，folio 数字透明度提到 14%。
- 封面 meta 带改为居中多行（现状已居中），增加上下 hairline。

**ict · Blueprint（技术图纸）**
- 网格从 1.5%/2.5% 提到 3%/5%（暗色 6%），并把 8px 方格改为 24px 方格 + 8px 细分——当前 8px 密格在任何透明度下都更像噪点，稀疏主格才读得出"图纸"。
- 内容页标题左侧加 mono 编号前缀槽（`01 /` 样式，来自章节序号，纯 CSS counter），eyebrow/kicker 保持 mono。
- 章节 `SEC.` 前缀与数字透明度提到 18%。

**差异化验收**：`fixtures/preset-design.md` 联系表在 300px 缩略宽度下，遮住 logo 仍可区分三预设（G1）。

### 5.4 字体排印

| 项 | 现状 | 提案 | 理由 |
| --- | --- | --- | --- |
| 内容页 H1 | 36px | 40px（two-cols 28→30px） | 980×552 画布上标题占比偏小，40/18 的比例更接近演示稿层级 |
| H1 字距 | -0.01em | -0.02em（仅 display 场景沿用） | serif display 已 -0.01～-0.02em，sans 大标题收紧半档更挺 |
| CJK display 字重 | 600 | 封面/章节 CJK 用 700 | Noto Serif SC 600 在 48px+ 投影下偏细；字体已加载 700 |
| 强调手段 | 仅 `mark` 色块 | 新增 display italic 强调：statement/quote 内 `<em>` 用 serif italic + accent 色 | 大字号上的矩形色块生硬（见 5.6） |
| Statement 副标题 | 18px | 18px 不变，与标题间距 16px→20px | 现行 0.4 已修过一次，再放宽半档呼吸感 |

字排其余部分（字号刻度、行高、CJK 1.6 行高、hanging-punctuation、`halt`）维持 0.4 契约。

### 5.5 版式与构图

**封面**
- 默认（左轴）构图：标题块整体上移，`slide-cover__main` 的 `align-content: end` 改为 `end` 但 padding-block 上限从 `clamp(2.25rem, 5vh, 3.5rem)` 提到 `clamp(3rem, 8vh, 5rem)`，减少右上的"塌陷感"。
- 无 visual 时，允许 eyebrow 上方出现可选的 accent 短 rule（default 已有；UCAS/ICT 用各自签名元素替代）。
- meta 带：背景从 `accent 4%` 提到 `accent 6%`（暗色 8%→10%），顶部 1px hairline，内部三栏化（见 5.3）。

**章节页**
- folio 数字：透明度提升（5.3），并新增可选"描边数字"处理（ICT：`-webkit-text-stroke: 1px accent 30%; color: transparent`），让 144px 数字从噪点变成构图元素。
- 数字与标题的垂直对齐增加一档 `baseline` 选项（当前仅 grid 并列）。

**内容页**
- 页首节奏：可选 frontmatter `kicker`（内容页，非仅章节页），渲染为标题上方 13px label；kicker + H1 + （预设签名线）构成固定的页首三段式。
- 页脚：保留现状（deck label + 页码），新增可选 `chrome: ruled` 在页脚上方加 1px hairline——Paper 预设默认开启，其余默认关闭。

**Statement**
- 支持"焦点词"：statement 内的 `==词==` 渲染为 accent 色文字（非色块），使 96px 大字有一个色彩锚点。

### 5.6 组件精修

**Callout**：保留 borderless tonal 表面，左侧增加 2px family 色条（`border-inline-start`，圆角内收）。family 色从"0.48rem marker 独享"扩展到色条 + 标题，3 米外可辨；marker 形状系统保留。

**mark 高亮**：色块补丁改为"淡色底 + 实线下划"双层：
- 底层：`color-mix(highlight 14%, transparent)` 背景，`border-radius: 2px`，负 inset 微调；
- 底线：`border-bottom: 2px solid color-mix(highlight 55%, transparent)`；
- 大字号场景（statement/display 内）退化为纯 accent 色文字 + 无背景（避免 96px 上的色块）。

**表格**：新增可选 `table` 修饰类 `.presentation-table--booktabs`（三线表）：顶 1.5px strong rule、表头下 1px、底 1.5px strong rule，无纵向线——比当前单 hairline 更贴合学术预设；默认表格样式不变。

**Badge / Tag / Kbd**：维持现状，统一走 4px/999px 两档圆角系统（已基本是）。

**Figure**：`framed` treatment 的阴影与 `plain` 拉开层级（引入二级阴影 token，见 5.7）；caption 的 `Fig. n —` 前缀保留。

### 5.7 动效与阴影 token 化

新增 token（定义在 `tokens.css`，可被预设覆盖）：

```css
--presentation-motion-duration: 520ms;
--presentation-motion-easing: cubic-bezier(0.22, 1, 0.36, 1);
--presentation-motion-stagger: 40ms;
--presentation-motion-rise: 16px;
--presentation-shadow-1: 0 1px 2px rgb(29 33 38 / 4%), 0 8px 24px rgb(29 33 38 / 6%);
--presentation-shadow-2: 0 2px 6px rgb(29 33 38 / 6%), 0 16px 40px rgb(29 33 38 / 10%);
```

- 现有硬编码动画全部改读 token；`prefers-reduced-motion` 与打印行为不变。
- 封面 visual 入场增加 `scale: 0.985 → 1`（与 rise 同时长），让视觉区与文字区有主次。
- `--presentation-media-shadow` 默认 = `shadow-1`，`framed` = `shadow-2`。

### 5.8 token 架构整理（工程前置）

1. 提取 `styles/presets/base.css`：三个 preset 文件中相同的 token 块只保留一份；各 preset 文件只写 **delta**（颜色、字体角色、签名特征）。预计 preset 文件从约 230 行降到 60–80 行。
2. 命名约定文档化（写进 `docs/theme-boundary.md` 或新 `docs/token-contract.md`）：
   - `--veil-*`：原始色料与品牌资产（paper、ink、accent、highlight、chart、grid）——预设层定义；
   - `--presentation-*`：语义角色（bg、text、border、字体角色、尺寸、动效、阴影）——从 `--veil-*` 派生，布局/组件只消费这一层。
3. 层级约定：尺寸/字体角色在 `.slidev-layout, .slide-frame`；颜色在 preset 作用域；frame 级覆盖只放 truly per-frame 的值。

## 6. 备选方向与取舍

| 方向 | 描述 | 取舍 |
| --- | --- | --- |
| **A. 深化编辑纸面（推荐）** | 即本文第 5 章：保留 0.4 的克制气质，修色彩与暗色、用结构差异区分预设 | 风险最低，兼容全部 API；视觉上仍是"安静的学术主题"，不会让人眼前一亮 |
| B. 瑞士网格路线 | 12 列显性网格、粗 rule、编号系统、强对比 sans 主导 | 演示感强，但与 Libertinus serif display 的现有身份冲突，等于重做预设；API 虽可兼容，视觉契约（veil-redesign.md）要重写 |
| C. 当代杂志路线 | 超大字对比、非对称出血、accent 色块、italic 混排 | 冲击力强，但牺牲学术场景的稳妥，CJK 大字排版风险高，与 UCAS/ICT 机构气质不符 |

**建议**：以 A 为主线，吸收 B 的"ICT 显性网格"（5.3）与 C 的"display italic 强调"（5.4）两个局部元素。若 A 落地后仍希望拉开差距，再单独立项 B 作为第四预设而非替换。

## 7. 实施路线

| 阶段 | 内容 | 风险 | 验收 |
| --- | --- | --- | --- |
| Phase 0 | token 架构整理（5.8）：提取 preset base、消除重复、命名文档化 | 低（纯重构） | `quality` 全绿；preset 隔离测试不变 |
| Phase 1 | 色彩角色 + 暗色模式修复（5.1、5.2） | 低（token 值变更） | 三预设亮/暗截图对比；accessibility spec 对比度断言更新 |
| Phase 2 | 预设结构差异（5.3）+ 字排调整（5.4） | 中（视觉契约变更） | `veil-design.spec` 契约更新；preset-design 联系表 G1 目检 |
| Phase 3 | 封面/章节/内容页构图（5.5）+ 组件精修（5.6） | 中 | cover-composition、elements-gallery 夹具更新 |
| Phase 4 | 动效/阴影 token 化（5.7） | 低 | motion spec 更新；reduced-motion 探针 |

每个阶段独立可发布（0.4.x 补丁序列），Phase 2+3 合并发 0.5.0。

## 8. 验证

沿用现有质量门（`pnpm run quality`），需要更新的契约：

- `veil-design.spec.mjs` / `veil-surfaces.spec.mjs`：暗色 accent、背景混入比、meta 带 hairline 的新值断言；
- `typography.spec.mjs`：H1 40px、CJK display 700；
- `cover-composition.spec.mjs` / `cover-alignment.spec.mjs`：meta 三栏与 hairline；
- `accessibility.spec.mjs`：新增 focus 色、暗色 accent 的对比度用例；
- 截图：`screenshot:{default,ucas,ict}` 三预设亮/暗联系表，按 G1–G4 目检。

行为探针补充：暗色下 ICT 网格可见性（计算样式断言 background-image 存在且透明度 ≥ 5%）、mark 在 statement 内无色块（computed style 断言）。

## 9. 兼容性承诺

- 所有布局、组件 props、frontmatter 字段语义不变；
- `--presentation-*` 既有 token 名称与默认值在新架构下保持可用（允许值微调，不允许删除）；
- 新增 token（`--presentation-focus`、`--presentation-text-faint`、motion/shadow 系列）均为可选消费；
- 机构签名资产与位置不动；
- 0.3 移除的 artwork 引擎不恢复。
