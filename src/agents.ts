const npmRun = (agent: string) => (args: string[]) => {
  if (args.length > 1)
    return `${agent} run ${args[0]} -- ${args.slice(1).join(' ')}`
  else return `${agent} run ${args[0]}`
}

export const AGENTS = {
  npm: {
    'run': npmRun('npm'),
    'install': 'npm i',
    'frozen': 'npm ci',
    'global': 'npm i -g {0}',
    'add': 'npm i {0}',
    'upgrade': 'npm update {0}',
    'upgrade-interactive': null,
    'execute': 'npx {0}',
    'uninstall': 'npm uninstall {0}',
    'global_uninstall': 'npm uninstall -g {0}',
  },
  yarn: {
    'run': 'yarn run {0}',
    'install': 'yarn install',
    'frozen': 'yarn install --frozen-lockfile',
    'global': 'yarn global add {0}',
    'add': 'yarn add {0}',
    'upgrade': 'yarn upgrade {0}',
    'upgrade-interactive': 'yarn upgrade-interactive {0}',
    'execute': 'yarn dlx {0}',
    'uninstall': 'yarn remove {0}',
    'global_uninstall': 'yarn global remove {0}',
  },
  pnpm: {
    'run': npmRun('pnpm'),
    'install': 'pnpm i',
    'frozen': 'pnpm i --frozen-lockfile',
    'global': 'pnpm i -g {0}',
    'add': 'pnpm i {0}',
    'upgrade': 'pnpm update {0}',
    'upgrade-interactive': 'pnpm update -i {0}',
    'execute': 'pnpm dlx {0}',
    'uninstall': 'pnpm remove {0}',
    'global_uninstall': 'pnpm remove -g {0}',
  },
}

export type Agent = keyof typeof AGENTS
export type Command = keyof typeof AGENTS.npm

export const agents = Object.keys(AGENTS) as Agent[]

export const LOCKS: Record<string, Agent> = {
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
}

export const INSTALL_PAGE: Record<Agent, string> = {
  pnpm: 'https://pnpm.js.org/en/installation',
  yarn: 'https://yarnpkg.com/getting-started/install',
  npm: 'https://www.npmjs.com/get-npm',
}
