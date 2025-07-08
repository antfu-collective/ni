import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'deno'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'deno task start'))

it('if-present', _('test --if-present', 'deno task --if-present test'))

it('script', _('dev', 'deno task dev'))

it('script with arguments', _('build --watch -o', 'deno task build --watch -o'))

it('colon', _('build:dev', 'deno task build:dev'))
