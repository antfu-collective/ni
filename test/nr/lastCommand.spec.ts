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
async function runNr(project: Project, args: string[], env: Record<string, string> = {}) {
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
        ...env,
      },
    },
  })
  return { exitCode: result.exitCode, stdout: result.stdout.trim(), stderr: result.stderr }
}

async function listStored(project: Project) {
  try {
    return (await fs.readdir(path.join(project.temp, 'antfu-ni'))).filter(file => file.endsWith('.json'))
  }
  catch {
    return []
  }
}

async function readStored(project: Project, file = '_storage.json') {
  try {
    return JSON.parse(await fs.readFile(path.join(project.temp, 'antfu-ni', file), 'utf-8'))
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

describe('lastCommand=shared', () => {
  it('keeps a single record for every terminal', async () => {
    const project = await createProject(scripts)
    const env = { NI_LAST_COMMAND: 'shared' }

    await runNr(project, ['?', 'dev'], env)
    await runNr(project, ['?', 'build'], env)

    expect(await listStored(project)).toEqual(['_storage.json'])
    expect(await readStored(project)).toEqual({ lastRunCommand: 'build' })
  })

  it('is the default', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', 'dev'])
    await runNr(project, ['?', 'build'])

    expect(await listStored(project)).toEqual(['_storage.json'])
  })
})

describe('lastCommand=terminal', () => {
  it('keeps one record per terminal', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', 'dev'], { NI_LAST_COMMAND: 'terminal' })

    const files = await listStored(project)
    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/^_storage\..+\.json$/)
    expect(await readStored(project, files[0])).toEqual({ lastRunCommand: 'dev' })
  })

  it('reruns the script of the same terminal', async () => {
    const project = await createProject(scripts)
    const env = { NI_LAST_COMMAND: 'terminal' }

    await runNr(project, ['?', 'build'], env)

    expect((await runNr(project, ['?', '-'], env)).stdout).toBe('npm run build')
  })

  it('leaves the shared record untouched', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', 'dev'], { NI_LAST_COMMAND: 'shared' })
    await runNr(project, ['?', 'build'], { NI_LAST_COMMAND: 'terminal' })

    expect(await readStored(project)).toEqual({ lastRunCommand: 'dev' })
  })
})

describe('lastCommand=off', () => {
  it('records nothing and disables `nr -`', async () => {
    const project = await createProject(scripts)
    const env = { NI_LAST_COMMAND: 'off' }

    await runNr(project, ['?', 'dev'], env)

    expect(await listStored(project)).toEqual([])

    const last = await runNr(project, ['?', '-'], env)
    expect(last.exitCode).toBe(1)
    expect(last.stderr).toContain('No last command found')
  })

  it('does not use a record written before it was turned off', async () => {
    const project = await createProject(scripts)

    await runNr(project, ['?', 'dev'], { NI_LAST_COMMAND: 'shared' })

    expect((await runNr(project, ['?', '-'], { NI_LAST_COMMAND: 'off' })).exitCode).toBe(1)
  })
})

describe('legacy NI_NO_LAST_COMMAND', () => {
  it('behaves like the off mode, without warning', async () => {
    const project = await createProject(scripts)
    const env = { NI_NO_LAST_COMMAND: 'true' }

    const first = await runNr(project, ['?', 'dev'], env)

    expect(first.stderr).not.toContain('deprecated')
    expect(await listStored(project)).toEqual([])
    expect((await runNr(project, ['?', '-'], env)).exitCode).toBe(1)
  })
})
