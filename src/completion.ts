// Raw completion scripts for bash and zsh
export const rawBashCompletionScript = `
###-begin-nr-completion-###

if type complete &>/dev/null; then
  _nr_completion() {
    local words
    local cur
    local cword
    _get_comp_words_by_ref -n =: cur words cword
    COMPREPLY=($(COMP_CWORD=$cword COMP_LINE=$cur nr --completion \${words[*]}))
  }
  complete -F _nr_completion nr
fi

###-end-nr-completion-###
`.trim()

export const rawZshCompletionScript = `
_nr(){
  # Set COMP_CWORD to one less than the actual current index (since the first word is the command itself)
  out=($(COMP_CWORD=$((\${CURRENT} - 1)) COMP_LINE="\${words[@]}" nr --completion "\${words[@]}"))
  compadd -a out
}

# don't run the completion function when being source-ed or eval-ed
if [ "$funcstack[1]" = "_nr" ]; then
  _nr
fi
`.trim()

export function printCompletionScript(shell: string = 'bash') {
  if (shell === 'bash') {
    // eslint-disable-next-line no-console
    console.log(rawBashCompletionScript)
  }
  else if (shell === 'zsh') {
    // eslint-disable-next-line no-console
    console.log(rawZshCompletionScript)
  }
  else {
    throw new Error(`Unsupported shell '${shell}'`)
  }
}
