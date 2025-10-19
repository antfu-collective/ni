# ni

~~*`npm i` in a yarn project, again? F\*\*k!*~~

**ni** - use the right package manager

<br>

```
npm i -g @antfu/ni
```

### Homebrew (macOS)
```
brew install ni
```

<a href='https://docs.npmjs.com/cli/v6/commands/npm'>npm</a> · <a href='https://yarnpkg.com'>yarn</a> · <a href='https://pnpm.io/'>pnpm</a> · <a href='https://bun.sh/'>bun</a> · <a href='https://deno.land/'>deno</a>

<br>

### `ni` - install

```bash
ni

# npm install
# yarn install
# pnpm install
# bun install
# deno install
```

```bash
ni vite

# npm i vite
# yarn add vite
# pnpm add vite
# bun add vite
# deno add vite
```

```bash
ni @types/node -D

# npm i @types/node -D
# yarn add @types/node -D
# pnpm add -D @types/node
# bun add -d @types/node
# deno add -D @types/node
```

```bash
ni -P

# npm i --omit=dev
# yarn install --production
# pnpm i --production
# bun install --production
# (deno not supported)
```

```bash
ni --frozen

# npm ci
# yarn install --frozen-lockfile (Yarn 1)
# yarn install --immutable (Yarn Berry)
# pnpm install --frozen-lockfile
# bun install --frozen-lockfile
# deno install --frozen
```

```bash
ni -g eslint

# npm i -g eslint
# yarn global add eslint (Yarn 1)
# pnpm add -g eslint
# bun add -g eslint
# deno install eslint

# this uses default agent, regardless your current working directory
```

```bash
ni -i

# interactively select the dependency to install
# search for packages by name
```

<br>

### `nr` - run

```bash
nr dev --port=3000

# npm run dev -- --port=3000
# yarn run dev --port=3000
# pnpm run dev --port=3000
# bun run dev --port=3000
# deno task dev --port=3000
```

```bash
nr

# interactively select the script to run
# supports https://www.npmjs.com/package/npm-scripts-info convention
```

```bash
nr -p
nr -p dev

# interactively select the package and script to run
# supports https://www.npmjs.com/package/npm-scripts-info convention
```

```bash
nr -

# rerun the last command
```

```bash
# Add completion script for bash
nr --completion-bash >> ~/.bashrc

# Add completion script for zsh
# For zim:fw
mkdir -p ~/.zim/custom/ni-completions
nr --completion-zsh > ~/.zim/custom/ni-completions/_ni
echo "zmodule $HOME/.zim/custom/ni-completions --fpath ." >> ~/.zimrc
zimfw install
```

<br>

### `nlx` - download & execute

```bash
nlx vitest

# npx vitest
# yarn dlx vitest
# pnpm dlx vitest
# bunx vitest
# deno run npm:vitest
```

<br>

### `nup` - upgrade

```bash
nup

# npm upgrade
# yarn upgrade (Yarn 1)
# yarn up (Yarn Berry)
# pnpm update
# bun update
# deno upgrade
```

```bash
nup -i

# (not available for npm)
# yarn upgrade-interactive (Yarn 1)
# yarn up -i (Yarn Berry)
# pnpm update -i
# bun update -i
# deno outdated -u -i
```

<br>

### `nun` - uninstall

```bash
nun webpack

# npm uninstall webpack
# yarn remove webpack
# pnpm remove webpack
# bun remove webpack
# deno remove webpack
```

```bash
nun

# interactively select
# the dependency to remove
```

```bash
nun -m

# interactive select,
# but with multiple dependencies
```

```bash
nun -g silent

# npm uninstall -g silent
# yarn global remove silent
# pnpm remove -g silent
# bun remove -g silent
# deno uninstall -g silent
```

<br>

### `nci` - clean install

```bash
nci

# npm ci
# yarn install --frozen-lockfile
# pnpm install --frozen-lockfile
# bun install --frozen-lockfile
# deno cache --reload
```

<br>

### `nd` - dedupe dependencies

```bash
nd

# npm dedupe
# yarn dedupe
# pnpm dedupe
```

<br>

### `na` - agent alias

