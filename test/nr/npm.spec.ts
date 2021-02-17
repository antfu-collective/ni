import test, { ExecutionContext } from 'ava'
import { parseNr } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNr(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'npm run start'))

test('if-present', _('test --if-present', 'npm run --if-present test'))

test('script', _('dev', 'npm run dev'))

test('script with arguments', _('build --watch -o', 'npm run build -- --watch -o'))

test('colon', _('build:dev', 'npm run build:dev'))
