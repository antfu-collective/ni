import { expect, it } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
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

// https://github.com/antfu-collective/ni/issues/322
it('workspace flag before script', _('-w packages/foo test', 'npm run -w=packages/foo -- test'))

it('workspace long flag before script', _('--workspace packages/foo test', 'npm run --workspace=packages/foo -- test'))

it('workspace flag after script', _('test -w packages/foo', 'npm run test -- -w=packages/foo'))

it('workspace long flag after script', _('test --workspace packages/foo', 'npm run test -- --workspace=packages/foo'))

it('workspace flag already joined with equals', _('-w=packages/foo test', 'npm run -w=packages/foo -- test'))

it('trailing workspace flag without value', _('test -w', 'npm run test -- -w'))
