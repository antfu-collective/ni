import { expect, test } from 'vitest'
import { parseNr } from '../../src/commands'

const agent = 'yarn'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNr(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('empty', _('', 'yarn run start'))

test('if-present', _('test --if-present', 'yarn run --if-present test'))

test('script', _('dev', 'yarn run dev'))

test('script with arguments', _('build --watch -o', 'yarn run build --watch -o'))

test('colon', _('build:dev', 'yarn run build:dev'))
