import { test } from 'vitest'
import { parseNu } from '../../src'
import { assertFactory } from '../assert'

const agent = 'bun'
const _ = assertFactory(parseNu, agent)

test.fails('empty', _('', null))
test.fails('interactive', _('-i', null))
test.fails('interactive latest', _('-i --latest', null))
