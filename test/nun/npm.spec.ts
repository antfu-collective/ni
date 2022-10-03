import { test } from 'vitest'
import { parseNun } from '../../src'
import { assertFactory } from '../assert'

const agent = 'npm'
const _ = assertFactory(parseNun, agent)

test('single uninstall', _('axios', 'npm uninstall axios'))

test('multiple', _('eslint @types/node', 'npm uninstall eslint @types/node'))

test('-D', _('eslint @types/node -D', 'npm uninstall eslint @types/node -D'))

test('global', _('eslint -g', 'npm uninstall -g eslint'))
