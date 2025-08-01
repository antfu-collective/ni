import type { RunnerContext } from '.'
import { byLengthAsc, Fzf } from 'fzf'
import { getPackageJSON } from './fs'
import { findPackages } from './monorepo'
import { readPackageScripts } from './package'

// Print completion script
export const rawBashCompletionScript = `
###-begin-nr-completion-###

if type complete &>/dev/null; then
  _nr_completion() {
    local words
    local cur
    local cword
    _get_comp_words_by_ref -n =: cur words cword
    IFS=$'\\n'
    COMPREPLY=($(COMP_CWORD=$cword COMP_LINE=$cur nr --completion \${words[@]}))
  }
  complete -F _nr_completion nr
fi

###-end-nr-completion-###
`.trim()

export const rawZshCompletionScript = `
#compdef nr

_nr_completion() {
  local -a completions
  completions=("\${(f)$(nr --completion $words[2,-1])}")
  
  compadd -a completions
}

_nr_completion
`.trim()

export function getCompletionSuggestions(args: string[], ctx: RunnerContext | undefined) {
  const raw = readPackageScripts(ctx)
  const fzf = new Fzf(raw, {
    selector: item => item.key,
    casing: 'case-insensitive',
    tiebreakers: [byLengthAsc],
  })

  const results = fzf.find(args[1] || '')

  return results.map(r => r.item.key)
}

export function getPackageCompletionSuggestions(args: string[], ctx: RunnerContext | undefined) {
  const raw = readPackageScripts(ctx)
  const fzf = new Fzf(raw, {
    selector: item => item.key,
    casing: 'case-insensitive',
    tiebreakers: [byLengthAsc],
  })

  const results = fzf.find(args[3] || '')

  return results.map(r => r.item.key)
}

export async function getFilterCompletionSuggestions(args: string[], ctx: RunnerContext | undefined): Promise<string[]> {
  if (args[2]) {
    // If already completed, return
    if (args[3])
      return []

    const packages = await findPackages(ctx)
    const packageNames = packages.map(pkg => getPackageJSON({ cwd: pkg }).name)

    // Check if args[2] exactly matches a package name
    const exactMatch = packageNames.find(name => name === args[2])

    if (exactMatch) {
      // Exact match found, provide script completions for this package
      const suggestions: Record<string, string[]> = Object.fromEntries(packages.map((pkg) => {
        const suggestion = getPackageCompletionSuggestions(args, {
          cwd: pkg,
        })
        const pkgName = getPackageJSON({ cwd: pkg }).name
        return [pkgName, suggestion]
      }))

      const target = suggestions[args[2]]
      if (target) {
        return target
      }
      return []
    }

    // No exact match, provide package name completions that start with args[2]
    const matchingPackages = packageNames.filter(name => name.startsWith(args[2]))
    if (matchingPackages.length > 0) {
      return matchingPackages
    }

    // No matches at all, return nothing
    return []
  }

  // No args[2], show all package names
  const packages = await findPackages(ctx)
  const suggestions = packages.map((pkg) => {
    return getPackageJSON({ cwd: pkg }).name
  })

  return suggestions
}
