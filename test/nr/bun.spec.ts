import { test } from 'vitest'
import { parseNr } from '../../src'
import { assertFactory } from '../assert'

const agent = 'bun'
const _ = assertFactory(parseNr, agent)

test('empty', _('', 'bun run start'))

test('script', _('dev', 'bun run dev'))

test('script with arguments', _('build --watch -o', 'bun run build --watch -o'))

test('colon', _('build:dev', 'bun run build:dev'))
