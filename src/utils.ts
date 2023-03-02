import os from 'os'
import { execSync } from 'child_process'
import which from 'which'

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
