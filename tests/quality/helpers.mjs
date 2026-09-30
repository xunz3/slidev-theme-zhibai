import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import {
  access,
  cp,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
export const qualityArtifactRoot = resolve(repositoryRoot, '.artifacts/quality')
export const CANONICAL_VIEWPORT = Object.freeze({
  deviceScaleFactor: 2,
  height: 552,
  name: 'canonical',
  width: 980,
})
export const COMPACT_VIEWPORT = Object.freeze({
  deviceScaleFactor: 2,
  height: 405,
  name: 'compact',
  width: 720,
})
export const REVIEW_VIEWPORTS = Object.freeze([
  CANONICAL_VIEWPORT,
  COMPACT_VIEWPORT,
])

export const browserContextOptionsForViewport = (viewport) => ({
  deviceScaleFactor: viewport.deviceScaleFactor,
  viewport: {
    height: viewport.height,
    width: viewport.width,
  },
})

export const reviewMatrix = ({
  compactCases = [],
  modes = ['light', 'dark'],
  presets = ['zhubai', 'ucas', 'ict'],
} = {}) => [
  ...presets.flatMap(preset => modes.map(mode => ({
    mode,
    preset,
    viewport: CANONICAL_VIEWPORT,
  }))),
  ...presets.flatMap(preset => modes.flatMap(mode => compactCases.map(caseId => ({
    caseId,
    mode,
    preset,
    viewport: COMPACT_VIEWPORT,
  })))),
]
const activeProcesses = new Set()

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export const assertArtifactPath = (target) => {
  const absolute = resolve(target)
  const relativePath = relative(qualityArtifactRoot, absolute)
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === '..') {
    throw new Error(`Refusing to mutate non-artifact path: ${absolute}`)
  }
  return absolute
}

export const resetArtifactDirectory = async (target) => {
  const absolute = assertArtifactPath(target)
  await rm(absolute, { force: true, recursive: true })
  await mkdir(absolute, { recursive: true })
  return absolute
}

export const runProcess = (
  command,
  args,
  {
    cwd = repositoryRoot,
    env = {},
    label = `${command} ${args.join(' ')}`,
    logPath,
    timeoutMs = 120_000,
  } = {},
) => {
  return new Promise((resolveProcess, reject) => {
    const startedAt = performance.now()
    const child = spawn(command, args, {
      cwd,
      detached: process.platform !== 'win32',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    activeProcesses.add(child)
    let stdout = ''
    let stderr = ''
    let settled = false

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })

    const finish = async (error, result) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      activeProcesses.delete(child)
      if (logPath) {
        const absoluteLogPath = assertArtifactPath(logPath)
        await mkdir(dirname(absoluteLogPath), { recursive: true })
        await writeFile(
          absoluteLogPath,
          [`# ${label}`, '', stdout, stderr].join('\n'),
          'utf8',
        )
      }
      if (error) reject(error)
      else resolveProcess(result)
    }

    const timeout = setTimeout(() => {
      terminateProcess(child, 'SIGTERM')
      setTimeout(() => terminateProcess(child, 'SIGKILL'), 2_000).unref()
      const error = new Error(`${label} timed out after ${timeoutMs} ms`)
      error.exitCode = 2
      error.stdout = stdout
      error.stderr = stderr
      void finish(error)
    }, timeoutMs)
    timeout.unref()

    child.on('error', error => void finish(error))
    child.on('close', (code, signal) => {
      const durationMs = Math.round(performance.now() - startedAt)
      if (code === 0) {
        void finish(null, { code, durationMs, signal, stderr, stdout })
        return
      }

      const error = new Error(
        `${label} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}`,
      )
      error.exitCode = code ?? 1
      error.stdout = stdout
      error.stderr = stderr
      error.durationMs = durationMs
      void finish(error)
    })
  })
}

const terminateProcess = (child, signal) => {
  if (!child.pid) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      // The process already exited.
    }
  }
}

export const terminateActiveProcesses = async () => {
  const children = [...activeProcesses]
  for (const child of children) terminateProcess(child, 'SIGTERM')
  if (children.length === 0) return

  await new Promise(resolveWait => setTimeout(resolveWait, 300))
  for (const child of children) {
    if (activeProcesses.has(child)) terminateProcess(child, 'SIGKILL')
  }
}

