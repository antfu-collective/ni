import process from 'node:process'
import type { Choice } from '@posva/prompts'

export interface NpmPackage {
  name: string
  description: string
  version: string
  keywords: string[]
  date: string
  links: {
    npm: string
    homepage: string
    repository: string
  }
}

interface NpmRegistryResponse {
  objects: { package: NpmPackage }[]
}

export async function fetchNpmPackages(pattern: string): Promise<Choice[]> {
  const registryLink = (pattern: string) =>
        `https://registry.npmjs.com/-/v1/search?text=${pattern}&size=35`

  try {
    const result = await fetch(registryLink(pattern))
      .then(res => res.json()) as NpmRegistryResponse

    return result.objects.map(({ package: pkg }) => ({
      title: pkg.name,
      value: pkg,
      description: `${pkg.version} - ${pkg.description}`,
    }))
  }
  catch (e) {
    console.error('Error when fetching npm registry')
    process.exit(1)
  }
}
