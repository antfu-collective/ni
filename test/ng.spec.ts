import { expect, it } from 'vitest'
import { getCommand } from '../src/commands'

it('wrong agent', () => {
  expect(() => {
    getCommand('idk' as any, 'install', [])
  }).toThrow('Unsupported agent "idk"')
})
