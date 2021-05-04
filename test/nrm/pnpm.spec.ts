import test, { ExecutionContext } from 'ava'
import { parseNrm } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNrm(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('single remove', _('axios', 'pnpm remove axios'))

test('multiple', _('eslint @types/node', 'pnpm remove eslint @types/node'))

test('-D', _('eslint @types/node -D', 'pnpm remove eslint @types/node -D'))

test('global', _('eslint -g', 'pnpm remove -g eslint'))
