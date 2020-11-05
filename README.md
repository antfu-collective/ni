# ni

~~`npm i` in a yarn project, again? F**k!~~

**ni** - use the right package manager.

`ni` => <code><a href='https://docs.npmjs.com/cli/v6/commands/npm'>npm</a> install</code> / <code><a href='https://yarnpkg.com'>yarn</a> add</code> / <code><a href='https://pnpm.js.org/en/'>pnpm</a> install</code>

<pre>
$ npm i -g <b>@antfu/ni</b>

$ <b>ni</b>
</pre>

---


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

### How?

**ni** assumes that you work with lock files (and you should)

Before it runs, it will detect your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` to know current package mangar, and runs the corresponding commands.
