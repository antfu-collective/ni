import { test } from 'vitest'
import { parseNa } from '../../src'
import { assertFactory } from '../assert'

const agent = 'pnpm'
const _ = assertFactory(parseNa, agent)

test('empty', _('', 'pnpm'))
test('foo', _('foo', 'pnpm foo'))
test('run test', _('run test', 'pnpm run test'))
