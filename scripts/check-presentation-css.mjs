#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const errors = []
const presetNames = ['zhubai', 'qingdai', 'songmo', 'ucas', 'ict']

const filesWithin = (directory, pattern = /./) => {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...filesWithin(path, pattern))
    else if (entry.isFile() && pattern.test(entry.name)) files.push(path)
  }
  return files
}

const sourceAt = path => readFileSync(resolve(repositoryRoot, path), 'utf8')

const aggregate = sourceAt('styles/presets.css')
const expectedPresetImports = ['base', ...presetNames].map(
  name => `@import "./presets/${name}.css";`,
)
const aggregateLines = aggregate
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
if (
  aggregateLines.length !== expectedPresetImports.length
  || aggregateLines.some((line, index) => line !== expectedPresetImports[index])
) {
  errors.push(
    `styles/presets.css must import only ${expectedPresetImports.join(', ')} in order`,
  )
}

const styleIndex = sourceAt('styles/index.ts')
const expectedStyleImports = [
  './cjk-fonts.css',
  '@slidev/client/styles/layouts-base.css',
  './tokens.css',
  './base.css',
  './layouts.css',
  './semantic.css',
  './components.css',
  './content-layouts.css',
  './presets/shared.css',
  './presets.css',
]
const actualStyleImports = [...styleIndex.matchAll(
  /import\s+['"]([^'"]+\.css)['"]/g,
)].map(match => match[1])
if (
  actualStyleImports.length !== expectedStyleImports.length
  || actualStyleImports.some((value, index) => value !== expectedStyleImports[index])
) {
  errors.push('styles/index.ts must load each global theme stylesheet once in canonical order')
}

const requiredPresetTokens = [
  '--slidev-theme-primary',
  '--presentation-accent',
  '--presentation-bg',
  '--presentation-text',
  '--presentation-text-muted',
  '--presentation-border',
  '--presentation-font-sans',
  '--presentation-font-serif',
  '--presentation-slide-padding',
  '--presentation-body-size',
  '--presentation-callout-radius',
  '--presentation-media-radius',
]

const sharedTokenSource = sourceAt('styles/presets/base.css') + sourceAt('styles/tokens.css')
for (const token of requiredPresetTokens) {
  if (!sharedTokenSource.includes(`${token}:`)) errors.push(`shared token base is missing ${token}`)
}

