import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'yarn'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'yarn install'))

it('single add', _('axios', 'yarn add axios'))

it('multiple', _('eslint @types/node', 'yarn add eslint @types/node'))

it('-D', _('eslint @types/node -D', 'yarn add eslint @types/node -D'))

it('global', _('eslint ni -g', 'yarn global add eslint ni'))

it('frozen', _('--frozen', 'yarn install --frozen-lockfile'))

it('production', _('-P', 'yarn install --production'))

it('frozen production', _('--frozen -P', 'yarn install --frozen-lockfile --production'))
