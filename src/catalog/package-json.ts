import fs from 'node:fs'

export function detectIndent(content: string): string {
  const match = content.match(/^([ \t]+)"/m)
  return match?.[1] ?? '  '
}

export function detectEol(content: string): string {
  return content.includes('\r\n') ? '\r\n' : '\n'
}

export function formatPackageJson(data: unknown, originalContent: string): string {
  const indent = detectIndent(originalContent)
  const eol = detectEol(originalContent)
  const serialized = `${JSON.stringify(data, null, indent)}\n`
  return eol === '\n' ? serialized : serialized.replaceAll('\n', eol)
}

export type DepType = 'dependencies' | 'devDependencies' | 'peerDependencies'

export function updatePackageJsonCatalogRefs(
  pkgJsonPath: string,
  entries: { name: string, catalogRef: string }[],
  depType: DepType,
): void {
  const content = fs.readFileSync(pkgJsonPath, 'utf-8')
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

  fs.writeFileSync(pkgJsonPath, formatPackageJson(data, content))
}
