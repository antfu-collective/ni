import { test } from 'vitest'
import { parseNun } from '../../src'
import { assertFactory } from '../assert'

const agent = 'yarn'
const _ = assertFactory(parseNun, agent)

test('single uninstall', _('axios', 'yarn remove axios'))

test('multiple', _('eslint @types/node', 'yarn remove eslint @types/node'))

test('-D', _('eslint @types/node -D', 'yarn remove eslint @types/node -D'))

test('global', _('eslint ni -g', 'yarn global remove eslint ni'))
