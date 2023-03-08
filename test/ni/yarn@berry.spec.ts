import { test } from 'vitest'
import { parseNaTest, promptRemoveOfNodeModules } from './_base'

const _ = parseNaTest('yarn@berry')

test('empty', _('', ['yarn install']))

test('empty reinstall', _('--reinstall', [promptRemoveOfNodeModules, 'yarn install']))

test('single add', _('axios', ['yarn add axios']))

test('multiple', _('eslint @types/node', ['yarn add eslint @types/node']))

test('-D', _('eslint @types/node -D', ['yarn add eslint @types/node -D']))

test('add types', _('--types node react @foo/bar', 'yarn add -D @types/node @types/react @types/foo__bar'))

test('global', _('eslint ni -g', ['npm i -g eslint ni']))

test('frozen', _('--frozen', ['yarn install --immutable']))
