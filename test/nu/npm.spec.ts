import { test } from 'vitest'
import { parseNu } from '../../src'
import { assertFactory } from '../assert'

const agent = 'npm'
const _ = assertFactory(parseNu, agent)

test('empty', _('', 'npm update'))
