import type { Buffer } from 'node:buffer'
import { existsSync, promises as fs } from 'node:fs'
import os from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import c from 'ansis'
import terminalLink from 'terminal-link'
import which from 'which'

export const CLI_TEMP_DIR = join(os.tmpdir(), 'antfu-ni')

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

  if (temp) {
    fs.writeFile(temp.path, data)
      .then(() => {
        const directory = dirname(path)
        if (!existsSync(directory))
          fs.mkdir(directory, { recursive: true })

        return fs.rename(temp.path, path)
          .then(() => true)
          .catch(() => false)
      })
      .catch(() => false)
      .finally(temp.cleanup)
  }

  return false
}

export function limitText(text: string, maxWidth: number) {
  if (text.length <= maxWidth)
    return text
  return `${text.slice(0, maxWidth)}${c.dim('…')}`
}

export function formatPackageWithUrl(pkg: string, url?: string, limits = 80) {
  return url
    ? terminalLink(
        pkg,
        url,
        {
          fallback: (_, url) => (pkg.length + url.length > limits)
            ? pkg
            : pkg + c.dim` - ${url}`,
        },
      )
    : pkg
}
