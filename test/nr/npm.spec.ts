import { expect, test } from 'vitest'
import { parseNr } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNr(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('empty', _('', 'npm run start'))

test('if-present', _('test --if-present', 'npm run --if-present test'))

test('script', _('dev', 'npm run dev'))

test('script with arguments', _('build --watch -o', 'npm run build -- --watch -o'))

test('colon', _('build:dev', 'npm run build:dev'))
