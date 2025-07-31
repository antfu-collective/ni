import type { RunnerContext } from '.'
import { byLengthAsc, Fzf } from 'fzf'
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
