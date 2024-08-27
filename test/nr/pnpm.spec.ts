import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'pnpm run start'))

it('if-present', _('test --if-present', 'pnpm run --if-present test'))

it('script', _('dev', 'pnpm run dev'))

it('script with arguments', _('build --watch -o', 'pnpm run build --watch -o'))

it('colon', _('build:dev', 'pnpm run build:dev'))
