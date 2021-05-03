import test, { ExecutionContext } from 'ava'
import { parseNrm } from '../../src/commands'

const agent = 'yarn'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNrm(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('single remove', _('axios', 'yarn remove axios'))

test('multiple', _('eslint @types/node', 'yarn remove eslint @types/node'))

test('-D', _('eslint @types/node -D', 'yarn remove eslint @types/node -D'))

test('global', _('eslint ni -g', 'yarn global remove eslint ni'))