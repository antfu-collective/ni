import { test, expect } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'yarn@berry'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNi(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'yarn install'))

test('single add', _('axios', 'yarn add axios'))

test('multiple', _('eslint @types/node', 'yarn add eslint @types/node'))

test('-D', _('eslint @types/node -D', 'yarn add eslint @types/node -D'))

test('global', _('eslint ni -g', 'npm i -g eslint ni'))

test('frozen', _('--frozen', 'yarn install --immutable'))
