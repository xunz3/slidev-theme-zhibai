import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { repositoryRoot } from '../tests/quality/helpers.mjs'

const arguments_ = process.argv.slice(2)

const child = spawn(
  process.execPath,
  [resolve(repositoryRoot, 'tests/quality/run.mjs'), ...arguments_],
  {
    cwd: repositoryRoot,
    stdio: 'inherit',
  },
)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => child.kill(signal))
}
process.exitCode = await new Promise((resolveExit) => {
  child.once('error', (error) => {
    console.error(error.message)
    resolveExit(2)
  })
  child.once('exit', (code, signal) => {
    if (signal) {
      console.error(`Quality process ended with ${signal}`)
      resolveExit(2)
    } else {
      resolveExit(code ?? 2)
    }
  })
})
