import { test } from 'vitest'
import { parseNun } from '../../src'
import { assertFactory } from '../assert'

const agent = 'pnpm'
const _ = assertFactory(parseNun, agent)

test('single add', _('axios', 'pnpm remove axios'))

test('multiple', _('eslint @types/node', 'pnpm remove eslint @types/node'))

test('-D', _('-D eslint @types/node', 'pnpm remove -D eslint @types/node'))

test('global', _('eslint -g', 'pnpm remove --global eslint'))
