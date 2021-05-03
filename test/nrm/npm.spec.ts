import test, { ExecutionContext } from 'ava'
import { parseNrm } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNrm(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('single remove', _('axios', 'npm uninstall axios'))

test('multiple', _('eslint @types/node', 'npm uninstall eslint @types/node'))

test('-D', _('eslint @types/node -D', 'npm uninstall eslint @types/node -D'))

test('global', _('eslint -g', 'npm uninstall -g eslint'))