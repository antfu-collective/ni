import path from 'path'
import findUp from 'find-up'
import { LOCKS, DEFAULT_AGENT } from './agents'

export async function detect() {
  const result = await findUp(Object.keys(LOCKS))

  if (!result)
    return DEFAULT_AGENT

  return LOCKS[path.basename(result)] || DEFAULT_AGENT
}
