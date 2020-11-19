import path from 'path'
import findUp from 'find-up'
import terminalLink from 'terminal-link'
import { LOCKS, INSTALL_PAGE } from './agents'
import { getDefaultAgent } from './config'
import { cmdExists } from './utils'

export async function detect() {
  const result = await findUp(Object.keys(LOCKS))
  const agent = (result ? LOCKS[path.basename(result)] : '')

  if (!agent)
    return await getDefaultAgent()

  if (!cmdExists(agent)) {
    const url = INSTALL_PAGE[agent]
    const link = terminalLink(url, url)
    console.log(`Detected ${agent} but it doesn't seem to be installed.\nFollow the instructions to install ${agent}: ${link}`)
    process.exit(1)
  }

  return agent
}
