# 朱白 0.5 实施记录

按照 [设计文档](./zhubai-design.md) P0–P4 实现。包名改为 `slidev-theme-zhubai`，版本为 0.5.0。后续仓库已同步更名为 `xunz3/slidev-theme-zhubai`，并添加 GitHub CI 与 npm 发布工作流；配置及首次发布步骤见 [发布说明](./releasing.md)。

| 阶段 | 已实现内容 |
| --- | --- |
| P0 地基 | 公共 token base、五份预设 delta、包名与文档迁移、`default` 及旧 token 别名 |
| P1 朱白 | 宣纸与夜墨、朱批、标题朱线、菱形列表、封面 meta 带 |
| P2 印章 | 可选 Seal、deck / slide 配置、24 / 36px 形制、封面盖章动效、章节对位、无配置不占位 |
| P3 家族 | 青黛、松墨、机构暗色、ICT 主格与细格、五预设隔离 |
| P4 精修 | 内容 kicker、中文 display 700、楷体引文、booktabs、两级阴影、动效 token |

## 明确的解释

- `seal: "陈"` 是显式启用，机构预设也遵守这一选项；缺省完全不渲染，`seal: false` 可在单页关闭继承。合法值为去除首尾空白后的 1–4 个 Unicode 字符。非法单页值回退到 deck。
- 配置仍由 `SlideFrame` 单点解析，通过 scoped slot 向封面、章节和结束页传递，避免布局各自重复解释 deck / slide 继承。
- “一页一朱”是作者的焦点预算，不通过运行时扫描或删除内容来强制。朱线、朱点和目录编号属于结构性朱。
- ICT 保留橙色 highlight 色料，焦点文字语义色混入 35% 正文墨色以保证可读性；正文 mark 的文字按审查修正为墨色，焦点色继续用于批注底色、下划线及 display 强调。
- 楷体使用本地字体栈，不增加 webfont 请求。没有楷体时回退 Noto Serif SC。中文 display 的独立字重通过 `lang="zh"` 标记体现。
- 所有历史 `veil-*.md` 保留为档案，当前规范以 `zhubai-design.md` 和 `zhubai-tokens.md` 为准。

![五预设亮暗封面联系表](./assets/zhubai/preset-contact-sheet.png)

## 验证入口

`pnpm run quality` 包含源码架构、配置、构建、可访问性、布局、动效、排印、预设隔离及朱白设计契约。`pnpm run quality:design` 运行朱白焦点测试。联系表与浏览器报告保存在 `.artifacts/quality/`。

独立预设示例：`fixtures/zhubai-preset.md`、`qingdai-preset.md`、`songmo-preset.md`、`ucas-preset.md`、`ict-preset.md`。使用 `build:<preset>` 和 `screenshot:<preset>` 脚本构建或导出。

## 首轮实现验收结果

2026-09-30：完整 `quality` 运行退出码 0，全部质量门通过，无失败或跳过。17 个维护示例、预设矩阵及扩展内容演示文稿构建成功。

| 检查 | 结果 |
| --- | --- |
| 五预设隔离 | 61 / 61；包含 50 组亮暗全局 / 局部切换像素一致性 |
| 可访问性 | 392 / 392 |
| 内容契约 | 18 / 18 |
| 朱白与印章设计契约 | 40 / 40；包含章节印章边界、盖章动效、打印及 reduced-motion |
| 其余质量门 | 配置、源码架构、资源、布局稳定性、封面构图与对齐、元素、原生布局、表面样式、排印与画布回归均通过 |

另外逐页审阅青黛、松墨 19 页 × 亮暗两种模式，共 76 个场景。修复了居中章节印章越界，并复核 UCAS 的显式印章及隐藏编号组合。标题升级后的双栏和作者信息页间距已调整，保留 30 / 40px 规定字号。

完整机器报告：`.artifacts/quality/summary.json`；逐项日志、截图与设计探针保留在同一目录。以上为首轮本地实现验收记录；后续 GitHub CI 结果以 PR 的检查记录为准。

## 审查修正（2026-09-30）

- `center` 与各 `figure` 变体的标题朱线使用自动左右外距，与标题块保持同一中轴；普通内容页保留左轴。
- 正文 mark 改为墨色文字，保留淡朱底和朱色下划；封面 / statement 标题 mark 与显式 focus 仍是朱色文字，加粗内容也遵守这一分工。
- 印章字体栈增加 Libertinus Serif 作为西文首选，中文回退 Noto Serif SC。
- 核对页首间距：普通签名标题为 0.55em，双栏为有意保留的 0.5em。center、figure、image-text 继承基础 0.55em；TOC 单独采用 0.05em 标题外距与 0.9rem Grid gap，不能仅比较 margin-bottom。保留各布局的末尾元素间距与紧凑节奏，补充注释解释覆盖关系。
- 新增 center、默认 figure、editorial figure 截图场景及 MC 西文印章，检查亮暗模式的朱线几何、mark 与加粗字颜色、标题间距及字体栈。

本轮专项 `quality:design` **46 / 46 通过**，源码架构检查与 `git diff --check` 通过。本轮没有重跑完整 quality；上方全量结果属于首轮实现验收。新截图位于 `.artifacts/quality/screenshots/zhubai-design/`（新增场景 19–21）。
