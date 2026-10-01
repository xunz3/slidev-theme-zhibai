# 测试与工作区维护

使用 `.nvmrc` 指定的 Node.js 与 `package.json` 指定的 pnpm。安装依赖后，完整验证入口与 CI 相同：

```sh
pnpm run check
pnpm run test:release
pnpm run quality
pnpm run package:check
```

`quality` 先构建维护文稿、五预设矩阵与扩展内容，再运行以下门禁。任何失败、超时或必需门禁跳过都会返回非零退出码。当前结果以 `.artifacts/quality/summary.json` 和本次日志为准。

| 门禁 | 覆盖范围 |
| --- | --- |
| `configuration`、`css-architecture` | 公共配置、继承优先级、兼容字段、源码与 CSS 边界 |
| `preset-isolation` | 五预设 × 全局／局部切换 × 亮暗模式，样式与像素隔离 |
| `content-contracts`、`elements` | 组件语义、布局变体、代码、引用、列宽与键盘交互 |
| `accessibility` | 对比度、可访问名称、媒体回退、焦点与内容几何 |
| `assets` | 资源大小、机构签名、图像占位与 npm 资源范围 |
| `layout-stability` | 长标题、作者与图片边界，延迟加载时的几何稳定性 |
| `motion` | 实时演示、减少动态效果、预览和打印的动效行为 |
| `cover-composition`、`cover-alignment`、`cover-authors` | 文本／图片／slot 封面、两种对齐、0–8 位作者、机构与邮箱 |
| `native-layouts` | 原生 Slidev 布局的预设、配色与 slots |
| `preview` | 五预设、中文／英文页面与完整模板，亮暗模式、两种尺寸、逐页源码与预览导航 |
| `media-treatments` | 真实代码语言标签、plain／framed／bleed、显式图片 fit 与图注编号 |
| `typography` | 浏览器实际使用的中西文字体、字重与标题尺寸 |
| `zhubai-design` | 朱色、纸面、印章、签名线、强调、图表 token 别名与动效 |

旧三预设画廊的纸面、溢出和资源加载检查由五预设的设计、隔离、可访问性与预览门禁覆盖；不再单独维护一份重复画廊。

## 专项检查

修改局部行为时可以先运行对应文件，或使用现有快捷命令：

```sh
pnpm run quality:design
pnpm run quality:authors
pnpm run quality:preview
node --test tests/quality/media-treatments.spec.mjs
pnpm run quality -- --self-check
```

`--self-check` 只验证门禁记录与退出码处理，不代表主题通过完整质量检查。完整门禁在 CI 与发布前运行，专项结果不能代替全量结果。

## 文件职责

- `examples/` 是可直接使用的完整演示文稿；`example.md` 是默认演示入口。
- `fixtures/` 只保留测试或作者文档实际引用的文稿与测试媒体；它们不进入 npm 包。
- `docs/` 保留当前设计、配置、写作、预设、主题边界、测试与发布说明；旧提案和历次验收记录可从 Git 历史查看。
- `docs/assets/zhubai/` 是当前文档引用的概念图与实际截图。
- `.artifacts/`、`dist/`、`dist-*/`、`fixtures/dist-*/` 是可重新生成的本地输出，已由 Git 忽略。检查结束后可清理构建输出；需要复核时保留本次 `summary.json`、日志、截图和诊断报告。

依赖目录与本地编辑器、agent 配置分别用于开发和个人环境，不属于文档与测试清理范围。
