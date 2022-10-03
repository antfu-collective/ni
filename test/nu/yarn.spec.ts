import { test } from 'vitest'
import { parseNu } from '../../src'
import { assertFactory } from '../assert'

const agent = 'yarn'
const _ = assertFactory(parseNu, agent)

test('empty', _('', 'yarn upgrade'))

test('interactive', _('-i', 'yarn upgrade-interactive'))

test('interactive latest', _('-i --latest', 'yarn upgrade-interactive --latest'))
