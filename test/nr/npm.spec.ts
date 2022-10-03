import { test } from 'vitest'
import { parseNr } from '../../src'
import { assertFactory } from '../assert'

const agent = 'npm'
const _ = assertFactory(parseNr, agent)

test('empty', _('', 'npm run start'))

test('if-present', _('test --if-present', 'npm run --if-present test'))

test('script', _('dev', 'npm run dev'))

test('script with arguments', _('build --watch -o', 'npm run build -- --watch -o'))

test('colon', _('build:dev', 'npm run build:dev'))
