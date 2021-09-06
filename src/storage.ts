import { promises as fs, existsSync } from 'fs'
import { join } from 'path'

export interface Storage {
  lastRunCommand?: string
}

let storage: Storage | undefined

const storagePath = join(__dirname, '_storage.json')

export async function load(fn?: (storage: Storage) => Promise<boolean> | boolean) {
  if (!storage) {
    storage = existsSync(storagePath)
      ? JSON.parse(await fs.readFile(storagePath, 'utf-8')) || {}
      : {}
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
