# ni

~~`npm i` in a yarn project, again? F**k!~~

**ni** - smart packages `install` that sense your current package manager.

`ni` => `npm install` / `yarn add` / `pnpm install`

<pre>
$ npm i -g @antfu/ni

$ <b>ni</b>
</pre>

---


## Usages

### `ni` - Install

### `nr` - Run

## How it works

**ni** assumes that you work with lock files (and you should). Before it runs, it will detect your `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` to check your package mangar, and runs the corresponding command from them. If not matches, npm will be used as fallback
