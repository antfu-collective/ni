import { test } from 'vitest'
import { parseNa } from '../../src'
import { assertFactory } from '../assert'

const agent = 'yarn'
const _ = assertFactory(parseNa, agent)

test('empty', _('', 'yarn'))
test('foo', _('foo', 'yarn foo'))
test('run test', _('run test', 'yarn run test'))
