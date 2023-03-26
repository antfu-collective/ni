import which from 'which'

export function remove<T>(arr: T[], v: T) {
  const index = arr.indexOf(v)
  if (index >= 0)
    arr.splice(index, 1)

  return arr
}

export function exclude<T>(arr: T[], v: T) {
  return arr.slice().filter(item => item !== v)
}

export function cmdExists(cmd: string) {
  return which.sync(cmd, { nothrow: true }) !== null
}

export function getVoltaPrefix(): string {
  // https://blog.volta.sh/2020/11/25/command-spotlight-volta-run/
  const VOLTA_PREFIX = 'volta run'
  const hasVoltaCommand = cmdExists('volta')
  return hasVoltaCommand ? VOLTA_PREFIX : ''
}
