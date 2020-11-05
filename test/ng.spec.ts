import test from 'ava'
import { getCommand } from '../src/commands'

test('wrong agent', (t) => {
  t.throws(() => {
    getCommand('idk' as any, 'install', [])
  }, { message: 'Unsupported agent "idk"' })
})
