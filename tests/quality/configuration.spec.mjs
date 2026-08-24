import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))

const loadTypeScript = async () => {
  try {
    return (await import('typescript')).default
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error

    const pnpmDirectory = new URL('../../node_modules/.pnpm/', import.meta.url)
    const packageDirectory = (await readdir(pnpmDirectory))
      .filter(name => /^typescript@[^_]+$/.test(name))
      .sort()
      .at(-1)
    if (!packageDirectory) throw error

    const compilerUrl = new URL(
      `${packageDirectory}/node_modules/typescript/lib/typescript.js`,
      pnpmDirectory,
    )
    return (await import(compilerUrl.href)).default
  }
}

const ts = await loadTypeScript()

const loadTypeScriptModule = async (path) => {
  const moduleUrl = new URL(`../../${path}`, import.meta.url)
  const source = await readFile(moduleUrl, 'utf8')
  const transpiled = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })

  const encoded = Buffer.from(
    `${transpiled.outputText}\n//# sourceURL=${pathToFileURL(fileURLToPath(moduleUrl)).href}`,
  ).toString('base64')
  return import(`data:text/javascript;base64,${encoded}`)
}

const config = await loadTypeScriptModule('setup/presentation-config.ts')
const callouts = await loadTypeScriptModule('setup/callouts.ts')

test('option definitions are the immutable canonical public contract', () => {
  assert.deepEqual(config.PRESENTATION_PRESETS, ['default', 'ucas', 'ict'])
  assert.deepEqual(config.PRESENTATION_DENSITIES, ['compact', 'normal', 'relaxed'])
  assert.deepEqual(config.PRESENTATION_CHROME_VALUES, ['auto', 'on', 'off'])
  assert.deepEqual(config.FRAME_VARIANTS, [
    'default',
    'cover',
    'intro',
    'section',
    'toc',
    'center',
    'two-cols',
    'statement',
    'quote',
    'figure',
    'references',
    'closing',
    'image-text',
    'code',
  ])

  assert.deepEqual(Object.keys(config.PRESENTATION_OPTIONS), [
    'preset',
    'density',
    'chrome',
    'header',
    'footerAuthors',
    'pageNumber',
    'accent',
  ])
  assert.deepEqual(config.PRESENTATION_DEFAULTS, {
    preset: 'default',
    density: 'normal',
    chrome: 'auto',
    header: false,
    footerAuthors: true,
    pageNumber: true,
    accent: null,
  })

  assert.equal(config.PRESENTATION_OPTIONS.preset.deckKey, 'preset')
  assert.deepEqual(config.PRESENTATION_OPTIONS.preset.slideKeys, ['presentationPreset'])
  assert.deepEqual(config.PRESENTATION_OPTIONS.chrome.slideKeys, ['presentationChrome', 'chrome'])
  assert.deepEqual(config.PRESENTATION_OPTIONS.header.slideKeys, ['presentationHeader', 'header'])
  assert.deepEqual(config.PRESENTATION_OPTIONS.pageNumber.slideKeys, ['pageNumber'])
  assert.deepEqual(config.PRESENTATION_OPTIONS.accent.slideKeys, ['accent'])
  assert.equal('scope' in config.PRESENTATION_OPTIONS.accent, false)

  assert.ok(Object.isFrozen(config.PRESENTATION_PRESETS))
  assert.ok(Object.isFrozen(config.PRESENTATION_DENSITIES))
  assert.ok(Object.isFrozen(config.PRESENTATION_CHROME_VALUES))
  assert.ok(Object.isFrozen(config.FRAME_VARIANTS))
  assert.ok(Object.isFrozen(config.PRESENTATION_OPTIONS))
  assert.ok(Object.isFrozen(config.PRESENTATION_DEFAULTS))
  for (const definition of Object.values(config.PRESENTATION_OPTIONS)) {
    assert.ok(Object.isFrozen(definition))
    assert.ok(Object.isFrozen(definition.slideKeys))
  }
})

test('the option registry drives resolution instead of duplicating field logic', async () => {
  const source = await readFile(
    resolve(repositoryRoot, 'setup/presentation-config.ts'),
    'utf8',
  )
  assert.match(source, /PRESENTATION_OPTION_KEYS/)
  assert.match(source, /resolveDeckOption/)
  assert.match(source, /resolveSlideOption/)
  assert.doesNotMatch(source, /normalizePreset\(raw\.preset\)/)
  assert.doesNotMatch(source, /normalizeDensity\(raw\.density\)/)
  assert.doesNotMatch(source, /normalizeBoolean\(raw\.(?:header|footerAuthors|pageNumber)\)/)
})

