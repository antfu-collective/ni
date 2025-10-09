import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'npm run start'))

it('if-present', _('test --run --if-present', 'node --run test'))

it('script', _('dev --run', 'node --run dev'))

it('script with arguments bis', _('build --watch -o --run', 'node --run build --watch -o'))

it('colon', _('build:dev --run', 'node --run build:dev'))
