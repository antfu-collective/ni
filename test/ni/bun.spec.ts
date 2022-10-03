import { test } from 'vitest'
import { parseNi } from '../../src'
import { assertFactory } from '../assert'

const agent = 'bun'
const _ = assertFactory(parseNi, agent)

test('empty', _('', 'bun install'))

test('single add', _('axios', 'bun add axios'))

test('add dev', _('vite -D', 'bun add vite -d'))

test('multiple', _('eslint @types/node', 'bun add eslint @types/node'))

test('global', _('eslint -g', 'bun add -g eslint'))

test('frozen', _('--frozen', 'bun install --no-save'))
