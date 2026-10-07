# 从表达目的选择布局

先决定这一页要让听众理解什么，再选择布局。通常只需要一种主张和一组支撑它的证据。

| 想展示的内容 | 建议布局 | 示例 |
| --- | --- | --- |
| 开场问题与作者 | `cover` | [技术分享](../examples/technical-talk.md) |
| 演讲路径 | `toc` | [研究报告](../examples/research-report.md) |
| 章节转折 | `section` | [五预设对照](../examples/preset-gallery.md) |
| 一个主张与几点证据 | `default` | [课程](../examples/course.md) |
| 通栏标题与两组内容 | 原生 `two-cols-header` | [技术分享中的方法页](../examples/technical-talk.md) |
| 独立的左右标题 | `two-cols` | [课程中的演算页](../examples/course.md) |
| 一个数字与成立条件 | 原生 `fact` | [五预设对照](../examples/preset-gallery.md) |
| 完整图表与图注 | `figure`、`Figure` | [图表变体](../fixtures/figure-component-variants.md) |
| 图片与解释 | `image-left / image-right` | [元素示例](../fixtures/elements-gallery.md) |
| 定理、假设与解释 | `two-cols-header` ＋ `Callout` | 下方组合示例 |
| 公式与脚注 | `default` | [研究报告中的 ECE](../examples/research-report.md) |
| 参考文献 | `references` | [研究报告](../examples/research-report.md) |
| 完整画布 | 原生 `full / image / iframe` | 作者控制满幅内容 |

## 英文与多人封面

[英文对照文稿](../examples/english-gallery.md)用相同内容比较五种预设，覆盖长标题、正文与脚注、图表、双栏公式、引用、代码和参考资料。英文正文使用 sans 字体；展示标题和引用按预设选择 serif 或 sans。需要真正的英文斜体时，在文稿顶部设置 `fonts.italic: true`，保留 Slidev 的字体加载方式。

[英文浅色对照](assets/zhubai/english-contact-sheet-light.png)与[深色对照](assets/zhubai/english-contact-sheet-dark.png)来自实际浏览器截图。

把完整作者列表放在文稿第一段 frontmatter 的 `authors` 中：

```yaml
authors:
  - name: Alexandra Morgan
    institution: Institute for Computational Systems, Example University
    email: alexandra.morgan@example.org
  - name: Daniel Kim
    institution: Institute for Computational Systems, Example University
  - name: Sofia Martínez
    institution: Centre for Reliable Machine Learning, Example Institute
    email: sofia.martinez@example.org
```

单人封面保留姓名、机构和邮箱的纵向层级。多人封面将姓名与邮箱并排排版，共享机构只列一次；不同机构通过上标编号对应到作者，同时为辅助阅读提供明确的机构关联。某位作者没有机构时，不会被自动归入其他人的机构。姓名与邮箱保持原顺序，不合并重名作者，也不省略联系方式。

四位及以上作者使用更紧凑的署名区，长标题配图封面同时调整标题字号与图文比例，让标题、署名和机构标志各有空间。无需额外配置；`<Authors />` 的普通作者卡片保留原有结构。

实际封面：[三位作者](assets/zhubai/english-cover.png)、[六位作者](assets/zhubai/english-cover-six-authors.png)、[八位作者](assets/zhubai/english-cover-eight-authors.png)。长邮箱优先在 `@` 前换行，避免把域名后缀拆成孤立一行。

## 多图对照

不需要新增一个专用布局。把两张有意义的图放入原生双栏插槽；两张图使用相同坐标、单位、比例与图注格式。图片路径与内容由作者提供。

```md
---
layout: two-cols-header
---

# 相同预算下的两种方法

::left::

<Figure src="/figures/baseline.svg" alt="基线的误差分布。" caption="基线 · 相同样本与预算。" />

::right::

<Figure src="/figures/proposed.svg" alt="改进方法的误差分布。" caption="改进方法 · 相同样本与预算。" />

::bottom::

来源、样本量与不确定性。
```

## 不等宽双栏

`columnRatio` 表示左栏比例。它只决定构图，不会自动缩小文字。

```md
---
layout: two-cols-header
columnRatio: 0.65
---

# 方法与结果

::left::

较宽的图表或代码。

::right::

简短的解释。
```

`two-cols` 也支持相同比例；其 `reverse: true` 同时交换内容的视觉顺序和栏宽，内容本身仍保持相同的可用宽度。

## 定理、条件与说明

```md
---
layout: two-cols-header
columnRatio: 0.55
---

# 偏差为何不会抵消？

::left::

<Callout type="note" title="定义 · 总体方差">

$$\sigma^2=\frac{1}{n}\sum_{i=1}^{n}(x_i-\mu)^2$$

</Callout>

::right::

平方让每项非负。求平均后，偏差的正负不再相互抵消。

如果所有观察相同，方差为零。
```

公式由 Slidev / KaTeX 渲染，脚注使用 `[^id]` Markdown。`references` 是作者维护的文献排版，不解析 BibTeX，不自动生成引用。

## 三份可复制模板

- [技术分享](../examples/technical-talk.md)：观测 → 方法 → 代价 → 验证 → 结论。
- [研究报告](../examples/research-report.md)：问题 → 定义 → 实验 → 边界 → 文献。
- [课程讲义](../examples/course.md)：目标 → 反例 → 定义 → 演算 → 练习 → 回顾。

三份模板只依赖主题与 Slidev，使用内联内容，不需要额外图片包。将文件复制为 `slides.md`，安装 `@slidev/cli` 与对应版本的 `slidev-theme-zhibai`，然后运行 `npx slidev slides.md`。模板对应仓库当前配置；在 npm 发布更新前，可以把 `theme` 改为本地主题目录的绝对路径。模板中的实验数据明确标记为示例，开始使用时需要替换。

## 交互预览与逐页源码

在仓库中执行 `pnpm run build:preview`，然后用静态服务器打开 `dist-preview`。例如 `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist-preview`，访问 `http://127.0.0.1:4173`。

预览提供五预设中文与英文同内容对照、多人封面、深浅模式、三份完整模板，以及当前页的 Markdown 和完整文稿下载。预览 URL 保存预设、页面和模式，可以直接分享某个构图。构建使用相对资源路径与 hash 路由，可放在任意静态网站子目录。

`.github/workflows/preview.yml` 是手动触发的 GitHub Pages 工作流。仓库的 Pages source 需选择 GitHub Actions，工作流成功部署后再将真实地址加入 README；尚未发布时不提供假预览链接。
