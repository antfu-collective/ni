import { expect, test } from 'vitest'
import { parseNr } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNr(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('empty', _('', 'bun run start'))

test('script', _('dev', 'bun run dev'))

test('script with arguments', _('build --watch -o', 'bun run build --watch -o'))

test('colon', _('build:dev', 'bun run build:dev'))
