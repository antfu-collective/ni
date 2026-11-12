import type { LastCommandMode } from './config'
import { existsSync, promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { CLI_TEMP_DIR, getTerminalId, writeFileSafe } from './utils'

export interface Storage {
  lastRunCommand?: string
}

/**
 * The key of the file this terminal writes to, `undefined` for the shared file.
 */
export function getStorageKey(mode: LastCommandMode): string | undefined {
  return mode === 'terminal' ? getTerminalId() : undefined
}

/**
 * A file per terminal means concurrent `nr` never merge records, so the race
 * fixed in #147 cannot happen. The files are tiny and the system's temp
 * cleanup takes care of them.
 */
function storagePath(key?: string): string {
  return resolve(CLI_TEMP_DIR, key ? `_storage.${key}.json` : '_storage.json')
}

export async function load(key?: string): Promise<Storage> {
  const path = storagePath(key)
  if (!existsSync(path))
    return {}

  try {
    return JSON.parse((await fs.readFile(path, 'utf-8')) || '{}') || {}
  }
  catch {
    // A corrupt record must not break the command
    return {}
  }
}

export async function dump(storage: Storage, key?: string): Promise<void> {
  await writeFileSafe(storagePath(key), JSON.stringify(storage))
}
