import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'bun run start'))

it('script', _('dev', 'bun run dev'))

it('script with arguments', _('build --watch -o', 'bun run build --watch -o'))

it('leading monorepo flag is stripped', _('-p dev', 'bun run dev'))

it('preserves -p after the script name', _('dev -p', 'bun run dev -p'))

it('preserves -p after other forwarded args', _('dev --watch -p', 'bun run dev --watch -p'))

it('colon', _('build:dev', 'bun run build:dev'))
