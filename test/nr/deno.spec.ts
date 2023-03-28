import { expect, test } from 'vitest'
import { parseNr } from '../../src/commands'

const agent = 'deno'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNr(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'deno task start'))

test('script', _('dev', 'deno task dev'))

test('script with arguments', _('build --watch -o', 'deno task build --watch -o'))

test('colon', _('build:dev', 'deno task build:dev'))
