import fs from 'node:fs'
import path from 'node:path'

export function findClosestPackageJson(cwd: string): string | null {
  let dir = path.resolve(cwd)
  while (true) {
    const filePath = path.join(dir, 'package.json')
    if (fs.existsSync(filePath))
      return filePath
    const parent = path.dirname(dir)
    if (parent === dir)
      return null
    dir = parent
  }
}

function detectIndent(content: string): string {
  const match = content.match(/^(\s+)"/m)
  return match?.[1] ?? '  '
}

export type DepType = 'dependencies' | 'devDependencies' | 'peerDependencies'

export function updatePackageJsonCatalogRefs(
  pkgJsonPath: string,
  entries: { name: string, catalogRef: string }[],
  depType: DepType,
): void {
  const content = fs.readFileSync(pkgJsonPath, 'utf-8')
  const indent = detectIndent(content)
  const data = JSON.parse(content)

  if (!data[depType])
    data[depType] = {}

  for (const entry of entries) {
    data[depType][entry.name] = entry.catalogRef
  }

  const sorted: Record<string, string> = {}
  for (const key of Object.keys(data[depType]).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = data[depType][key]
  }
  data[depType] = sorted

  fs.writeFileSync(pkgJsonPath, `${JSON.stringify(data, null, indent)}\n`)
}
