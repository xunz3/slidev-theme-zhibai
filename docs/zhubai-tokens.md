# 知白 token 契约

主题品牌自 0.6.0 起为「知白 Zhibai」。`zhubai` 仍是朱白预设 ID；`--zhubai-*` 色料 token 保持兼容。

主题分为色料、语义、消费三层。`styles/presets/base.css` 定义公共映射；各预设文件声明纸、墨、结构色、字体角色、内容密度与构图差异；布局与组件消费 `--presentation-*`。公共尺寸、字体映射、动效和阴影集中在 `styles/tokens.css`。

## 命名与作用域

| 层 | 名称 | 职责 |
| --- | --- | --- |
| 色料 | `--zhubai-*` | 纸、墨、朱、黛、机构色、图表色板、网格 |
| 语义 | `--presentation-*` | 背景、正文、边界、焦点、字体角色、尺寸、动效、阴影 |
| Slidev 桥接 | `--slidev-theme-primary` | Slidev 控件及主题结构色 |

颜色由每页 `.slidev-layout` 上的预设决定，暗色用 `html.dark` 下的显式色料值。尺寸与字体角色声明在 `.slidev-layout, .slide-frame`，原生 Slidev 布局也能继承。作者的 `accent` 在 frame 层覆盖，因此需要随 accent 变化的语义值在 frame 重新解析；不会改写其他页面。ICT 的 `--presentation-grid-color` 固定绑定预设色料，避免作者 accent 改变透明机构签名背后的纸面。

## 色料与语义映射

| 色料 | 语义 | 亮色 / 暗色 |
| --- | --- | --- |
| `--zhubai-zhu` | `--presentation-signature`, `--presentation-seal-background` | `#b83521` / `#d9644c` |
| `--zhubai-zhu-deep` | 美学预设的 `--presentation-focus` | `#9e2f1c` / `#e0785f` |
| `--zhubai-paper` | `--presentation-bg` | 各预设纸面 / 夜墨 |
| `--zhubai-ink` | `--presentation-text` | 各预设浓墨 / 纸白 |
| `--zhubai-accent` | `--presentation-accent` | 墨、黛或机构蓝 |
| `--zhubai-highlight` | `--presentation-focus` | 默认朱深；机构保留自己的 highlight |

`--presentation-text-muted` / `--presentation-text-faint` 使用墨与纸混合（68% / 45%）；边界使用墨的 10% / 22%。淡墨用于次要装饰，不能作为小字号关键信息的唯一颜色。一般封面 meta 带使用结构色 6%，松墨保留透明落款区。印章字符颜色独立于正文，始终为纸白；字体使用标准衬线角色。正文标记的 `--presentation-highlight-text` 保持 `--presentation-text` 墨色，淡朱底与朱色下划承担批注信号；封面、statement 标题中的 mark 和 `.presentation-focus` 仍使用焦点朱色。

`--zhubai-chart-1` 至 `-6` 一般依次为结构色、朱、墨的 56% / 30%、结构色的 55% / 30%；松墨将第二系列替换为墨的 72%。同时提供 `--presentation-chart-*`。图表作者仍需提供文字标签、线型等辨识手段。

表头与行底色分别使用 `--presentation-table-header-bg`、`--presentation-table-row-alt-bg`，表头细线使用 `--presentation-table-rule-color`。这些默认绑定预设色料，保持独立于作者的可选 `accent`。

## 字体与尺寸

默认正文为 Source Sans 3 / Noto Sans SC；衬线 display 为 Source Serif 4 / Noto Serif SC。朱白、青黛的内容标题使用衬线，松墨与 ICT 的 display 使用无衬线。实际字族映射到 Slidev 已解析的 `fonts.sans / serif / mono`，字体加载完全由其 provider 控制。内容 H1 40px、双栏 H1 30px。中文 display 使用显式 `lang="zh"` 字重 700，Latin 使用对应预设字重。引文的中文字体角色为 `--presentation-font-quote-cjk`：朱白、青黛、UCAS 使用标准衬线角色，跟随作者的 `fonts.serif`，松墨与 ICT 使用标准无衬线角色。

左右页边距由 `--presentation-slide-inset` 控制，默认 44px；正文与内容块宽度为内容区的 100%，不再叠加字符宽度限制。双栏间距为 32px。整页引用使用 `--presentation-quote-display-size`（36px），普通引用块使用 `--presentation-blockquote-size`（16px），次级文字色、侧边线与内距由 `--presentation-blockquote-text / border / padding` 控制，引用提示使用 `--presentation-citation-size`（18px，双栏 16px）。`--presentation-quote-accent` 决定引号颜色，朱白绑定朱色签名。

## 动效和层次

- `--presentation-motion-duration`: 520ms
- `--presentation-motion-easing`: `cubic-bezier(0.22, 1, 0.36, 1)`
- `--presentation-motion-stagger`: 40ms
- `--presentation-motion-rise`: 16px
- `--presentation-motion-seal-duration`: 260ms
- `--presentation-motion-seal-easing`: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- `--presentation-shadow-1`: 普通 Figure 的柔和阴影
- `--presentation-shadow-2`: framed Figure 的抬升阴影

动效仅在活动演示页启用；reduced-motion、打印及静态预览保持静止。

## 迁移窗口

0.5 保留旧的 `--veil-paper`, `--veil-ink`, `--veil-accent`, `--veil-highlight`, `--veil-grid-opacity` 和 `--veil-chart-*` 读取别名，指向新色料。新覆盖应写 `--zhubai-*` 或稳定的语义 token；旧别名不承诺反向改写新色料。预设 `default` 同期保留为 `zhubai` 的配置别名，布局 `default` 名称不变。
