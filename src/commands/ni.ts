import type { Choice } from '@posva/prompts'
import prompts from '@posva/prompts'
import { Fzf } from 'fzf'
import terminalLink from 'terminal-link'
import { parseNi } from '../parse'
import { runCli } from '../runner'
import { exclude, invariant } from '../utils'
import { dump, load } from '../storage'
import { fetchNpmPackages } from '../fetch'

runCli(async (agent, args, ctx) => {
  const storage = await load()

  const isLastCmd = args[0] === '-'
  const isInteractive = args[0] === '-i'

  if (isLastCmd) {
    if (!storage.lastInstalledPkg) {
      invariant(ctx?.programmatic, 'No last installed package found\'')

      throw new Error('No last installed package')
    }

    args[0] = storage.lastInstalledPkg
  }

  if (isInteractive) {
    let fetchPattern: string

    if (args[1] && !args[1].startsWith('-')) {
      fetchPattern = args[1]
    }
    else {
      const { pattern } = await prompts({
        type: 'text',
        name: 'pattern',
        message: 'package name',
      })

      fetchPattern = pattern
    }

    invariant(fetchPattern)

    const packages = await fetchNpmPackages(fetchPattern)

    invariant(packages.length, 'No results found')

    const fzf = new Fzf(packages, {
      selector: (item: Choice) => item.title,
      casing: 'case-insensitive',
    })

    const { dependency } = await prompts({
      type: 'autocomplete',
      name: 'dependency',
      choices: packages,
      instructions: false,
      message: 'choose package',
      limit: 25,
      async suggest(input: string, choices: Choice[]) {
        const results = fzf.find(input)
        return results.map(r => choices.find((c: any) => c.value === r.item.value))
      },
    })

    invariant(dependency)

    args = exclude(args, '-d', '-p', '-i')

    /**
     * yarn and bun do not support
     * the installation of peers programmatically
     */
    const canInstallPeers = ['npm', 'pnpm'].includes(agent)

    const { npm, repository } = dependency.links

    const pkgLink = terminalLink(dependency.name, repository ?? npm)

    const { mode } = await prompts({
      type: 'select',
      name: 'mode',
      message: `install ${pkgLink} as`,
      choices: [
        {
          title: 'prod',
          value: null,
          selected: true,
        },
        {
          title: 'dev',
          value: '-D',
        },
        {
          title: `peer`,
          value: '--save-peer',
          disabled: !canInstallPeers,
        },
      ],
    })

    args.push(dependency.name, mode)
  }

  if (storage.lastUninstalledPkg !== args[0]) {
    storage.lastUninstalledPkg = args[0]
    await dump()
  }

  return parseNi(agent, args, ctx)
})
