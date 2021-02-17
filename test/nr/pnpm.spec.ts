import test, { ExecutionContext } from 'ava'
import { parseNr } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => (t: ExecutionContext) => {
  t.is(
    parseNr(agent, arg.split(' ').filter(Boolean)),
    expected,
  )
}

test('empty', _('', 'pnpm run start'))

test('if-present', _('test --if-present', 'pnpm run --if-present test'))

test('script', _('dev', 'pnpm run dev'))

test('script with arguments', _('build --watch -o', 'pnpm run build -- --watch -o'))

test('colon', _('build:dev', 'pnpm run build:dev'))
