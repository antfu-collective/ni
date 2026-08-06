import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'aube'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'aube run start'))

it('if-present', _('test --if-present', 'aube run --if-present test'))

it('script', _('dev', 'aube run dev'))

it('script with arguments', _('build --watch -o', 'aube run build --watch -o'))

it('colon', _('build:dev', 'aube run build:dev'))