test('generated callout CSS consumes canonical family state without a type map', async () => {
  const source = await readFile(
    resolve(repositoryRoot, 'styles/obsidian.css'),
    'utf8',
  )
  for (const family of callouts.SEMANTIC_FAMILIES.filter(
    value => value !== 'neutral',
  )) {
    const declaration = (
      `--presentation-callout-family: var(--presentation-family-${family});`
    )
    assert.match(
      source,
      new RegExp(
        `\\[data-callout-family=["']${family}["']\\][^{}]*\\{[^{}]*`
        + declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        's',
      ),
      `${family}: canonical family state`,
    )
  }
  assert.doesNotMatch(source, /\.obsidian-slidev-callout--[\w-]+/)
  assert.equal(typeof callouts.normalizeGeneratedCallouts, 'function')
})

test('normalizers accept only documented enum and boolean values', () => {
  assert.equal(config.normalizePreset(' ucas '), 'ucas')
  assert.equal(config.normalizePreset('UCAS'), undefined)
  assert.equal(config.normalizePreset('unknown'), undefined)
  assert.equal(config.normalizeDensity(' relaxed '), 'relaxed')
  assert.equal(config.normalizeDensity('dense'), undefined)

  for (const [input, expected] of [
    [true, true],
    [false, false],
    [' true ', true],
    ['on', true],
    [' false ', false],
    ['off', false],
  ]) {
    assert.equal(config.normalizeBoolean(input), expected)
  }
  for (const input of [1, 0, 'yes', 'no', 'TRUE', '', {}, []]) {
    assert.equal(config.normalizeBoolean(input), undefined)
  }

  for (const [input, expected] of [
    ['auto', 'auto'],
    [' on ', 'on'],
    ['off', 'off'],
    [true, 'on'],
    [false, 'off'],
    ['true', 'on'],
    ['false', 'off'],
  ]) {
    assert.equal(config.normalizeChrome(input), expected)
  }
  assert.equal(config.normalizeChrome('always'), undefined)
})

test('missing and invalid deck configuration resolve field-by-field to defaults', () => {
  assert.deepEqual(config.resolveDeckPresentation(), config.PRESENTATION_DEFAULTS)
  assert.deepEqual(config.resolveDeckPresentation(null), config.PRESENTATION_DEFAULTS)
  assert.deepEqual(config.resolveDeckPresentation([]), config.PRESENTATION_DEFAULTS)
  assert.deepEqual(config.resolveDeckPresentation({
    preset: 'invalid',
    density: 1,
    chrome: 'always',
    header: 'yes',
    footerAuthors: 0,
    pageNumber: {},
    accent: 'not-a-color',
  }, {
    supportsColor: () => false,
  }), config.PRESENTATION_DEFAULTS)
})

test('deck normalization accepts every supported value and textual boolean', () => {
  assert.deepEqual(config.resolveDeckPresentation({
    preset: 'ict',
    density: 'compact',
    chrome: 'true',
    header: 'on',
    footerAuthors: 'false',
    pageNumber: 'off',
    accent: '  #345f8f  ',
  }, {
    supportsColor: value => value === '#345f8f',
  }), {
    preset: 'ict',
    density: 'compact',
    chrome: 'on',
    header: true,
    footerAuthors: false,
    pageNumber: false,
    accent: '#345f8f',
  })
})

test('slide resolution uses first-valid prop, slide, deck, and default precedence', () => {
  const deck = {
    preset: 'ucas',
    density: 'relaxed',
    chrome: 'off',
    header: true,
    footerAuthors: false,
    pageNumber: false,
    accent: '#123456',
  }

  assert.deepEqual(config.resolvePresentation({
    deck,
    slide: {
      presentationPreset: 'ict',
      presentationDensity: 'compact',
      presentationChrome: 'on',
      presentationHeader: 'off',
      footerAuthors: 'true',
      pageNumber: 'on',
    },
    variant: 'default',
    supportsColor: value => value === '#123456',
  }), {
    preset: 'ict',
    density: 'compact',
    chrome: 'on',
    header: false,
    footerAuthors: true,
    pageNumber: true,
    accent: '#123456',
    variant: 'default',
    showChrome: true,
    showHeader: false,
  })

  assert.equal(config.resolvePresentation({
    deck,
    slide: {
      presentationChrome: 'off',
      chrome: 'on',
    },
    chrome: 'auto',
    variant: 'default',
  }).chrome, 'auto')
})

