import type { Command } from 'package-manager-detector/agents'
import { COMMANDS } from 'package-manager-detector/agents'

export const agentsCommands = Object.keys(COMMANDS) as Command[]
