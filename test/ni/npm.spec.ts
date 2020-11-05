import test, { ExecutionContext } from 'ava'
import { parseNi } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNi(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'npm i'))

test('single add', _('axios', 'npm i axios'))

test('multiple', _('eslint @types/node', 'npm i eslint @types/node'))

test('-D', _('eslint @types/node -D', 'npm i eslint @types/node -D'))

test('global', _('eslint -g', 'npm i -g eslint'))

test('ci', _('--ci', 'npm ci'))