```bash
na

# npm
# yarn
# pnpm
# bun
# deno
```

```bash
na run foo

# npm run foo
# yarn run foo
# pnpm run foo
# bun run foo
# deno task foo
```

<br>

### Global Flags

```bash
# ?               | Print the command execution depends on the agent
ni vite ?

# -C              | Change directory before running the command
ni -C packages/foo vite
nr -C playground dev

# -v, --version   | Show version number
ni -v

# -h, --help      | Show help
ni -h
```

<br>

### Config

```ini
; ~/.nirc

; fallback when no lock found
defaultAgent=npm # default "prompt"

; for global installs
globalAgent=npm

; use node --run instead of package manager run command (requires Node.js 22+)
runAgent=node

; prefix commands with sfw
useSfw=true
```

```bash
# ~/.bashrc

# custom configuration file path
export NI_CONFIG_FILE="$HOME/.config/ni/nirc"

# environment variables have higher priority than config file if presented
export NI_DEFAULT_AGENT="npm" # default "prompt"
export NI_GLOBAL_AGENT="npm"
export NI_USE_SFW="true"
```

```ps
# for Windows

# custom configuration file path in PowerShell accessible within the `$profile` path
$Env:NI_CONFIG_FILE = 'C:\to\your\config\location'
```

<br>

### Automatic installation

Before executing any command (**ni**, **nr**, **nlx**, etc.), **ni** detects your active package manager.
If the corresponding package manager (**npm**, **yarn**, **pnpm**, **bun**, or **deno**) is not installed, it will install it globally before running the command.

### Integrations

#### asdf

You can also install ni via the [3rd-party asdf-plugin](https://github.com/CanRau/asdf-ni.git) maintained by [CanRau](https://github.com/CanRau)

```bash
# first add the plugin
asdf plugin add ni https://github.com/CanRau/asdf-ni.git

# then install the latest version
asdf install ni latest

# and make it globally available
asdf global ni latest
```

### How?

**ni** assumes that you work with lock-files (and you should).

Before `ni` runs the command, it detects your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` / `bun.lock` / `bun.lockb` / `deno.json` / `deno.jsonc` to know the current package manager (or `packageManager` field in your packages.json if specified) using the [package-manager-detector](https://github.com/antfu-collective/package-manager-detector) package and then runs the corresponding [package-manager-detector command](https://github.com/antfu-collective/package-manager-detector/blob/main/src/commands.ts).

### Trouble shooting

#### Conflicts with PowerShell

PowerShell comes with a built-in alias `ni` for the `New-Item` cmdlet. To remove the alias in your current PowerShell session in favor of this package, use the following command:

```PowerShell
'Remove-Item Alias:ni -Force -ErrorAction Ignore'
```

If you want to persist the changes, you can add them to your PowerShell profile. The profile path is accessible within the `$profile` variable. The ps1 profile file can normally be found at

- PowerShell 5 (Windows PowerShell): `C:\Users\USERNAME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`
- PowerShell 7: `C:\Users\USERNAME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`
- VSCode: `C:\Users\USERNAME\Documents\PowerShell\Microsoft.VSCode_profile.ps1`

You can use the following script to remove the alias at shell start by adding the above command to your profile:

```PowerShell
if (-not (Test-Path $profile)) {
  New-Item -ItemType File -Path (Split-Path $profile) -Force -Name (Split-Path $profile -Leaf)
}

$profileEntry = 'Remove-Item Alias:ni -Force -ErrorAction Ignore'
$profileContent = Get-Content $profile
if ($profileContent -notcontains $profileEntry) {
  ("`n" + $profileEntry) | Out-File $profile -Append -Force -Encoding UTF8
}
```

#### `nx`, `nix` and `nu` are no longer available

We renamed `nx`/`nix` and `nu` to `nlx` and `nup` to avoid conflicts with the other existing tools - [nx](https://nx.dev/), [nix](https://nixos.org/) and [nushell](https://www.nushell.sh/). You can always alias them back on your shell configuration file (`.zshrc`, `.bashrc`, etc).

```bash
alias nx="nlx"
# or
alias nix="nlx"
# or
alias nu="nup"
```
