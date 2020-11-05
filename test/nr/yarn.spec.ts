import test, { ExecutionContext } from 'ava'
import { parseNr } from '../../src/commands'

const agent = 'yarn'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNr(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'yarn run start'))

test('script', _('dev', 'yarn run dev'))

test('script with arguments', _('build --watch -o', 'yarn run build --watch -o'))

test('colon', _('build:dev', 'yarn run build:dev'))
