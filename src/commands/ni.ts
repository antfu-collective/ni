import type { Choice } from '@posva/prompts'
import process from 'node:process'
import prompts from '@posva/prompts'
import c from 'ansis'
import { Fzf } from 'fzf'
import { fetchNpmPackages } from '../fetch'
import { parseNi } from '../parse'
import { runCli } from '../runner'
import { exclude } from '../utils'

runCli(async (agent, args, ctx) => {
  const isInteractive = args[0] === '-i'

  if (isInteractive) {
    let fetchPattern: string

    if (args[1] && !args[1].startsWith('-')) {
      fetchPattern = args[1]
    }
    else {
      const { pattern } = await prompts({
        type: 'text',
        name: 'pattern',
        message: 'search for package',
      })

      fetchPattern = pattern
    }

    if (!fetchPattern) {
      process.exitCode = 1
      return
    }

    const packages = await fetchNpmPackages(fetchPattern)

    if (!packages.length) {
      console.error('No results found')
      process.exitCode = 1
      return
    }

    const fzf = new Fzf(packages, {
      selector: (item: Choice) => item.title,
      casing: 'case-insensitive',
    })

    const { dependency } = await prompts({
      type: 'autocomplete',
      name: 'dependency',
      choices: packages,
      instructions: false,
      message: 'choose a package to install',
      limit: 15,
      async suggest(input: string, choices: Choice[]) {
        const results = fzf.find(input)
        return results.map(r => choices.find((c: any) => c.value === r.item.value))
      },
    })

    if (!dependency) {
      process.exitCode = 1
      return
    }

    args = exclude(args, '-d', '-p', '-i')

    /**
     * yarn and bun do not support
     * the installation of peers programmatically
     */
    const canInstallPeers = ['npm', 'pnpm'].includes(agent)

    const { mode } = await prompts({
      type: 'select',
      name: 'mode',
      message: `install ${c.yellow(dependency.name)} as`,
      choices: [
        {
          title: 'prod',
          value: '',
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

  return parseNi(agent, args, ctx)
})
