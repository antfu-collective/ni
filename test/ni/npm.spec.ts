import { test } from 'vitest'
import { parseNaTest, promptRemoveOfNodeModules } from './_base'

const _ = parseNaTest('npm')

test('empty', _('', ['npm i']))

test('empty reinstall', _('--reinstall', [promptRemoveOfNodeModules, 'npm i']))

test('single add', _('axios', ['npm i axios']))

test('multiple', _('eslint @types/node', ['npm i eslint @types/node']))

test('-D', _('eslint @types/node -D', ['npm i eslint @types/node -D']))

test('add types', _('--types node react @foo/bar', 'npm i -D @types/node @types/react @types/foo__bar'))

test('global', _('eslint -g', ['npm i -g eslint']))

test('frozen', _('--frozen', ['npm ci']))
