import { test } from 'vitest'
import { parseNa } from '../../src'
import { assertFactory } from '../assert'

const agent = 'bun'
const _ = assertFactory(parseNa, agent)

test('empty', _('', 'bun'))
test('foo', _('foo', 'bun foo'))
test('run test', _('run test', 'bun run test'))
