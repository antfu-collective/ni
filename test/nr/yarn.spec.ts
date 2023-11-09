import { expect, it } from 'vitest'
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

it('empty', _('', 'yarn run start'))

it('if-present', _('test --if-present', 'yarn run --if-present test'))

it('script', _('dev', 'yarn run dev'))

it('script with arguments', _('build --watch -o', 'yarn run build --watch -o'))

it('colon', _('build:dev', 'yarn run build:dev'))
