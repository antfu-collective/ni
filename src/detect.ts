import path from 'path'
import findUp from 'find-up'
import { LOCKS } from './agents'
import { getDefaultAgent } from './config'

export async function detect() {
  const result = await findUp(Object.keys(LOCKS))

  return (result ? LOCKS[path.basename(result)] : '') || await getDefaultAgent()
}