test('invalid higher-priority input inherits the next valid candidate', () => {
  const resolved = config.resolvePresentation({
    deck: {
      preset: 'ucas',
      density: 'relaxed',
      chrome: 'on',
      header: true,
      footerAuthors: false,
      pageNumber: false,
    },
    slide: {
      presentationPreset: 'unsupported',
      presentationDensity: 'dense',
      presentationChrome: 'sometimes',
      chrome: 'off',
      presentationHeader: 'maybe',
      header: 'false',
      footerAuthors: 'no',
      pageNumber: 'yes',
    },
    chrome: 'invalid',
    variant: 'intro',
  })

  assert.deepEqual(resolved, {
    preset: 'ucas',
    density: 'relaxed',
    chrome: 'off',
    header: false,
    footerAuthors: false,
    pageNumber: false,
    accent: null,
    variant: 'intro',
    showChrome: false,
    showHeader: false,
  })
})

test('accent validation and local → deck → preset fallback are first-valid', () => {
  const supported = new Set([
    'rebeccapurple',
    'oklch(60% 0.2 20)',
    'color-mix(in srgb, currentColor 70%, #5b4fc4)',
  ])
  const supportsColor = value => supported.has(value)

  assert.equal(config.normalizeAccent(' rebeccapurple ', supportsColor), 'rebeccapurple')
  assert.equal(config.normalizeAccent('not-a-color', supportsColor), undefined)
  assert.equal(config.normalizeAccent('', supportsColor), undefined)
  assert.equal(config.normalizeAccent(42, supportsColor), undefined)

  for (const value of [
    'blue',
    '#345f8f',
    'rgb(20 40 60)',
    'hsl(210 50% 40%)',
    'oklch(60% 0.2 20)',
    'color(display-p3 0.2 0.4 0.8)',
    'color-mix(in srgb, currentColor 70%, #5b4fc4)',
    'var(--authored-accent)',
  ]) {
    assert.equal(config.normalizeAccent(value), value, value)
  }

  for (const value of ['#ab', '#abcde', '#abcdefg', '#abcdefghi']) {
    assert.equal(config.normalizeAccent(value), undefined, value)
  }

  assert.equal(config.resolvePresentation({
    deck: { accent: 'oklch(60% 0.2 20)' },
    slide: { accent: 'rebeccapurple' },
    variant: 'default',
    supportsColor,
  }).accent, 'rebeccapurple')

  for (const accent of [undefined, '', 'not-a-color', 42]) {
    assert.equal(config.resolvePresentation({
      deck: { accent: 'oklch(60% 0.2 20)' },
      slide: { accent },
      variant: 'default',
      supportsColor,
    }).accent, 'oklch(60% 0.2 20)')
  }

  assert.equal(config.resolvePresentation({
    deck: { accent: 'not-a-color' },
    slide: { accent: '' },
    variant: 'default',
    supportsColor,
  }).accent, null)

  assert.equal(config.resolvePresentation({
    deck: { accent: 'rebeccapurple' },
    slide: {
      accent: 'rebeccapurple',
      presentationAccent: 'oklch(60% 0.2 20)',
    },
    variant: 'default',
    supportsColor,
  }).accent, 'rebeccapurple')
})

test('app setup remains deck-only while the shared frame owns local accent scope', async () => {
  const [setupSource, frameSource] = await Promise.all([
    readFile(resolve(repositoryRoot, 'setup/main.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/SlideFrame.vue'), 'utf8'),
  ])

  assert.match(setupSource, /resolveDeckPresentation/)
  assert.doesNotMatch(
    setupSource,
    /\$frontmatter|useSlideContext|currentPage|nav\.|afterEach|onAfterRoute/,
  )
  assert.match(frameSource, /slide:\s*frontmatter\.value/)
  assert.match(frameSource, /--presentation-accent/)
  assert.match(frameSource, /--slidev-theme-primary/)
})

test('derived chrome and header behavior covers every frame variant', () => {
  for (const variant of config.FRAME_VARIANTS) {
    const auto = config.resolvePresentation({
      deck: { preset: 'ucas', chrome: 'auto', header: true },
      variant,
    })
    const expectedChrome = !['cover', 'section', 'closing'].includes(variant)
    assert.equal(auto.showChrome, expectedChrome, variant)
    assert.equal(auto.showHeader, expectedChrome, variant)
    assert.equal('brandSafeZone' in auto, false, variant)

    const forcedOn = config.resolvePresentation({
      deck: { preset: 'ucas', chrome: 'on', header: true },
      variant,
    })
    assert.equal(forcedOn.showChrome, true, variant)
    assert.equal(forcedOn.showHeader, true, variant)
    assert.equal('brandSafeZone' in forcedOn, false, variant)

    const forcedOff = config.resolvePresentation({
      deck: { preset: 'ucas', chrome: 'off', header: true },
      variant,
    })
    assert.equal(forcedOff.showChrome, false, variant)
    assert.equal(forcedOff.showHeader, false, variant)
    assert.equal('brandSafeZone' in forcedOff, false, variant)
  }

  assert.equal(config.normalizeFrameVariant('closing'), 'closing')
  assert.equal(config.normalizeFrameVariant('image-text'), 'image-text')
  assert.equal(config.normalizeFrameVariant('code'), 'code')
  assert.equal(config.normalizeFrameVariant('unsupported'), undefined)
})

