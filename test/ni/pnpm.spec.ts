import { test } from 'vitest'
import { parseNaTest, promptRemoveOfNodeModules } from './_base'

const _ = parseNaTest('pnpm')

test('empty', _('', ['pnpm i']))

test('empty reinstall', _('--reinstall', [promptRemoveOfNodeModules, 'pnpm i']))

test('single add', _('axios', ['pnpm add axios']))

test('multiple', _('eslint @types/node', ['pnpm add eslint @types/node']))

test('-D', _('-D eslint @types/node', ['pnpm add -D eslint @types/node']))

test('add types', _('--types node react @foo/bar', 'pnpm add -D @types/node @types/react @types/foo__bar'))

test('global', _('eslint -g', ['pnpm add -g eslint']))

test('frozen', _('--frozen', ['pnpm i --frozen-lockfile']))

test('forward1', _('--anything', ['pnpm i --anything']))
test('forward2', _('-a', ['pnpm i -a']))
