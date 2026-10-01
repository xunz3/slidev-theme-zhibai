# 配置与覆盖规则

最小配置只需要选择一个 preset。其余选项在有实际需求时再填写。

```yaml
themeConfig:
  presentation:
    preset: qingdai
```

## 全局与单页使用相同的字段

全局入口为 `themeConfig.presentation`，单页入口为 frontmatter 的 `presentation`。每个字段独立继承；某个字段无效不会使其他字段失效。

| 字段 | 值 | 默认值 | 兼容的页级字段 |
| --- | --- | --- | --- |
| `preset` | `zhubai / qingdai / songmo / ucas / ict` | `zhubai` | `presentationPreset` |
| `coverAlign` | `left / center` | `center`，所有预设封面居中 | `presentationCoverAlign` |
| `accent` | CSS 颜色或 `auto` | 当前 preset 的结构色 | `accent` |
| `showFooter` | `true / false / auto` | `auto`，由布局决定 | `showFooter / presentationChrome / chrome` |
| `pageNumber` | `true / false` | `true` | `pageNumber` |
| `seal` | 1–4 个 Unicode 字符或 `false` | 不显示 | `seal` |

优先级为：有效的单页 `presentation` 字段 → 有效的旧页级字段 → 直接传给组件的值 → 有效的全局字段 → 当前预设与布局的默认值。旧字段冲突时，`presentationChrome` 优先于 `chrome`。旧的全局 `chrome` 仍可使用；新的 `showFooter` 优先。`chrome` 保留 `auto / on / off` 及布尔值解析，但不再是主要公共写法。

```md
---
layout: two-cols-header
presentation:
  preset: songmo
  accent: auto
  showFooter: false
---

# 一页安静的对照

::left::

方法

::right::

证据
```

省略 `accent`、填写 `null` 或无效颜色时继承全局颜色；`accent: auto` 明确恢复当前页所选 preset 的默认色。切换单页 preset 不会隐式丢弃全局 accent。所有预设的 `coverAlign` 默认值均为 `center`；切换单页 preset 时，明确设置的全局对齐值继续继承。需要左对齐时，在全局或单页显式设置 `coverAlign: left`。

## 页脚文字、页脚可见性与页码

`showFooter` 控制整个页脚；`footer` 是文字内容。页级 `footer` 优先于全局 `footer`，随后回退到全局 `title`。`footer: false` 隐藏文字，页码仍可显示；`pageNumber: false` 隐藏页码，文字仍可显示。

| 布局 | `showFooter: auto` |
| --- | --- |
| `cover / section / end` | 隐藏 |
| 主题内容布局、原生 `fact / two-cols-header` | 显示 |
| 原生 `full / image / iframe / iframe-left / iframe-right` | 隐藏，保留画布 |
| `none` | 由作者完全控制，不注入主题与页脚 |

原生布局使用与主题布局相同的 preset、强调色和字体解析。原有 slots 与满幅图片几何保留。`two-cols` 和 `two-cols-header` 支持 `columnRatio: 0.6`，表示左栏占可用双栏宽度的 60%；支持 0.2–0.8，缺省或无效值恢复等宽。`two-cols` 仍支持 `gap` 与 `reverse`。

## 强调色的范围

`accent` 影响链接、结构编号、信息提示、代码边界及图表的结构系列。它不会把整个预设自动重新配色。纸、墨、固定朱色签名、印章、预设表格规则与成功／警告／错误等语义色保持各自角色。松墨将提示与图表设为黑白，但保留类型标签、线型和编号；朱色仅留给可选印章和作者显式重点。

## 标准字体与离线演示

直接使用 [Slidev 的 `fonts` 配置](https://sli.dev/custom/config-fonts)。主题把 Slidev 已解析的 `sans / serif / mono` 字体栈映射到正文、展示标题、引用与标签角色，不再注入远程字体 CSS。

默认字体通过 Slidev 的同一个 provider 加载：Inter、Libertinus Serif、JetBrains Mono、Noto Sans SC、Noto Serif SC。默认请求 400 / 600 / 700 的正体字重，避免对中文字体请求不支持的斜体。不同预设决定哪些角色使用衬线或无衬线。

```yaml
fonts:
  sans: Arial
  serif: Georgia
  mono: Courier New
  provider: none
```

这段配置完全禁用自动字体请求；系统必须已经安装所选字体。自托管时在作者的 CSS 中定义 `@font-face`，并使用 `provider: none` 或 `fonts.local`。离线演示仍需要先构建或导出，使其他资源也在本地；字体禁用不等于自动缓存远程图片与嵌入内容。

## 视觉内容与主题边界

简单封面图片使用 `image / imageAlt`；复杂图表或组件放在 `::visual::`；省略二者即可留空。主题不提供 artwork 引擎、自动缩字或额外的字体配置体系。`references` 只提供排版；BibTeX 解析、自动引文与参考文献生成交给作者或 addon。
