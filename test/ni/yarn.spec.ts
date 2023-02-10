import { expect, test } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'yarn'
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

test('add types', _('--types node react', 'yarn add -D @types/node @types/react'))

test('global', _('eslint ni -g', 'yarn global add eslint ni'))

test('frozen', _('--frozen', 'yarn install --frozen-lockfile'))
