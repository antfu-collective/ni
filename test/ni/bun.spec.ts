import { expect, test } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'bun'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNi(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'bun install'))

test('single add', _('axios', 'bun add axios'))

test('-D', _('vite -D', 'bun add vite -d'))

test('multiple', _('eslint @types/node', 'bun add eslint @types/node'))

test('add types', _('--types node react @foo/bar', 'bun add -d @types/node @types/react @types/foo__bar'))

test('global', _('eslint -g', 'bun add -g eslint'))

test('frozen', _('--frozen', 'bun install --no-save'))
