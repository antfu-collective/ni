import { test } from 'vitest'
import { parseNr } from '../../src'
import { assertFactory } from '../assert'

const agent = 'pnpm'
const _ = assertFactory(parseNr, agent)

test('empty', _('', 'pnpm run start'))

test('if-present', _('test --if-present', 'pnpm run --if-present test'))

test('script', _('dev', 'pnpm run dev'))

test('script with arguments', _('build --watch -o', 'pnpm run build --watch -o'))

test('colon', _('build:dev', 'pnpm run build:dev'))
