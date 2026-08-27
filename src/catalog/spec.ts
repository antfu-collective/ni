export interface PackageSpec {
  /** The argument exactly as typed by the user, e.g. `vite@^7.0.0`. */
  raw: string
  /** The bare package name, e.g. `vite` or `@vitejs/plugin-vue`. */
  name: string
  /** The version specifier following the separating `@`, when one was given. */
  spec?: string
}

// Scoped packages start with `@`, so the separator is the *next* `@`.
export function parsePackageSpec(raw: string): PackageSpec {
  const separator = raw.indexOf('@', raw.startsWith('@') ? 1 : 0)
  if (separator <= 0)
    return { raw, name: raw }

  const spec = raw.slice(separator + 1)
  if (!spec)
    return { raw, name: raw.slice(0, separator) }

  return { raw, name: raw.slice(0, separator), spec }
}

const SEMVER_RANGE_RE = /^\s*(?:(?:\|\||[~^=]|[<>]=?)\s*)?v?\d/

/**
 * Whether a specifier already describes a version and should be recorded in the
 * catalog verbatim, rather than being resolved against the registry.
 */
export function isVerbatimSpec(spec: string): boolean {
  // Wildcards.
  if (spec === '*' || spec === 'x' || spec === 'X')
    return true
  // Protocol specifiers (`npm:`, `workspace:`, `file:`, `github:`, urls, …):
  // there is no registry version to look up.
  if (spec.includes(':'))
    return true
  // Ranges and exact pins: `1.2.3`, `^1.2`, `~1`, `>=1.2.3`, `v1.2.3`.
  return SEMVER_RANGE_RE.test(spec)
}
