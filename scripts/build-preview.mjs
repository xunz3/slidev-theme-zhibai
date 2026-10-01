import { execFile } from 'node:child_process'
import { mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { parser } from '@slidev/cli'

const run = promisify(execFile)
const root = fileURLToPath(new URL('..', import.meta.url))
const output = resolve(root, 'dist-preview')
const generated = resolve(root, '.artifacts/quality/generated/preview')
const logs = resolve(root, '.artifacts/quality/logs')
const definitions = [
  { id: 'gallery', file: 'preset-gallery.md', title: '五预设对照', description: '同样的封面、章节、正文、图表、引用与数字，逐页比较五种视觉身份。' },
  { id: 'english', file: 'english-gallery.md', title: '英文与多人署名', description: '英文长标题、正文、图表、公式、代码与参考资料，比较五种预设的多人研究报告。', comparePresets: true },
  { id: 'technical', file: 'technical-talk.md', title: '技术分享', description: '从关键路径的观测，到改造、验证与回滚条件。' },
  { id: 'research', file: 'research-report.md', title: '研究报告', description: '问题、公式、受控实验、脚注与参考文献。' },
  { id: 'course', file: 'course.md', title: '课程讲义', description: '学习目标、反例、定义、演算与练习。' },
]

await rm(output, { recursive: true, force: true })
await mkdir(resolve(output, 'sources'), { recursive: true })
await mkdir(generated, { recursive: true })
await mkdir(logs, { recursive: true })

const decks = []
for (const definition of definitions) {
  const path = resolve(root, 'examples', definition.file)
  const original = await readFile(path, 'utf8')
  const portable = original.replace(/^theme: .+$/m, 'theme: zhubai')
  const source = resolve(generated, definition.file)
  await writeFile(source, original.replace(/^theme: .+$/m, `theme: ${JSON.stringify(root)}`))
  await writeFile(resolve(output, 'sources', definition.file), portable)
  const parsed = parser.parseSync(portable, path)
  const preset = parsed.slides[0].frontmatter.themeConfig?.presentation?.preset ?? 'zhubai'
  decks.push({
    ...definition,
    pages: parsed.slides.map((slide, index) => ({
      no: index + 1,
      title: slide.title ?? `第 ${index + 1} 页`,
      layout: slide.frontmatter.layout ?? (index === 0 ? 'cover' : 'default'),
      preset: slide.frontmatter.presentation?.preset ?? slide.frontmatter.presentationPreset ?? preset,
      source: slide.raw.trim(),
    })),
  })
  const args = [resolve(root, 'node_modules/@slidev/cli/bin/slidev.mjs'), 'build', source,
    '--out', resolve(output, 'decks', definition.id), '--base', './', '--router-mode', 'hash']
  try {
    const { stdout, stderr } = await run(process.execPath, args, { cwd: root, timeout: 180_000, maxBuffer: 8 * 1024 * 1024 })
    await writeFile(resolve(logs, `preview-${definition.id}.log`), `${stdout}\n${stderr}`)
  } catch (error) {
    await writeFile(resolve(logs, `preview-${definition.id}.log`), `${error.stdout ?? ''}\n${error.stderr ?? ''}`)
    throw error
  }
  console.log(`Preview built: ${definition.title} (${parsed.slides.length} slides)`)
}
await copyFile(resolve(root, 'preview/index.html'), resolve(output, 'index.html'))
await writeFile(resolve(output, 'manifest.json'), `${JSON.stringify({ decks }, null, 2)}\n`)
await writeFile(resolve(output, '.nojekyll'), '')
console.log(`Preview ready: ${output}`)
