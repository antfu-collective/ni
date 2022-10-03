import { test } from 'vitest'
import { parseNi } from '../../src'
import { assertFactory } from '../assert'

const agent = 'cotton'
const _ = assertFactory(parseNi, agent)

test('empty', _('', 'cotton install'))
