import { test } from 'vitest'
import { parseNi } from '../../src'
import { assertFactory } from '../assert'

const agent = 'yarn'
const _ = assertFactory(parseNi, agent)

test('empty', _('', 'yarn install'))

test('single add', _('axios', 'yarn add axios'))

test('multiple', _('eslint @types/node', 'yarn add eslint @types/node'))

test('-D', _('eslint @types/node -D', 'yarn add eslint @types/node -D'))

test('global', _('eslint ni -g', 'yarn global add eslint ni'))

test('frozen', _('--frozen', 'yarn install --frozen-lockfile'))
