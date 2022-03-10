import { test, expect } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNi(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'pnpm i'))

test('single add', _('axios', 'pnpm add axios'))

test('multiple', _('eslint @types/node', 'pnpm add eslint @types/node'))

test('-D', _('-D eslint @types/node', 'pnpm add -D eslint @types/node'))

test('global', _('eslint -g', 'pnpm add -g eslint'))

test('frozen', _('--frozen', 'pnpm i --frozen-lockfile'))
