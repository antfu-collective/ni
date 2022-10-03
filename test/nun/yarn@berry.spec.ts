import { test } from 'vitest'
import { parseNun } from '../../src'
import { assertFactory } from '../assert'

const agent = 'yarn@berry'
const _ = assertFactory(parseNun, agent)

test('single add', _('axios', 'yarn remove axios'))

test('multiple', _('eslint @types/node', 'yarn remove eslint @types/node'))

test('-D', _('eslint @types/node -D', 'yarn remove eslint @types/node -D'))

test('global', _('eslint ni -g', 'npm uninstall -g eslint ni'))