export const mapConcurrent = async (items, concurrency, worker) => {
  const results = new Array(items.length)
  let nextIndex = 0

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  )
  return results
}

export const slidevExecutable = resolve(
  repositoryRoot,
  `node_modules/.bin/slidev${process.platform === 'win32' ? '.cmd' : ''}`,
)

export const buildDeck = async ({
  id,
  outDir,
  source,
  timeoutMs = 120_000,
}) => {
  await access(slidevExecutable)
  await resetArtifactDirectory(outDir)
  return runProcess(
    slidevExecutable,
    ['build', source, '--out', outDir],
    {
      label: `build:${id}`,
      logPath: resolve(qualityArtifactRoot, `logs/build-${id}.log`),
      timeoutMs,
    },
  )
}

export const generatePresetMatrixDefinitions = async () => {
  const templatePath = resolve(repositoryRoot, 'fixtures/preset-isolation.md')
  const generatedRoot = await resetArtifactDirectory(
    resolve(qualityArtifactRoot, 'generated/matrix'),
  )
  const buildRoot = await resetArtifactDirectory(
    resolve(qualityArtifactRoot, 'build/matrix'),
  )
  const template = await readFile(templatePath, 'utf8')
  const presets = ['zhubai', 'qingdai', 'songmo', 'ucas', 'ict']

  return Promise.all(presets.map(async (preset) => {
    const source = resolve(generatedRoot, `global-${preset}.md`)
    const content = template
      .replaceAll('__THEME_PATH__', JSON.stringify(repositoryRoot))
      .replaceAll('__GLOBAL_PRESET__', preset)
    await writeFile(source, content, 'utf8')
    return {
      id: `matrix-${preset}`,
      outDir: resolve(buildRoot, preset),
      preset,
      source,
    }
  }))
}

export const generatePresetMatrixBuilds = async () => {
  const definitions = await generatePresetMatrixDefinitions()
  await mapConcurrent(definitions, 2, buildDeck)
  return definitions
}

export const generateExpandedContentDefinitions = async () => {
  const templatePath = resolve(repositoryRoot, 'fixtures/expanded-content.md')
  const fixtureCssPath = resolve(repositoryRoot, 'fixtures/expanded-content.css')
  const generatedRoot = await resetArtifactDirectory(
    resolve(qualityArtifactRoot, 'generated/expanded-content'),
  )
  const buildRoot = await resetArtifactDirectory(
    resolve(qualityArtifactRoot, 'build/expanded-content'),
  )
  await cp(
    resolve(repositoryRoot, 'fixtures/public/author-fixtures'),
    resolve(generatedRoot, 'public/author-fixtures'),
    { recursive: true },
  )
  const [template, fixtureCss] = await Promise.all([
    readFile(templatePath, 'utf8'),
    readFile(fixtureCssPath, 'utf8'),
  ])
  await writeFile(resolve(generatedRoot, 'style.css'), fixtureCss, 'utf8')
  const presetMarker = 'preset: zhubai # __EXPANDED_PRESET__'
  if (!template.includes(presetMarker)) {
    throw new Error('expanded-content fixture is missing its preset-generation marker')
  }

  return Promise.all(['zhubai', 'ucas', 'ict'].map(async (preset) => {
    const source = resolve(generatedRoot, `${preset}.md`)
    const content = template
      .replace(
        /^theme:\s+\.\.\/$/m,
        `theme: ${JSON.stringify(repositoryRoot)}`,
      )
      .replace(
        presetMarker,
        `preset: ${preset} # generated from __EXPANDED_PRESET__`,
      )
    await writeFile(source, content, 'utf8')
    return {
      id: `expanded-${preset}`,
      outDir: resolve(buildRoot, preset),
      preset,
      source,
    }
  }))
}

export const generateExpandedContentBuilds = async () => {
  const definitions = await generateExpandedContentDefinitions()
  await mapConcurrent(definitions, 2, buildDeck)
  return definitions
}

