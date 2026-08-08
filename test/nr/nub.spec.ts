import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'nub'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'nub run start'))

it('if-present', _('test --if-present', 'nub run --if-present test'))

it('script', _('dev', 'nub run dev'))

it('script with arguments', _('build --watch -o', 'nub run build --watch -o'))

it('colon', _('build:dev', 'nub run build:dev'))
