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
# ! uses default agent, regardless CWD
```

<br>

### `nr` - run

```bash
nr

# npm run start
# yarn run start
# pnpm run start
```

```bash
nr dev --port=3000

# npm run dev -- --port=3000
# yarn run dev --port=3000
# pnpm run dev -- --port=3000
```

<br>

### Config

```ini
; ~/.nirc

; default agent will be used for global installs 
; and the fallback when no lock found.
defaultAgent=npm
```

<br>

### How?

**ni** assumes that you work with lockfiles (and you should)

Before it runs, it will detect your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` to know current package manager, and runs the corresponding commands.
