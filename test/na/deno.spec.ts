import { expect, it } from 'vitest'
import { parseNa, serializeCommand } from '../../src/commands'

const agent = 'deno'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNa(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'deno'))
it('foo', _('foo', 'deno foo'))
it('run test', _('run test', 'deno run test'))
it('task dev', _('task dev', 'deno task dev'))
it('install', _('install', 'deno install'))
it('add package', _('add package', 'deno add package'))
