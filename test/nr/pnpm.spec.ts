import { expect, test } from 'vitest'
import { parseNr } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNr(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'pnpm run start'))

test('if-present', _('test --if-present', 'pnpm run --if-present test'))

test('script', _('dev', 'pnpm run dev'))

test('script with arguments', _('build --watch -o', 'pnpm run build --watch -o'))

test('colon', _('build:dev', 'pnpm run build:dev'))
