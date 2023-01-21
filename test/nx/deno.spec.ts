import { expect, test } from 'vitest'
import { parseNx } from '../../src/commands'

const agent = 'deno'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNx(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('single uninstall', _('esbuild', 'deno run npm:esbuild'))
test('multiple', _('esbuild --version', 'deno run npm:esbuild --version'))
