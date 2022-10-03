import { test } from 'vitest'
import { parseNun } from '../../src'
import { assertFactory } from '../assert'

const agent = 'bun'
const _ = assertFactory(parseNun, agent)

test('single uninstall', _('axios', 'bun remove axios'))

test('multiple', _('eslint @types/node', 'bun remove eslint @types/node'))

test('global', _('eslint ni -g', 'bun remove -g eslint ni'))
