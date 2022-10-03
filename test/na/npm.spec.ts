import { test } from 'vitest'
import { parseNa } from '../../src'
import { assertFactory } from '../assert'

const agent = 'npm'
const _ = assertFactory(parseNa, agent)

test('empty', _('', 'npm'))
test('foo', _('foo', 'npm foo'))
test('run test', _('run test', 'npm run test'))