const sourceFiles = async (directory) => {
  const entries = await readdir(resolve(repositoryRoot, directory), {
    recursive: true,
    withFileTypes: true,
  })
  return entries
    .filter(entry => entry.isFile() && /\.(?:ts|vue)$/.test(entry.name))
    .map(entry => resolve(entry.parentPath, entry.name))
    .sort()
}

test('presentation types, defaults, and normalizers have one source authority', async () => {
  const canonicalPath = resolve(repositoryRoot, 'setup/presentation-config.ts')
  const files = [
    ...await sourceFiles('components'),
    ...await sourceFiles('internals'),
    ...await sourceFiles('layouts'),
    ...await sourceFiles('setup'),
  ]
  const duplicatePatterns = [
    {
      label: 'preset literal union',
      expression: /['"]default['"]\s*\|\s*['"]ucas['"]\s*\|\s*['"]ict['"]/,
    },
    {
      label: 'density literal union',
      expression: /['"]compact['"]\s*\|\s*['"]normal['"]\s*\|\s*['"]relaxed['"]/,
    },
    {
      label: 'chrome literal union',
      expression: /['"]auto['"]\s*\|\s*['"]on['"]\s*\|\s*['"]off['"]/,
    },
    {
      label: 'presentation defaults declaration',
      expression: /\b(?:const|let|var)\s+PRESENTATION_DEFAULTS\b/,
    },
    {
      label: 'presentation option declaration',
      expression: /\b(?:const|let|var)\s+PRESENTATION_OPTIONS\b/,
    },
    {
      label: 'normalizer declaration',
      expression: /\b(?:const|function)\s+normalize(?:Preset|Density|Chrome|Boolean|Accent)\b/,
    },
  ]

  for (const file of files) {
    if (file === canonicalPath) continue
    const source = await readFile(file, 'utf8')
    for (const pattern of duplicatePatterns) {
      assert.doesNotMatch(
        source,
        pattern.expression,
        `${relative(repositoryRoot, file)} duplicates ${pattern.label}`,
      )
    }
  }

  const canonical = await readFile(canonicalPath, 'utf8')
  for (const name of [
    'PRESENTATION_PRESETS',
    'PRESENTATION_DENSITIES',
    'PRESENTATION_CHROME_VALUES',
    'PRESENTATION_OPTIONS',
    'PRESENTATION_DEFAULTS',
    'normalizePreset',
    'normalizeDensity',
    'normalizeChrome',
    'normalizeBoolean',
    'normalizeAccent',
    'resolvePresentation',
  ]) {
    assert.match(canonical, new RegExp(`\\b${name}\\b`), name)
  }
})

