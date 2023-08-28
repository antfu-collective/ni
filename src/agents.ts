function npmRun(agent: string, run = 'run') {
  return (args: string[]) => {
    if (args.length > 1)
      return `${agent} ${run} ${args[0]} -- ${args.slice(1).join(' ')}`
    else return `${agent} ${run} ${args[0]}`
  }
}

const npm = {
  'agent': 'npm {0}',
  'run': npmRun('npm'),
  'install': 'npm i {0}',
  'frozen': 'npm ci',
  'global': 'npm i -g {0}',
  'add': 'npm i {0}',
  'upgrade': 'npm update {0}',
  'upgrade-interactive': null,
  'execute': 'npx {0}',
  /**
   * just `npm exec` can install packages
   * requires `--` as `npm exec ni -v` shows npm version
   */
  'bin': npmRun('npm', 'exec --no'),
  'uninstall': 'npm uninstall {0}',
  'global_uninstall': 'npm uninstall -g {0}',
}

const yarn = {
  'agent': 'yarn {0}',
  'run': 'yarn run {0}',
  'install': 'yarn install {0}',
  'frozen': 'yarn install --frozen-lockfile',
  'global': 'yarn global add {0}',
  'add': 'yarn add {0}',
  'upgrade': 'yarn upgrade {0}',
  'upgrade-interactive': 'yarn upgrade-interactive {0}',
  'execute': 'npx --no-install {0}',
  'bin': 'yarn run {0}',
  'uninstall': 'yarn remove {0}',
  'global_uninstall': 'yarn global remove {0}',
}
const yarnBerry = {
  ...yarn,
  'frozen': 'yarn install --immutable',
  'upgrade': 'yarn up {0}',
  'upgrade-interactive': 'yarn up -i {0}',
  'execute': 'yarn dlx {0}',
  'bin': 'yarn exec {0}',
  /** Yarn 2+ removed 'global', see https://github.com/yarnpkg/berry/issues/821 */
  'global': 'npm i -g {0}',
  'global_uninstall': 'npm uninstall -g {0}',
}

const pnpm = {
  'agent': 'pnpm {0}',
  'run': 'pnpm run {0}',
  'install': 'pnpm i {0}',
  'frozen': 'pnpm i --frozen-lockfile',
  'global': 'pnpm add -g {0}',
  'add': 'pnpm add {0}',
  'upgrade': 'pnpm update {0}',
  'upgrade-interactive': 'pnpm update -i {0}',
  'execute': 'pnpm dlx {0}',
  'bin': 'pnpm exec {0}',
  'uninstall': 'pnpm remove {0}',
  'global_uninstall': 'pnpm remove --global {0}',
}
/** pnpm v6.x or below */
const pnpm6 = {
  ...pnpm,
  run: npmRun('pnpm'),
}

const bun = {
  'agent': 'bun {0}',
  'run': 'bun run {0}',
  'install': 'bun install {0}',
  'frozen': 'bun install --no-save',
  'global': 'bun add -g {0}',
  'add': 'bun add {0}',
  'upgrade': 'bun update {0}',
  'upgrade-interactive': 'bun update {0}',
  'execute': 'bunx {0}',
  // needs a test
  // may install packages, maybe something other needed (or flags)
  'bin': 'bunx {0}',
  'uninstall': 'bun remove {0}',
  'global_uninstall': 'bun remove -g {0}',
}

export const AGENTS = {
  'npm': npm,
  'yarn': yarn,
  'yarn@berry': yarnBerry,
  'pnpm': pnpm,
  'pnpm@6': pnpm6,
  'bun': bun,
} satisfies Record<string, Record<Command, string | null | ((a: string[]) => string)>>

export type Agent = keyof typeof AGENTS
export type Command = keyof typeof npm

export const agents = Object.keys(AGENTS) as Agent[]

// the order here matters, more specific one comes first
export const LOCKS: Record<string, Agent> = {
  'bun.lockb': 'bun',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
}

export const INSTALL_PAGE: Record<Agent, string> = {
  'bun': 'https://bun.sh',
  'pnpm': 'https://pnpm.io/installation',
  'pnpm@6': 'https://pnpm.io/6.x/installation',
  'yarn': 'https://classic.yarnpkg.com/en/docs/install',
  'yarn@berry': 'https://yarnpkg.com/getting-started/install',
  'npm': 'https://docs.npmjs.com/cli/v8/configuring-npm/install',
}
