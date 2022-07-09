# ni

~~*`npm i` in a yarn project, again? F\*\*k!*~~

**ni** - use the right package manager

<br>

<pre>
npm i -g <b>@antfu/ni</b>

<b>ni</b>
</pre>

<a href='https://docs.npmjs.com/cli/v6/commands/npm'>npm</a> · <a href='https://yarnpkg.com'>yarn</a> · <a href='https://pnpm.js.org/en/'>pnpm</a>


<br>


### `ni` - install

```bash
ni

# npm install
# yarn install
# pnpm install
```

```bash
ni axios

# npm i axios
# yarn add axios
# pnpm add axios
```

```bash
ni @types/node -D

# npm i @types/node -D
# yarn add @types/node -D
# pnpm add -D @types/node
```

```bash
ni --frozen

# npm ci
# yarn install --frozen-lockfile
# pnpm install --frozen-lockfile
```

```bash
ni -g iroiro

# npm i -g iroiro
# yarn global add iroiro
# pnpm add -g iroiro

# this uses default agent, regardless your current working directory
```

<br>

### `nr` - run

```bash
nr dev --port=3000

# npm run dev -- --port=3000
# yarn run dev --port=3000
# pnpm run dev -- --port=3000
```

```bash
nr

# interactively select the script to run
# supports https://www.npmjs.com/package/npm-scripts-info convention
```

```bash
nr -

# rerun the last command
```

<br>

### `nx` - execute

```bash
nx jest

# npx jest
# yarn dlx jest
# pnpm dlx jest
```

<br>

### `nu` - upgrade

```bash
nu

# npm upgrade
# yarn upgrade
# pnpm update
```

```bash
nu -i

# (not available for npm)
# yarn upgrade-interactive
# pnpm update -i
```

<br>

### `nun` - uninstall

```bash
nun axios

# npm uninstall axios
# yarn remove axios
# pnpm remove axios
```

```bash
nun @types/node -D

# npm uninstall @types/node -D
# yarn remove @types/node -D
# pnpm remove -D @types/node
```

```bash
nun -g eslint

# npm uninstall -g eslint
# yarn global remove eslint
# pnpm remove -g eslint
```

<br>

### `nci` - clean install

```bash
nci

# npm ci
# yarn install --frozen-lockfile
# pnpm install --frozen-lockfile
```

if the corresponding node manager is not present, this command will install it globally along the way.

<br>

### `nk` - clean node_modules

```bash
nk

# npx npkill
```

<br>

### `na` - agent alias

```bash
na

# npm
# yarn
# pnpm
```

```bash
na run foo

# npm run foo
# yarn run foo
# pnpm run foo
```

<br>

### Change Directory

```bash
ni -C packages/foo vite
nr -C playground dev
```

<br>

### Config

```ini
; ~/.nirc

; fallback when no lock found
defaultAgent=npm # default "prompt"

; for global installs
globalAgent=npm
```

```bash
# ~/.bashrc

# custom configuration file path
export NI_CONFIG_FILE="$HOME/.config/ni/nirc"
```

<br>

### How?

**ni** assumes that you work with lockfiles (and you should)

Before it runs, it will detect your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` to know current package manager (or `packageManager` field in your packages.json), and runs the corresponding commands.

### Trouble shooting

#### Conflicts with PowerShell on Windows

PowerShell come with a built-in alias `ni` for `New Item`. To remove the alias in favor of this package:

<details>
<summary> PowerShell <code>5.x</code></summary>

Create or edit file `C:\Windows\System32\WindowsPowerShell\v1.0\Microsoft.PowerShell_profile.ps1`, adding following line:

```ps
Remove-Item Alias:ni -Force -ErrorAction Ignore
```

</details>
<details>
<summary> PowerShell <code>7.x</code></summary>

Create or edit file `C:\Program Files\PowerShell\7\Microsoft.PowerShell_profile.ps1`, adding following line:

```ps
Remove-Alias -Name ni -Force
```

</details>
