# ni

~~*`npm i` in a yarn project, again? F\*\*k!*~~

**ni** - use the right package manager.

<pre>
$ npm i -g <b>@antfu/ni</b>

$ <b>ni</b>
</pre>

`ni` => <code><a href='https://docs.npmjs.com/cli/v6/commands/npm'>npm</a> install</code> / <code><a href='https://yarnpkg.com'>yarn</a> add</code> / <code><a href='https://pnpm.js.org/en/'>pnpm</a> install</code>


<br>
<br>


### `ni` - Install

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

# npm i axios -D
# yarn add axios -D
# pnpm i axios -D
```

```bash
ni --frozen

# npm ci
# yarn install --frozen-lockfile
# pnpm install --frozen-lockfile
```

### `nr` - Run

```bash
nr

# npm run start
# yarn run
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

Before it runs, it will detect your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` to know current package mangar, and runs the corresponding commands.
