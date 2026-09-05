import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { arch, platform, release } from 'node:os'
import { dirname, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { chromium } from 'playwright-chromium'
import {
  assertArtifactPath,
  buildDeck,
  generateExpandedContentDefinitions,
  generatePresetMatrixDefinitions,
  mapConcurrent,
  qualityArtifactRoot,
  repositoryRoot,
  resetArtifactDirectory,
  runProcess,
  startStaticServer,
  terminateActiveProcesses,
} from './helpers.mjs'

const execFileAsync = promisify(execFile)
const summaryPath = resolve(qualityArtifactRoot, 'summary.json')
const requiredFailureFields = ['gate', 'caseId', 'status', 'artifactPaths']

const sha256 = value => createHash('sha256').update(value).digest('hex')
const relativePath = path => relative(repositoryRoot, path).split(sep).join('/')
const now = () => new Date().toISOString()
const resolvePnpmVersion = stdout => (
  stdout.trim()
  || process.env.npm_config_user_agent?.match(/\bpnpm\/([^\s]+)/)?.[1]
  || ''
)

export const validateQualityRecord = (record) => {
  for (const field of requiredFailureFields) {
    if (record[field] === undefined || record[field] === null) {
      throw new Error(`Quality record is missing ${field}`)
    }
  }
  if (!['fail', 'skipped'].includes(record.status)) {
    throw new Error(`Quality record ${record.caseId} has invalid status ${record.status}`)
  }
  if (!Array.isArray(record.artifactPaths) || record.artifactPaths.length === 0) {
    throw new Error(`Quality record ${record.caseId} needs a retained artifact path`)
  }
  for (const artifactPath of record.artifactPaths) {
    assertArtifactPath(artifactPath)
  }
  if (record.status === 'fail'
    && (record.expected === undefined || record.actual === undefined)) {
    throw new Error(`Failed record ${record.caseId} needs expected and actual values`)
  }
  if (record.status === 'skipped') {
    for (const field of ['reason', 'owner', 'followUp']) {
      if (typeof record[field] !== 'string' || !record[field].trim()) {
        throw new Error(`Skipped record ${record.caseId} needs ${field}`)
      }
    }
  }
  return record
}

export const classifyQualityExit = ({
  harnessError = false,
  records = [],
  timedOut = false,
}) => {
  if (timedOut || harnessError || records.some(record => record.status === 'skipped')) {
    return 2
  }
  return records.some(record => record.status === 'fail') ? 1 : 0
}

export const runSelfChecks = async ({ writeSummary = false } = {}) => {
  const selfCheckDirectory = await resetArtifactDirectory(
    resolve(qualityArtifactRoot, 'self-check'),
  )
  const artifact = name => resolve(selfCheckDirectory, name)
  const cases = [
    {
      expectedExitCode: 1,
      record: {
        gate: 'configuration',
        caseId: 'configuration-invalid-local-value',
        status: 'fail',
        selector: 'presentationPreset',
        property: 'value',
        expected: 'valid deck value',
        actual: 'unsupported local value',
        artifactPaths: [artifact('configuration.json')],
      },
    },
    {
      expectedExitCode: 1,
      record: {
        gate: 'visual',
        caseId: 'default-to-ucas-dark',
        status: 'fail',
        deck: 'matrix-default',
        globalPreset: 'default',
        localPreset: 'ucas',
        mode: 'dark',
        slide: 4,
        title: 'Preset isolation',
        selector: '.slidev-layout',
        property: 'pixels',
        expected: { changedPixelRatio: 0 },
        actual: { changedPixelRatio: 0.25 },
        artifactPaths: [
          artifact('screenshot-actual.png'),
          artifact('screenshot-expected.png'),
          artifact('screenshot-diff.json'),
        ],
      },
    },
    {
      expectedExitCode: 1,
      record: {
        gate: 'asset',
        caseId: 'assets-UCAS-emblem.svg',
        status: 'fail',
        property: 'rawBytes',
        expected: 256_000,
        actual: 256_001,
        artifactPaths: [artifact('asset-size.json')],
      },
    },
    {
      expectedExitCode: 2,
      record: {
        gate: 'accessibility',
        caseId: 'axe-environment-unavailable',
        status: 'skipped',
        reason: 'Synthetic required-gate skip',
        owner: 'quality-maintainer',
        followUp: 'Restore Chromium before release',
        artifactPaths: [artifact('skipped-gate.json')],
      },
    },
  ]

  assert.throws(
    () => validateQualityRecord({
      ...cases[3].record,
      owner: '',
      followUp: '',
    }),
    /needs owner|needs followUp/,
  )
  for (const syntheticCase of cases) {
    validateQualityRecord(syntheticCase.record)
    assert.equal(
      classifyQualityExit({ records: [syntheticCase.record] }),
      syntheticCase.expectedExitCode,
      syntheticCase.record.caseId,
    )
  }
  assert.equal(classifyQualityExit({ timedOut: true }), 2)

  const evidence = {
    schemaVersion: 1,
    mode: 'self-check',
    checkedAt: now(),
    status: 'pass',
    cases,
    timeout: {
      expectedExitCode: 2,
      detectedExitCode: classifyQualityExit({ timedOut: true }),
    },
  }
  const evidencePath = artifact('records.json')
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  for (const syntheticCase of cases) {
    for (const path of syntheticCase.record.artifactPaths) {
      await writeFile(
        path,
        `${JSON.stringify({
          caseId: syntheticCase.record.caseId,
          synthetic: true,
        }, null, 2)}\n`,
      )
    }
  }
  if (writeSummary) {
    await mkdir(dirname(summaryPath), { recursive: true })
    await writeFile(summaryPath, `${JSON.stringify({
      ...evidence,
      exitCode: 0,
      summaryPath: relativePath(summaryPath),
    }, null, 2)}\n`)
  }
  return {
    cases: cases.map(syntheticCase => ({
      caseId: syntheticCase.record.caseId,
      expectedExitCode: syntheticCase.expectedExitCode,
    })),
    evidencePath: relativePath(evidencePath),
  }
}

const collectEnvironment = async () => {
  const lockfile = await readFile(resolve(repositoryRoot, 'pnpm-lock.yaml'))
  const [
    { stdout: commit },
    { stdout: pnpmVersion },
    { stdout: chromiumVersion },
    { stdout: status },
  ] = await Promise.all([
    execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot }),
    execFileAsync('pnpm', ['--version'], { cwd: repositoryRoot }),
    execFileAsync(chromium.executablePath(), ['--version'], { cwd: repositoryRoot }),
    execFileAsync('git', ['status', '--porcelain'], { cwd: repositoryRoot }),
  ])
  return {
    architecture: arch(),
    chromiumVersion: chromiumVersion.trim(),
    gitCommit: commit.trim(),
    lockfileSha256: sha256(lockfile),
    nodeVersion: process.version,
    operatingSystem: `${platform()} ${release()}`,
    pnpmVersion: resolvePnpmVersion(pnpmVersion),
    workingTreeDirty: status.trim().length > 0,
  }
}

