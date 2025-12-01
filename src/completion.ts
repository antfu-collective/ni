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

export const rawFishCompletionScript = `
function __nr_fish_scripts
  set -l tokens (commandline -xpc)
  set -l cwd_option
  set -l other_options
  set -l query_tokens

  # drop the command name
  if test (count $tokens) -ge 1
    set tokens $tokens[2..-1]
  end

  # Separate -C option, other options, and query tokens
  set -l skip_next 0
  for token in $tokens
    if test $skip_next -eq 1
      # This is the argument to -C
      set -a cwd_option $token
      set skip_next 0
      continue
    end

    if test "$token" = "-C"
      set -a cwd_option $token
      set skip_next 1
      continue
    end

    # Other options that don't take arguments
    if string match -qr '^-' -- $token
      set -a other_options $token
    else
      # Non-option tokens are part of the query
      set -a query_tokens $token
    end
  end

  # Call nr with correct order: -C first (processed by runCli), then --completion, then query, then other options
  nr $cwd_option --completion $query_tokens $other_options 2>/dev/null
end

function __nr_needs_script_completion
  # Don't complete if completion-related options are present
  if __fish_seen_argument -l completion -l completion-bash -l completion-zsh -l completion-fish
    return 1
  end

  # Don't complete if -p option is present (workspace selection)
  if __fish_seen_argument -s p
    return 1
  end

  set -l tokens (commandline -xpc)
  set -l cmd (commandline -ct)

  # Remove command name
  set -e tokens[1]

  # Check if any non-option argument exists (excluding -C's directory argument)
  set -l skip_next 0
  for token in $tokens
    # Skip this token if it's the argument to -C
    if test $skip_next -eq 1
      set skip_next 0
      continue
    end

    # If token is -C, skip the next token (its directory argument)
    if test "$token" = "-C"
      set skip_next 1
      continue
    end

    # If we find a token that doesn't start with -, a script name is already provided
    if not string match -qr '^-' -- $token
      return 1
    end
  end

  # Only complete if current token is not an option
  not string match -qr '^-' -- $cmd
end

# Define completions for nr command
complete -c nr -e
complete -c nr -f
complete -c nr -s h -l help -d 'Show help'
complete -c nr -s v -l version -d 'Show version'
complete -c nr -s C -d 'Change working directory' -r -a '(__fish_complete_directories)'
complete -c nr -l completion -d 'Print script suggestions' -f
complete -c nr -l completion-bash -d 'Print Bash completions' -f
complete -c nr -l completion-zsh -d 'Print Zsh completions' -f
complete -c nr -l completion-fish -d 'Print Fish completions' -f
complete -c nr -l if-present -d 'Ignore missing scripts'
complete -c nr -s p -d 'Select workspace package before running'
complete -c nr -n '__nr_needs_script_completion' -a '(__nr_fish_scripts)' -d 'package.json scripts'
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