test('only the shared frame resolves presentation state and owns preset attributes', async () => {
  const layoutFiles = await sourceFiles('layouts')
  const delegatedLayouts = new Map([
    ['layouts/end.vue', 'ClosingLayout'],
    ['layouts/image-left.vue', 'ImageTextLayout'],
    ['layouts/image-right.vue', 'ImageTextLayout'],
  ])
  for (const file of layoutFiles) {
    const source = await readFile(file, 'utf8')
    const name = relative(repositoryRoot, file)
    const delegate = delegatedLayouts.get(name)
    if (delegate) {
      assert.match(
        source,
        new RegExp(`import\\s+${delegate}\\s+from`),
        `${name}: shared internal import`,
      )
      assert.match(source, new RegExp(`<${delegate}\\b`), `${name}: internal usage`)
    } else {
      assert.match(source, /import\s+SlideFrame\s+from/, `${name}: shared frame import`)
      assert.match(source, /<SlideFrame\b/, `${name}: shared frame usage`)
    }
    assert.doesNotMatch(source, /\bresolvePresentation\s*\(/, `${name}: local resolver`)
    assert.doesNotMatch(source, /themeConfig\??\.presentation/, `${name}: deck resolution`)
    assert.doesNotMatch(source, /data-presentation-(?:preset|density)/, `${name}: state ownership`)
  }

  for (const [path, expectedVariant] of [
    ['internals/ClosingLayout.vue', 'closing'],
    ['internals/ImageTextLayout.vue', 'image-text'],
  ]) {
    const source = await readFile(resolve(repositoryRoot, path), 'utf8')
    assert.match(source, /import\s+SlideFrame\s+from/, `${path}: frame import`)
    assert.match(source, /<SlideFrame\b/, `${path}: frame usage`)
    assert.match(source, new RegExp(`variant=["']${expectedVariant}["']`))
  }

  const componentFiles = await sourceFiles('components')
  const resolverOwners = []
  const attributeOwners = []
  for (const file of componentFiles) {
    const source = await readFile(file, 'utf8')
    if (/\bresolvePresentation\s*\(/.test(source)) resolverOwners.push(relative(repositoryRoot, file))
    if (/data-presentation-(?:preset|density)/.test(source)) {
      attributeOwners.push(relative(repositoryRoot, file))
    }
  }
  assert.deepEqual(resolverOwners, ['components/SlideFrame.vue'])
  assert.deepEqual(attributeOwners, ['components/SlideFrame.vue'])
})

test('package metadata has no duplicate presentation defaults', async () => {
  const packageJson = JSON.parse(
    await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'),
  )
  assert.equal(packageJson.slidev?.themeConfig, undefined)
  assert.equal(packageJson.slidev?.defaults?.themeConfig, undefined)
  assert.equal(packageJson.themeConfig, undefined)
  assert.deepEqual(
    Object.keys(packageJson.dependencies).sort(),
    ['@slidev/client'],
  )
  assert.equal(packageJson.devDependencies['@slidev/types'], '^52.15.2')
  assert.equal(packageJson.devDependencies['slidev-pane'], '0.1.9')
  assert.ok(packageJson.files.includes('public/obsidian-card.svg'))
})

test('README mirrors the canonical deck and slide configuration contract', async () => {
  const readme = await readFile(resolve(repositoryRoot, 'README.md'), 'utf8')
  const perSlideSection = readme.match(
    /Per-slide overrides:[\s\S]*?(?=\n## |\n`themeConfig`)/,
  )?.[0] ?? ''

  for (const [key, values, defaultValue] of [
    ['preset', '`default`, `ucas`, `ict`', '`default`'],
    ['accent', 'Any CSS color', 'theme default'],
    ['density', '`compact`, `normal`, `relaxed`', '`normal`'],
    ['chrome', '`auto`, `on`, `off`', '`auto`'],
    ['header', '`true`, `false`', '`false`'],
    ['footerAuthors', '`true`, `false`', '`true`'],
    ['pageNumber', '`true`, `false`', '`true`'],
  ]) {
    const row = `| \`${key}\` | ${values} | ${defaultValue} |`
    assert.ok(readme.includes(row), `README deck row drift: ${key}`)
  }

  for (const key of [
    'presentationPreset',
    'presentationDensity',
    'presentationChrome',
    'chrome',
    'presentationHeader',
    'header',
    'footerAuthors',
    'pageNumber',
    'footer',
  ]) {
    assert.match(
      perSlideSection,
      new RegExp(`\\| \\\`${key}\\\` \\|`),
      `README per-slide row drift: ${key}`,
    )
  }

  for (const phrase of [
    'first valid',
    'textual booleans',
    '`true`',
    '`false`',
    '`on`',
    '`off`',
    'pre-1.0 migration',
    'pnpm run assets:optimize',
    'pnpm run assets:check',
    'pnpm run quality',
    'pnpm run quality:update-visual-baselines',
  ]) {
    assert.ok(
      readme.toLowerCase().includes(phrase.toLowerCase()),
      `README is missing contract phrase: ${phrase}`,
    )
  }
})

test('US6 packaged sources are isolated, bounded, and converter-independent', async () => {
  const packageJson = JSON.parse(
    await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'),
  )
  assert.ok(!packageJson.files.includes('fixtures'))
  assert.ok(!packageJson.files.includes('tests'))

  const packagedSources = []
  for (const directory of ['components', 'internals', 'layouts', 'setup', 'styles']) {
    const entries = await readdir(resolve(repositoryRoot, directory), {
      recursive: true,
      withFileTypes: true,
    })
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(?:css|mjs|ts|vue)$/.test(entry.name)) continue
      packagedSources.push(resolve(entry.parentPath, entry.name))
    }
  }

  const forbiddenFixtureSelector = [
    /data-quality(?:-case)?/,
    /\.presentation-[\w-]*(?:gallery|probe)\b/,
  ]
  for (const file of packagedSources.sort()) {
    const source = await readFile(file, 'utf8')
    for (const pattern of forbiddenFixtureSelector) {
      assert.doesNotMatch(
        source,
        pattern,
        `${relative(repositoryRoot, file)} contains fixture-only behavior`,
      )
    }
    if (file.includes('/setup/')) {
      assert.doesNotMatch(
        source,
        /markdown-it|remark|rehype|unified|obsidian(?:-|_)parser/i,
        `${relative(repositoryRoot, file)} crosses the converter boundary`,
      )
    }
  }

  const styleFiles = (await readdir(resolve(repositoryRoot, 'styles'), {
    recursive: true,
    withFileTypes: true,
  }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.css'))
    .map(entry => resolve(entry.parentPath, entry.name))
  for (const file of styleFiles) {
    const source = await readFile(file, 'utf8')
    if (file.includes('/presets/')) {
      assert.doesNotMatch(
        source,
        /\.obsidian-slidev-callout__title::before/,
        `${relative(repositoryRoot, file)} overrides protected marker geometry`,
      )
      const calloutTitleBlocks = [
        ...source.matchAll(
          /[^{}]*\.obsidian-slidev-callout__title[^{}]*\{([^{}]*)\}/g,
        ),
      ].map(match => match[1])
      assert.ok(
        calloutTitleBlocks.every(block => !/text-transform\s*:/.test(block)),
        `${relative(repositoryRoot, file)} transforms authored callout titles`,
      )
    }
    if (/--presentation-family-(?:neutral|info|positive|caution|danger|question|quotation)\s*:/.test(source)) {
      assert.ok(
        file.endsWith('/styles/tokens.css')
          || file.endsWith('/styles/presets/shared.css'),
        `${relative(repositoryRoot, file)} duplicates shared semantic families`,
      )
    }
  }

  const shippedAssets = []
  for (const directory of ['assets/ICT', 'assets/UCAS']) {
    const entries = await readdir(resolve(repositoryRoot, directory), {
      recursive: true,
      withFileTypes: true,
    })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const path = resolve(entry.parentPath, entry.name)
      shippedAssets.push({
        bytes: (await stat(path)).size,
        path: relative(repositoryRoot, path),
      })
    }
  }
  assert.ok(shippedAssets.length > 0)
  assert.ok(
    shippedAssets.every(asset => asset.bytes <= 250 * 1024),
    JSON.stringify(shippedAssets.filter(asset => asset.bytes > 250 * 1024)),
  )

  assert.deepEqual(
    Object.keys(packageJson.dependencies).sort(),
    ['@slidev/client'],
  )
  assert.equal(packageJson.devDependencies['@slidev/types'], '^52.15.2')
  assert.equal(packageJson.devDependencies['slidev-pane'], '0.1.9')

  const gateSource = await readFile(
    resolve(repositoryRoot, 'scripts/check-presentation-css.mjs'),
    'utf8',
  )
  for (const requiredGate of [
    /data-quality/,
    /gallery\|probe|gallery.*probe|probe.*gallery/s,
    /250\s*\*\s*1024/,
    /markdown-it|remark|unified/,
    /package\.json/,
  ]) {
    assert.match(gateSource, requiredGate)
  }
})

test('follow-up source hygiene removes dead runtime paths and remote font CSS', async () => {
  const [
    baseCss,
    badge,
    defaultPreset,
    ictPreset,
    kbd,
    layouts,
    main,
    renderNormalization,
    slideFrame,
    taskLists,
    toc,
    tokens,
  ] = await Promise.all([
    readFile(resolve(repositoryRoot, 'styles/base.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/Badge.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/presets/default.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/presets/ict.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/Kbd.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/layouts.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/main.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/render-normalization.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/SlideFrame.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/task-lists.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'layouts/toc.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/tokens.css'), 'utf8'),
  ])

  assert.doesNotMatch(baseCss, /@import\s+url\(["']?https?:/)
  assert.match(badge, /normalizeBoolean/)
  assert.doesNotMatch(main, /presentationPreset|presentationChrome|synchronizeFrameChrome/)
  assert.doesNotMatch(slideFrame, /synchronizeFrameChrome/)
  assert.doesNotMatch(slideFrame, /configs\.value\.info/)
  await assert.rejects(
    readFile(resolve(repositoryRoot, 'setup/frame-chrome.ts'), 'utf8'),
    error => error?.code === 'ENOENT',
  )
  assert.doesNotMatch(taskLists, /observePresentationTaskLists|export\s*\{\s*TASK_INPUT_SELECTOR/)
  assert.doesNotMatch(renderNormalization, /registerPresentationNormalizer/)
  assert.doesNotMatch(layouts, /slide-frame__header-mark/)
  assert.doesNotMatch(defaultPreset, /slide-frame__header-mark/)
  assert.equal(
    (defaultPreset.match(
      /^\.slidev-layout\[data-presentation-preset="default"\],$/gm,
    ) ?? []).length,
    1,
  )
  assert.doesNotMatch(tokens, /#3f6f68|#77b5aa/)
  assert.doesNotMatch(tokens, /:root\[data-presentation-density=/)
  assert.match(
    tokens,
    /--presentation-reading-width:\s*100%/,
    'ordinary prose should use the full slide content width by default',
  )
  assert.match(
    ictPreset,
    /--presentation-font-serif:\s*"Source Serif 4"/,
  )
  assert.match(kbd, /Array\.isArray/)
  assert.match(kbd, /typeof key === ['"]string['"]/)
  assert.match(kbd, /accessibleSeparator\?: string/)
  assert.match(kbd, /join\(accessibleSeparator\.value\)/)
  assert.match(toc, /from ['"]#slidev\/slides['"]/)
  assert.doesNotMatch(toc, /\bas any\b|meta\?\.slide\?\.|slide\?\.slide\?\./)
})

test('documented style hooks and layout passthroughs remain live contracts', async () => {
  const [
    base,
    codeLayout,
    figure,
    frame,
    imageTextLayout,
    media,
    obsidian,
    readme,
    tokens,
  ] = await Promise.all([
    readFile(resolve(repositoryRoot, 'styles/base.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'layouts/code.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/Figure.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/SlideFrame.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'internals/ImageTextLayout.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/media.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/obsidian.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'README.md'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/tokens.css'), 'utf8'),
  ])

  for (const token of [
    '--presentation-shadow',
    '--presentation-inline-code-border',
    '--presentation-callout-bg',
    '--presentation-callout-border',
  ]) {
    assert.ok(readme.includes(`| \`${token}\` |`), token)
  }
  assert.match(base, /box-shadow:\s*var\(--presentation-shadow\)/)
  assert.match(base, /border:\s*1px solid var\(--presentation-inline-code-border\)/)
  assert.match(obsidian, /border:\s*1px solid var\(--presentation-callout-border\)/)
  assert.match(obsidian, /--presentation-callout-family-surface:\s*var\(--presentation-callout-bg\)/)

  for (const deadToken of [
    '--presentation-badge-bg',
    '--presentation-badge-border',
    '--presentation-badge-text',
    '--presentation-label-gap',
    '--presentation-sequence-node-text',
  ]) {
    assert.doesNotMatch(tokens, new RegExp(`${deadToken}:`), deadToken)
  }

  assert.match(frame, /if \(slideFooter === false\) return ['"]{2}/)
  assert.match(frame, /if \(deckFooter === false\) return ['"]{2}/)
  assert.match(codeLayout, /<SlideFrame\s+[\s\S]*?v-bind=["']attrs["']/)
  assert.match(imageTextLayout, /<SlideFrame\s+[\s\S]*?v-bind=["']attrs["']/)
  assert.match(
    imageTextLayout,
    /backgroundSize:\s*['"]contain['"]/,
    'image-text default fit',
  )
  assert.match(
    media,
    /normalizeMediaBackgroundSize[\s\S]*?fallback\s*=\s*['"]contain['"]/,
    'media background-size fallback',
  )
  assert.match(
    obsidian,
    /\.obsidian-slidev-media--video video\s*\{[\s\S]*?height:\s*var\(--presentation-media-viewport-height\)[\s\S]*?max-height:\s*none[\s\S]*?object-fit:\s*contain/,
    'native video reserves stable contain-fit geometry',
  )

  assert.match(media, /const retry = \(\) =>/)
  assert.match(media, /retryCount\.value \+= 1/)
  assert.match(figure, /defineExpose\(\{ retry \}\)/)
  assert.match(figure, /:key=["']imageKey["']/)
})

test('every layout-owned chrome prop accepts canonical values and booleans', async () => {
  const roots = [
    resolve(repositoryRoot, 'layouts'),
    resolve(repositoryRoot, 'internals'),
  ]
  const files = (
    await Promise.all(roots.map(async root => (
      (await readdir(root))
        .filter(file => file.endsWith('.vue'))
        .map(file => resolve(root, file))
    )))
  ).flat()
  const checked = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (!source.includes('chrome?:')) continue
    assert.match(
      source,
      /chrome\?: PresentationChrome \| boolean/,
      `${relative(repositoryRoot, file)} uses the shared chrome input type`,
    )
    assert.match(
      source,
      /chrome:\s*undefined/,
      `${relative(repositoryRoot, file)} preserves omitted chrome inheritance`,
    )
    checked.push(relative(repositoryRoot, file))
  }

  assert.ok(checked.length >= 13, 'all direct and internal layout wrappers were checked')
})

test('image-text media uses one authoritative reserved-height rule', async () => {
  const source = await readFile(
    resolve(repositoryRoot, 'styles/content-layouts.css'),
    'utf8',
  )
  const rule = source.match(
    /\.presentation-image-text__figure \.obsidian-slidev-media__viewport\s*\{[^}]+\}/,
  )?.[0]
  assert.ok(rule, 'image-text media viewport rule exists')
  assert.match(rule, /\bheight:/)
  assert.doesNotMatch(rule, /\baspect-ratio:/)
})

test('performance baselines are intentionally absent from the repository gate', async () => {
  const [packageJson, readme, runner] = await Promise.all([
    readFile(resolve(repositoryRoot, 'package.json'), 'utf8').then(JSON.parse),
    readFile(resolve(repositoryRoot, 'README.md'), 'utf8'),
    readFile(resolve(repositoryRoot, 'tests/quality/run.mjs'), 'utf8'),
  ])

  assert.equal(packageJson.scripts['quality:update-baselines'], undefined)
  assert.equal(packageJson.scripts['quality:update-performance-baselines'], undefined)
  assert.equal(packageJson.scripts['quality:update-visual-baselines']?.length > 0, true)
  assert.doesNotMatch(runner, /performance-baseline|navigation-performance|output-sizes/)
  assert.match(readme, /raw\s+output\/navigation\s+sampling\s+baselines.*removed/is)

  for (const path of [
    'scripts/measure-build-output.mjs',
    'tests/quality/navigation-performance.mjs',
    'tests/quality/navigation-performance.spec.mjs',
    'tests/quality/performance-baselines.spec.mjs',
    'tests/quality/baselines/navigation-performance.json',
    'tests/quality/baselines/output-sizes.json',
  ]) {
    await assert.rejects(
      readFile(resolve(repositoryRoot, path), 'utf8'),
      error => error?.code === 'ENOENT',
      `${path} was removed`,
    )
  }
})

test('pre-1.0 source keeps one canonical implementation path', async () => {
  const [
    branding,
    figure,
    frame,
    main,
    obsidian,
    presentationConfig,
    quote,
    renderNormalization,
    styleIndex,
    taskLists,
  ] = await Promise.all([
    readFile(resolve(repositoryRoot, 'internals/PresetBranding.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/Figure.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'components/SlideFrame.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/main.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/obsidian.css'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/presentation-config.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'layouts/quote.vue'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/render-normalization.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'styles/index.ts'), 'utf8'),
    readFile(resolve(repositoryRoot, 'setup/task-lists.ts'), 'utf8'),
  ])

  assert.doesNotMatch(
    taskLists,
    /\.slidev-layout\s+li\s*>\s*input\[type=["']checkbox["']\]/,
  )
  assert.match(taskLists, /\.task-list-item/)
  assert.match(taskLists, /\.contains-task-list/)
  assert.match(taskLists, /\.obsidian-slidev-task-list/)

  await assert.rejects(
    readFile(resolve(repositoryRoot, 'layouts/thanks.vue'), 'utf8'),
    error => error?.code === 'ENOENT',
  )
  assert.doesNotMatch(quote, /\bcite\??\s*:|\bauthor\s*\?\?\s*cite\b/)
  assert.doesNotMatch(figure, /\bbackgroundSize\b|data-media-rendering/)

  assert.match(styleIndex, /['"]\.\/components\.css['"]/)
  assert.match(styleIndex, /['"]\.\/content-layouts\.css['"]/)
  for (const directory of ['components', 'internals', 'layouts']) {
    for (const file of await sourceFiles(directory)) {
      assert.doesNotMatch(
        await readFile(file, 'utf8'),
        /<style\s+src=/,
        relative(repositoryRoot, file),
      )
    }
  }

  assert.doesNotMatch(main, /presentationDensity|--presentation-accent/)
  assert.doesNotMatch(presentationConfig, /\bbrandSafeZone\b/)
  assert.doesNotMatch(frame, /data-presentation-brand-safe-zone/)
  assert.match(frame, /:style=["']frameStyle["']/)

  assert.match(renderNormalization, /normalizeGeneratedCallouts/)
  assert.doesNotMatch(
    obsidian,
    /\.obsidian-slidev-callout--(?:note|info|todo|abstract|summary|tip|success|check|warning|caution|attention|danger|error|failure|question|help|faq|quote|cite)/,
  )

  assert.match(branding, /<template v-if="preset === 'ucas'">/)
  assert.match(branding, /<template v-else-if="preset === 'ict'">/)
  assert.equal(
    [...branding.matchAll(/v-else-if="variant === 'section'"/g)].length,
    2,
  )
  assert.equal([...branding.matchAll(/v-if="!showHeader"/g)].length, 2)
  assert.match(frame, /:show-header="resolved\.showHeader"/)
  assert.doesNotMatch(branding, /slide-frame__ict-mark/)
  assert.doesNotMatch(branding, /slide-frame__ucas-content-brand/)
  assert.doesNotMatch(branding, /ucasWordmark\s+from|--theme-(?:light|dark)/)

  await assert.rejects(
    readFile(resolve(repositoryRoot, '.npmignore'), 'utf8'),
    error => error?.code === 'ENOENT',
  )
})
