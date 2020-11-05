import test, { ExecutionContext } from 'ava'
import { parseNi } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNi(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'pnpm i'))

test('single add', _('axios', 'pnpm i axios'))

test('multiple', _('eslint @types/node', 'pnpm i eslint @types/node'))

test('-D', _('eslint @types/node -D', 'pnpm i eslint @types/node -D'))

test('global', _('eslint -g', 'pnpm i -g eslint'))

test('frozen', _('--frozen', 'pnpm i --frozen-lockfile'))
