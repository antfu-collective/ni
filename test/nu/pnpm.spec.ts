import test, { ExecutionContext } from 'ava'
import { parseNu } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNu(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'pnpm update'))

test('interactive', _('-i', 'pnpm update -i'))

test('interactive latest', _('-i --latest', 'pnpm update -i --latest'))