const parseArguments = () => {
  const arguments_ = process.argv.slice(2)
  const unknown = arguments_.filter(argument => !['--', '--self-check'].includes(argument))
  if (unknown.length > 0) {
    throw new Error(`Unsupported quality argument(s): ${unknown.join(', ')}`)
  }
  return { selfCheck: arguments_.includes('--self-check') }
}

const executeQuality = async () => {
  const startedAt = performance.now()
  const summary = {
    schemaVersion: 1,
    mode: 'quality',
    startedAt: now(),
    performancePolicy: 'not-gated',
    environment: await collectEnvironment(),
    phases: [],
    failures: [],
  }
  let servers = []
  let activePhase = null

  const runPhase = async (id, operation) => {
    const phase = {
      id,
      startedAt: now(),
      status: 'running',
    }
    activePhase = phase
    summary.phases.push(phase)
    const phaseStarted = performance.now()
    try {
      phase.details = await operation()
      phase.status = 'pass'
      return phase.details
    } catch (error) {
      phase.status = error.timedOut || error.exitCode === 2 ? 'error' : 'fail'
      phase.reason = error.message
      error.qualityPhase = id
      throw error
    } finally {
      phase.durationMs = Math.round(performance.now() - phaseStarted)
      phase.finishedAt = now()
      activePhase = null
    }
  }
  const runCommandPhase = async (
    id,
    args,
    timeoutMs = 600_000,
    environment = {},
  ) => {
    const logPath = resolve(qualityArtifactRoot, `logs/${id}.log`)
    const result = await runProcess(
      process.execPath,
      args,
      {
        env: {
          ...buildEnvironment,
          ...environment,
        },
        label: id,
        logPath,
        timeoutMs,
      },
    )
    return {
      durationMs: result.durationMs,
      logPath: relativePath(logPath),
    }
  }

  let buildEnvironment = {}

  const run = async () => {
    await runPhase('prepare-artifacts', async () => {
      await Promise.all([
        'axe',
        'build',
        'diffs',
        'generated',
        'logs',
        'screenshots',
        'self-check',
      ].map(directory => resetArtifactDirectory(
        resolve(qualityArtifactRoot, directory),
      )))
      await rm(summaryPath, { force: true })
      return { root: relativePath(qualityArtifactRoot) }
    })

    await runPhase(
      'protocol-conformance',
      () => runCommandPhase(
        'protocol-conformance',
        ['--test', 'tests/quality/protocol-conformance.spec.mjs'],
        30_000,
      ),
    )

    let buildDefinitions
    await runPhase('prepare-builds', async () => {
      const [matrixDefinitions, expandedDefinitions] = await Promise.all([
        generatePresetMatrixDefinitions(),
        generateExpandedContentDefinitions(),
      ])
      const maintainedRoot = await resetArtifactDirectory(
        resolve(qualityArtifactRoot, 'build/maintained'),
      )
      const maintained = [
        { id: 'example', source: 'example.md' },
        { id: 'default-only', source: 'fixtures/default-preset.md' },
        { id: 'ucas', source: 'fixtures/ucas-preset.md' },
        { id: 'ict', source: 'fixtures/ict-preset.md' },
        { id: 'protocol', source: 'fixtures/obsidian-protocol.md' },
        { id: 'protocol-core', source: 'fixtures/protocol-core.md' },
        { id: 'protocol-profile', source: 'fixtures/protocol-profile.md' },
      ].map(definition => ({
        ...definition,
        outDir: resolve(maintainedRoot, definition.id),
        source: resolve(repositoryRoot, definition.source),
      }))
      buildDefinitions = [
        ...maintained,
        ...matrixDefinitions.map(definition => ({
          ...definition,
          id: `matrix-${definition.preset}`,
        })),
        ...expandedDefinitions,
      ]
      assert.equal(new Set(buildDefinitions.map(build => build.id)).size, 13)
      for (const build of buildDefinitions) {
        assert.ok(resolve(build.outDir) === build.outDir, `${build.id}: absolute output`)
      }
      return {
        builds: buildDefinitions.map(build => ({
          id: build.id,
          outDir: relativePath(build.outDir),
          source: relativePath(build.source),
        })),
        maximumConcurrency: 2,
      }
    })

    const buildResults = await runPhase('builds', async () => mapConcurrent(
      buildDefinitions,
      2,
      async (definition) => {
        const result = await buildDeck({
          ...definition,
          timeoutMs: 600_000,
        })
        return {
          durationMs: result.durationMs,
          id: definition.id,
          logPath: relativePath(
            resolve(qualityArtifactRoot, `logs/build-${definition.id}.log`),
          ),
          outDir: relativePath(definition.outDir),
        }
      },
    ))
    summary.builds = buildResults

    let buildContext
    await runPhase('local-servers', async () => {
      servers = await Promise.all(
        buildDefinitions.map(build => startStaticServer(build.outDir)),
      )
      buildContext = Object.fromEntries(
        buildDefinitions.map((build, index) => [
          build.id,
          {
            baseUrl: servers[index].baseUrl,
            id: build.id,
            outDir: build.outDir,
            preset: build.preset,
            source: build.source,
          },
        ]),
      )
      buildEnvironment = {
        QUALITY_BUILD_CONTEXT: JSON.stringify(buildContext),
      }
      return {
        servers: Object.fromEntries(
          Object.entries(buildContext).map(([id, build]) => [id, build.baseUrl]),
        ),
      }
    })

    await runPhase('self-checks', () => runSelfChecks())
    await runPhase(
      'configuration',
      () => runCommandPhase(
        'configuration',
        ['tests/quality/configuration.spec.mjs'],
        30_000,
      ),
    )
    await runPhase(
      'css-architecture',
      () => runCommandPhase(
        'css-architecture',
        ['scripts/check-presentation-css.mjs'],
        30_000,
      ),
    )
    await runPhase(
      'preset-isolation',
      () => runCommandPhase(
        'preset-isolation',
        ['--test', 'tests/quality/preset-isolation.spec.mjs'],
      ),
    )
    await runPhase(
      'content-contracts',
      () => runCommandPhase(
        'content-contracts',
        ['--test', 'tests/quality/content-contracts.spec.mjs'],
      ),
    )
    await runPhase(
      'accessibility',
      () => runCommandPhase(
        'accessibility',
        ['--test', 'tests/quality/accessibility.spec.mjs'],
      ),
    )
    await runPhase(
      'assets',
      () => runCommandPhase(
        'assets',
        ['--test', 'tests/quality/assets.spec.mjs'],
      ),
    )
    await runPhase(
      'layout-stability',
      () => runCommandPhase(
        'layout-stability',
        ['--test', 'tests/quality/layout-stability.spec.mjs'],
        600_000,
      ),
    )
  }

  let exitCode = 0
  try {
    await run()
  } catch (error) {
    exitCode = error.timedOut || error.exitCode === 2 || error.code === 'ENOENT'
      ? 2
      : 1
    summary.failures.push({
      gate: error.qualityPhase ?? activePhase?.id ?? 'harness',
      caseId: error.qualityPhase ?? 'quality-harness',
      status: 'fail',
      expected: 'phase passes',
      actual: error.message,
      artifactPaths: [
        resolve(
          qualityArtifactRoot,
          `logs/${error.qualityPhase ?? 'harness'}.log`,
        ),
      ],
      reason: error.message,
    })
  } finally {
    const cleanupStarted = performance.now()
    let cleanupStatus = 'pass'
    let cleanupReason
    try {
      await terminateActiveProcesses()
      await Promise.allSettled(servers.map(server => server.close()))
      servers = []
    } catch (error) {
      cleanupStatus = 'error'
      cleanupReason = error.message
      if (exitCode === 0) exitCode = 2
    }
    summary.phases.push({
      id: 'cleanup',
      status: cleanupStatus,
      reason: cleanupReason,
      durationMs: Math.round(performance.now() - cleanupStarted),
      finishedAt: now(),
    })
  }

  summary.durationMs = Math.round(performance.now() - startedAt)
  summary.exitCode = exitCode
  summary.status = exitCode === 0
    ? 'pass'
    : exitCode === 1
      ? 'fail'
      : 'error'
  summary.finishedAt = now()
  summary.slowestPhases = [...summary.phases]
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, 5)
    .map(phase => ({
      durationMs: phase.durationMs,
      id: phase.id,
      status: phase.status,
    }))
  await mkdir(dirname(summaryPath), { recursive: true })
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)

  console.log(`Quality status: ${summary.status} (${summary.durationMs} ms)`)
  for (const phase of summary.slowestPhases) {
    console.log(`- ${phase.id}: ${phase.durationMs} ms (${phase.status})`)
  }
  console.log(`Summary: ${relativePath(summaryPath)}`)
  return exitCode
}

const main = async () => {
  let options
  try {
    options = parseArguments()
    if (options.selfCheck) {
      await runSelfChecks({ writeSummary: true })
      console.log(`Quality self-checks passed; summary: ${relativePath(summaryPath)}`)
      return 0
    }
    return await executeQuality()
  } catch (error) {
    console.error(error.stack ?? error.message)
    return 2
  }
}

process.exitCode = await main()
