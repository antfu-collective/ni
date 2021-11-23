import test, { ExecutionContext } from 'ava'
import { parseNu } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNu(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'npm update'))
