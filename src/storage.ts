import { existsSync, promises as fs } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

export interface Storage {
  lastRunCommand?: string
}

let storage: Storage | undefined

const storagePath = resolve(fileURLToPath(import.meta.url), '../_storage.json')

export async function load(fn?: (storage: Storage) => Promise<boolean> | boolean) {
  if (!storage) {
    storage = {}
    if (existsSync(storagePath)) {
      const data = await fs.readFile(storagePath, 'utf-8')
      storage = data && JSON.parse(data)
    }
  }

  if (fn) {
    if (await fn(storage!))
      await dump()
  }

  return storage!
}

export async function dump() {
  if (storage)
    await fs.writeFile(storagePath, JSON.stringify(storage), 'utf-8')
}
