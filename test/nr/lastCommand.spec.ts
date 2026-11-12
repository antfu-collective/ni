import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { x } from 'tinyexec'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const tsxLoader = require.resolve('tsx')
const nr = path.join(__dirname, '../../src/commands/nr.ts')

interface Project {
  cwd: string
  /** Isolated `os.tmpdir()`, so the real `_storage.json` is never touched */
  temp: string
}

async function createProject(scripts: Record<string, string>): Promise<Project> {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ni-record-'))
  const temp = path.join(root, 'tmp')
  const cwd = path.join(root, 'project')
  await fs.mkdir(temp)
  await fs.mkdir(cwd)
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({ name: 'fixture', scripts }))
  // Pin the agent, otherwise it depends on the machine
  await fs.writeFile(path.join(cwd, 'package-lock.json'), '{}')
  return { cwd, temp }
}

/**
 * `node --import tsx` rather than the `tsx` bin: the bin re-spawns a child,
 * which would give the CLI a different parent process on every run.
 */
async function runNr(project: Project, args: string[]) {
  const result = await x(process.execPath, ['--import', tsxLoader, nr, ...args], {
    throwOnError: false,
    nodeOptions: {
      cwd: project.cwd,
      env: {
        // `os.tmpdir()` follows these, which is where `CLI_TEMP_DIR` lives
        TMPDIR: project.temp,
        TMP: project.temp,
        TEMP: project.temp,
        NI_CONFIG_FILE: 'false',
      },
    },
  })
  return { exitCode: result.exitCode, stdout: result.stdout.trim(), stderr: result.stderr }
}

async function readStored(project: Project) {
  const file = path.join(project.temp, 'antfu-ni', '_storage.json')
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8'))
  }
  catch {
    return undefined
  }
}

const scripts = { dev: 'echo dev', build: 'echo build', start: 'echo start' }

describe('recording the last command', () => {
  it('records the script name, not the monorepo flag', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', '-p', 'build'])

    expect(await readStored(project)).toEqual({ lastRunCommand: 'build' })
  })

  it('reruns the script given to `nr -p`', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', '-p', 'build'])

    expect((await runNr(project, ['?', '-'])).stdout).toBe('npm run build')
  })

  it('records nothing when `-p` came without a script', async () => {
    // A single script skips the picker, leaving `-p` alone in `args`
    const project = await createProject({ start: 'echo start' })

    await runNr(project, ['?', '-p'])

    expect(await readStored(project)).toBeUndefined()
  })

  it('records the picked script', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', 'dev'])

    expect(await readStored(project)).toEqual({ lastRunCommand: 'dev' })
  })
})
