import { execSync } from 'child_process'

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
    execSync(`command -v ${cmd}`)
    return true
  }
  catch {
    return false
  }
}
