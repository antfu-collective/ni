import os from 'os'
import { dirname, join } from 'path'
import { execSync } from 'child_process'
import { existsSync, promises as fs } from 'fs'
import which from 'which'

export const CLI_TEMP_DIR = join(os.tmpdir(), 'antfu-ni')

export function remove<T>(arr: T[], v: T) {
  const index = arr.indexOf(v)
  if (index >= 0)
    arr.splice(index, 1)

  return arr
}

export function exclude<T>(arr: T[], v: T) {
  return remove(arr.slice(), v)
}

export function cmdExists(cmd: string) {
  try {
    // #8
    execSync(
      os.platform() === 'win32'
        ? `where ${cmd} > nul 2> nul"`
        : `command -v ${cmd}`,
    )
    return true
  }
  catch {
    return false
  }
}

export function getVoltaPrefix(): string {
  // https://blog.volta.sh/2020/11/25/command-spotlight-volta-run/
  const VOLTA_PREFIX = 'volta run'
  const hasVoltaCommand = which.sync('volta', { nothrow: true }) !== null
  return hasVoltaCommand ? VOLTA_PREFIX : ''
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
  counter++

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

export async function writeFile(
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
