import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'npm i'))

it('single add', _('axios', 'npm i axios'))

it('workspace add (-w)', _('axios -w some-workspace', 'npm i axios -w some-workspace'))

it('workspaces add (-ws)', _('axios -ws', 'npm i axios -ws'))

it('workspaces include workspace root (-iwr)', _('axios -iwr', 'npm i axios -iwr'))

it('multiple', _('eslint @types/node', 'npm i eslint @types/node'))

it('-D', _('eslint @types/node -D', 'npm i eslint @types/node -D'))

it('global', _('eslint -g', 'npm i -g eslint'))

it('frozen', _('--frozen', 'npm ci'))

it('production', _('-P', 'npm i --omit=dev'))
