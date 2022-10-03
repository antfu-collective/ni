import { test } from 'vitest'
import { parseNu } from '../../src'
import { assertFactory } from '../assert'

const agent = 'pnpm'
const _ = assertFactory(parseNu, agent)

test('empty', _('', 'pnpm update'))

test('interactive', _('-i', 'pnpm update -i'))

test('interactive latest', _('-i --latest', 'pnpm update -i --latest'))
