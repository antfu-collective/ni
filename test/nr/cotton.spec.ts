import { test } from 'vitest'
import { parseNr } from '../../src'
import { assertFactory } from '../assert'

const agent = 'cotton'
const _ = assertFactory(parseNr, agent)

test('empty', _('start', 'cotton run start'))

test('script', _('dev', 'cotton run dev'))

test('script with arguments', _('build --watch -o', 'cotton run build --watch -o'))

test('colon', _('build:dev', 'cotton run build:dev'))
