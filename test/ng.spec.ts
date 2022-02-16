import { test, expect } from 'vitest'
import { getCommand } from '../src/commands'

test('wrong agent', () => {
  expect(() => {
    getCommand('idk' as any, 'install', [])
  }).toThrow('Unsupported agent "idk"')
})
