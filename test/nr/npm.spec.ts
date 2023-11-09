import { expect, it } from 'vitest'
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

it('empty', _('', 'npm run start'))

it('if-present', _('test --if-present', 'npm run --if-present test'))

it('script', _('dev', 'npm run dev'))

it('script with arguments', _('build --watch -o', 'npm run build -- --watch -o'))

it('colon', _('build:dev', 'npm run build:dev'))
