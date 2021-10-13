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
# pnpm i axios
```

```bash
ni @types/node -D

# npm i @types/node -D
# yarn add @types/node -D
# pnpm i @types/node -D
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
# pnpm i -g iroiro

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
# pnpm upgrade
```

```bash
nu -i

# (not available for npm)
# yarn upgrade-interactive
# pnpm upgrade -i
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

### `nrm` - remove

```bash
nrm axios

# npm uninstall axios
# yarn remove axios
# pnpm remove axios
```

```bash
nrm @types/node -D

# npm uninstall @types/node -D
# yarn remove @types/node -D
# pnpm remove @types/node -D
```

```bash
nrm -g iroiro

# npm uninstall -g iroiro
# yarn global remove iroiro
# pnpm remove -g iroiro

# this uses default agent, regardless your current working directory
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

<br>

### How?

**ni** assumes that you work with lockfiles (and you should)

Before it runs, it will detect your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` to know current package manager, and runs the corresponding commands.
