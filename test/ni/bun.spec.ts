import { test } from 'vitest'
import { parseNaTest, promptRemoveOfNodeModules } from './_base'

const _ = parseNaTest('bun')

test('empty', _('', ['bun install']))

test('empty reinstall', _('--reinstall', [promptRemoveOfNodeModules, 'bun install']))

test('single add', _('axios', ['bun add axios']))

test('-D', _('vite -D', 'bun add vite -d'))

test('add dev', _('vite -D', ['bun add vite -d']))

test('multiple', _('eslint @types/node', ['bun add eslint @types/node']))

test('add types', _('--types node react @foo/bar', 'bun add -d @types/node @types/react @types/foo__bar'))

test('global', _('eslint -g', ['bun add -g eslint']))

test('frozen', _('--frozen', ['bun install --no-save']))
