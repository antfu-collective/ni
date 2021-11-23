import test, { ExecutionContext } from 'ava'
import { parseNu } from '../../src/commands'

const agent = 'yarn'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNu(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'yarn upgrade'))

test('interactive', _('-i', 'yarn upgrade-interactive'))

test('interactive latest', _('-i --latest', 'yarn upgrade-interactive --latest'))