for (const preset of presetNames) {
  const path = `styles/presets/${preset}.css`
  const source = sourceAt(path)
  const anchor = `.slidev-layout[data-presentation-preset="${preset}"]`
  if (!source.includes(anchor)) errors.push(`${path} is missing ${anchor}`)
  for (const token of ['--zhubai-paper', '--zhubai-ink', '--zhubai-accent']) {
    if (!source.includes(`${token}:`)) errors.push(`${path} is missing pigment ${token}`)
  }
  if (source.includes('!important')) errors.push(`${path} contains !important`)
  if (/^\s*(?::root|body)\b[^{]*data-presentation-preset/m.test(source)) {
    errors.push(`${path} contains root-authoritative preset state`)
  }
  if (/\.presentation-callout__title::before/.test(source)) {
    errors.push(`${path} overrides protected callout marker geometry`)
  }
  if (/\.presentation-callout__title[^{}]*\{[^{}]*text-transform\s*:/s.test(source)) {
    errors.push(`${path} transforms authored callout titles`)
  }
  for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const target = match[1]
    if (/^(?:data:|https?:|#)/.test(target)) continue
    if (!existsSync(resolve(dirname(resolve(repositoryRoot, path)), target))) {
      errors.push(`${path} references missing local asset ${target}`)
    }
  }
}

const packageJson = JSON.parse(sourceAt('package.json'))
const expectedWebfonts = ['Inter', 'Libertinus Serif', 'JetBrains Mono']
const expectedLocalFonts = ['Noto Sans SC', 'Noto Serif SC']
const fonts = packageJson.slidev?.defaults?.fonts ?? {}
if (
  fonts.sans !== 'Inter, Noto Sans SC'
  || fonts.serif !== 'Libertinus Serif, Noto Serif SC'
  || fonts.mono !== 'JetBrains Mono'
  || JSON.stringify(fonts.webfonts) !== JSON.stringify(expectedWebfonts)
  || JSON.stringify(fonts.local) !== JSON.stringify(expectedLocalFonts)
  || fonts.weights !== '400,600,700'
  || fonts.italic !== true
) {
  errors.push('package.json must declare the verified Latin and local CJK font roles')
}
const cjkFontStylesheet = sourceAt('styles/cjk-fonts.css')
if (!cjkFontStylesheet.includes(
  'https://fonts.googleapis.com/css2?family=Inter:wght@500&family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap',
)) {
  errors.push('styles/cjk-fonts.css must load Inter 500 and supported upright CJK weights separately')
}
if ('obsidianSlidev' in packageJson) {
  errors.push('package.json must not publish a producer-specific compatibility manifest')
}
const runtimeDependencies = Object.keys(packageJson.dependencies ?? {}).sort()
if (runtimeDependencies.join(',') !== '@slidev/client') {
  errors.push('package.json runtime dependencies must contain only @slidev/client')
}
if (packageJson.files?.some(path => path.startsWith('public'))) {
  errors.push('package.json must not ship demonstration images')
}
if (existsSync(resolve(repositoryRoot, '.npmignore'))) {
  errors.push('package.json.files is authoritative; redundant .npmignore must be absent')
}

const packagedSourcePaths = [
  ...['components', 'internals', 'layouts', 'setup', 'styles'].flatMap(
    directory => filesWithin(
      resolve(repositoryRoot, directory),
      /\.(?:css|mjs|ts|vue)$/,
    ),
  ),
]
const fixtureOnlyPattern = /data-quality|\.presentation-[\w-]*(?:gallery|probe)\b/
const converterDependencyPattern = /markdown-it|remark|rehype|unified|obsidian(?:-|_)parser/i
for (const absolutePath of packagedSourcePaths) {
  const path = relative(repositoryRoot, absolutePath)
  const source = readFileSync(absolutePath, 'utf8')
  if (/obsidian-slidev|obsidianSlidev|normalizeGenerated|installImageViewer/.test(source)) {
    errors.push(`${path} contains integration or addon behavior outside the theme boundary`)
  }
  if (fixtureOnlyPattern.test(source)) {
    errors.push(`${path} contains fixture-only data-quality, gallery, or probe behavior`)
  }
  if (path.startsWith('setup/') && converterDependencyPattern.test(source)) {
    errors.push(`${path} crosses the converter boundary`)
  }
  if (path.endsWith('.vue') && /<style\s+src=/.test(source)) {
    errors.push(`${path} injects a global stylesheet instead of using styles/index.ts`)
  }
}

const semanticCss = sourceAt('styles/semantic.css')
if (/\.presentation-callout--[\w-]+/.test(semanticCss)) {
  errors.push('styles/semantic.css duplicates the TypeScript callout type-to-family registry')
}
for (const family of ['info', 'positive', 'caution', 'danger', 'question', 'quotation']) {
  if (!semanticCss.includes(`[data-callout-family="${family}"]`)) {
    errors.push(`styles/semantic.css is missing ${family} family state`)
  }
}

const taskLists = sourceAt('setup/task-lists.ts')
if (/\.slidev-layout\s+li\s*>\s*input\[type=["']checkbox["']\]/.test(taskLists)) {
  errors.push('setup/task-lists.ts captures ordinary list checkboxes')
}
const frame = sourceAt('components/SlideFrame.vue')
const presentationConfig = sourceAt('setup/presentation-config.ts')
if (/data-presentation-brand-safe-zone/.test(frame) || /\bbrandSafeZone\b/.test(presentationConfig)) {
  errors.push('brand safe-zone DOM state is obsolete; section geometry is CSS-owned')
}

const maximumShippedAssetBytes = 250 * 1024
for (const directory of ['assets/ICT', 'assets/UCAS']) {
  for (const path of filesWithin(resolve(repositoryRoot, directory))) {
    const bytes = statSync(path).size
    if (bytes > maximumShippedAssetBytes) {
      errors.push(
        `${relative(repositoryRoot, path)} is ${bytes} bytes; maximum is ${maximumShippedAssetBytes}`,
      )
    }
  }
}

if (errors.length > 0) {
  console.error(
    `Presentation source architecture check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`,
  )
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log('Presentation source architecture check passed.')
}