export const readQualityBuildContext = () => {
  const serialized = process.env.QUALITY_BUILD_CONTEXT
  if (!serialized) return null

  let parsed
  try {
    parsed = JSON.parse(serialized)
  } catch (error) {
    throw new Error(`QUALITY_BUILD_CONTEXT is not valid JSON: ${error.message}`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('QUALITY_BUILD_CONTEXT must be an object keyed by build ID')
  }
  for (const [id, build] of Object.entries(parsed)) {
    if (!build || typeof build !== 'object') {
      throw new Error(`QUALITY_BUILD_CONTEXT.${id} must be an object`)
    }
    if (typeof build.outDir !== 'string' || !build.outDir) {
      throw new Error(`QUALITY_BUILD_CONTEXT.${id}.outDir is required`)
    }
    if (typeof build.baseUrl !== 'string' || !build.baseUrl.startsWith('http://127.0.0.1:')) {
      throw new Error(`QUALITY_BUILD_CONTEXT.${id}.baseUrl must be a loopback URL`)
    }
  }
  return parsed
}

export const startStaticServer = async (rootDirectory) => {
  const root = resolve(rootDirectory)
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
    try {
      const decodedPath = decodeURIComponent(requestUrl.pathname)
      const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
      let absolutePath = resolve(root, `.${requestedPath}`)
      const relativePath = relative(root, absolutePath)
      if (relativePath.startsWith(`..${sep}`) || relativePath === '..') {
        response.writeHead(403).end('Forbidden')
        return
      }

      let fileStat = await stat(absolutePath)
      if (fileStat.isDirectory()) {
        absolutePath = resolve(absolutePath, 'index.html')
        fileStat = await stat(absolutePath)
      }
      if (!fileStat.isFile()) throw new Error('Not a regular file')

      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-length': fileStat.size,
        'content-type': mimeTypes[extname(absolutePath)] ?? 'application/octet-stream',
      })
      createReadStream(absolutePath).pipe(response)
    } catch {
      if (!extname(requestUrl.pathname)) {
        try {
          const fallbackPath = resolve(root, 'index.html')
          const fallbackStat = await stat(fallbackPath)
          response.writeHead(200, {
            'cache-control': 'no-store',
            'content-length': fallbackStat.size,
            'content-type': mimeTypes['.html'],
          })
          createReadStream(fallbackPath).pipe(response)
          return
        } catch {
          // Fall through to the regular 404 response.
        }
      }
      response.writeHead(404).end('Not found')
    }
  })

  await new Promise((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListen)
  })

  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Static server has no TCP address')

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose, reject) => {
      server.close(error => error ? reject(error) : resolveClose())
    }),
    port: address.port,
  }
}

export const waitForSlide = async (
  page,
  baseUrl,
  slideNumber,
  mode = 'light',
  caseId,
) => {
  await page.goto(`${baseUrl}/${slideNumber}`, { waitUntil: 'domcontentloaded' })
  if (caseId) {
    await page.locator(`[data-quality-case="${caseId}"]`).waitFor({ state: 'attached' })
  } else {
    await page.locator('.slidev-layout').first().waitFor({ state: 'attached' })
  }
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  })
  await page.evaluate(async (dark) => {
    document.documentElement.classList.toggle('dark', dark)
    await document.fonts?.ready
    await Promise.all(
      [...document.images].map(async (image) => {
        if (!image.complete) {
          await new Promise(resolveImage => {
            let frameId
            let timeoutId
            const finish = () => {
              image.removeEventListener('load', finish)
              image.removeEventListener('error', finish)
              if (frameId !== undefined) cancelAnimationFrame(frameId)
              clearTimeout(timeoutId)
              resolveImage()
            }
            const checkConnection = () => {
              if (image.complete || !image.isConnected) {
                finish()
                return
              }
              frameId = requestAnimationFrame(checkConnection)
            }
            image.addEventListener('load', finish, { once: true })
            image.addEventListener('error', finish, { once: true })
            timeoutId = setTimeout(finish, 5_000)
            checkConnection()
          })
        }
        if (!image.isConnected) return
        try {
          await image.decode()
        } catch {
          // Broken images are reported by the caller with their source.
        }
      }),
    )
  }, mode === 'dark')
  await page.waitForTimeout(40)
}
