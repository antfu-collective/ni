import type { Buffer } from 'node:buffer'
import { existsSync, promises as fs, fstatSync, readdirSync, readlinkSync, statSync } from 'node:fs'
import os from 'node:os'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
import { isatty } from 'node:tty'
import { styleText } from 'node:util'
import which from 'which'

export const CLI_TEMP_DIR = join(os.tmpdir(), 'antfu-ni')

let terminalId: string | undefined

/**
 * The terminal this process runs in. Every terminal has to allocate a pty, so
 * its device name covers iTerm2, Terminal.app, Kitty, WezTerm, tmux, VS Code
 * and the rest alike. Windows has no such name, so an interactive tab's shell
 * (the parent process) stands in for it.
 */
export function getTerminalId(): string {
  return terminalId ??= resolveTerminalId()
}

function resolveTerminalId(): string {
  for (const fd of [0, 1, 2]) {
    if (!isatty(fd))
      continue

    const name = ttyName(fd)
    if (name)
      return name
  }

  return `ppid-${process.ppid}`
}

/**
 * The device name behind `fd` — `ttys008` on macOS, `pts/3` on Linux. Node has
 * no `ttyname(3)`: Linux reports it via `/proc`, macOS only lets us match the
 * device number against `/dev`.
 */
function ttyName(fd: number): string | undefined {
  if (process.platform === 'linux') {
    try {
      const path = readlinkSync(`/proc/self/fd/${fd}`)
      if (path.startsWith('/dev/'))
        return basename(path)
    }
    catch {
      // Not a symlink, fall back to the device number
    }
  }

  try {
    const { rdev } = fstatSync(fd)
    for (const name of readdirSync('/dev')) {
      if (name.startsWith('tty') && statSync(`/dev/${name}`).rdev === rdev)
        return name
    }
  }
  catch {
    // No /dev to scan, the parent process is the only identifier left
  }
}

export function remove<T>(arr: T[], v: T) {
  const index = arr.indexOf(v)
  if (index >= 0)
    arr.splice(index, 1)

  return arr
}

export function exclude<T>(arr: T[], ...v: T[]) {
  return arr.slice().filter(item => !v.includes(item))
}

export function cmdExists(cmd: string) {
  return which.sync(cmd, { nothrow: true }) !== null
}

interface TempFile {
  path: string
  fd: fs.FileHandle
  cleanup: () => void
}

let counter = 0

async function openTemp(): Promise<TempFile | undefined> {
  if (!existsSync(CLI_TEMP_DIR))
    await fs.mkdir(CLI_TEMP_DIR, { recursive: true })

  const competitivePath = join(CLI_TEMP_DIR, `.${process.pid}.${counter}`)
  counter += 1

  return fs.open(competitivePath, 'wx')
    .then(fd => ({
      fd,
      path: competitivePath,
      cleanup() {
        fd.close().then(() => {
          if (existsSync(competitivePath))
            fs.unlink(competitivePath)
        })
      },
    }))
    .catch((error: any) => {
      if (error && error.code === 'EEXIST')
        return openTemp()

      else
        return undefined
    })
}

/**
 * Write file safely avoiding conflicts
 */
export async function writeFileSafe(
  path: string,
  data: string | Buffer = '',
): Promise<boolean> {
  const temp = await openTemp()

  if (!temp)
    return false

  try {
    await fs.writeFile(temp.path, data)

    const directory = dirname(path)
    if (!existsSync(directory))
      await fs.mkdir(directory, { recursive: true })

    await fs.rename(temp.path, path)
    return true
  }
  catch {
    return false
  }
  finally {
    temp.cleanup()
  }
}

export function limitText(text: string, maxWidth: number) {
  if (text.length <= maxWidth)
    return text
  return `${text.slice(0, maxWidth)}${styleText('dim', '…')}`
}

export function terminalLink(text: string, url: string, options?: { fallback?: (text: string, url: string) => string }): string {
  // Use OSC 8 hyperlink escape sequence
  // See https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
  if (
    process.env.FORCE_HYPERLINK
    || (process.stdout.isTTY && !process.env.NO_HYPERLINK)
  ) {
    return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`
  }
  if (options?.fallback)
    return options.fallback(text, url)
  return `${text} (${url})`
}

export function formatPackageWithUrl(pkg: string, url?: string, limits = 80) {
  return url
    ? terminalLink(
        pkg,
        url,
        {
          fallback: (_, url) => (pkg.length + url.length > limits)
            ? pkg
            : `${pkg} ${styleText('dim', `- ${url}`)}`,
        },
      )
    : pkg
}
