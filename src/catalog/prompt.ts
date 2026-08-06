import type { CatalogConfig } from './types'
import { styleText } from 'node:util'
import prompts from '@posva/prompts'

const SKIP = '__skip__'
const CREATE_NEW = '__create_new__'
const SAME_AS_PREVIOUS = '__same_as_previous__'
const APPLY_TO_REST = '__apply_to_rest__'

export interface CatalogSelection {
  catalogName: string | undefined
  /** When true, apply this selection to every remaining package without prompting again. */
  applyToRest?: boolean
}

export interface PreviousSelection {
  catalogName: string | undefined
}

export interface PromptSelectCatalogOptions {
  programmatic?: boolean
  /** The catalog chosen for the previous package via a prompt, if any. */
  previous?: PreviousSelection
  /** Whether there are further new packages that would otherwise be prompted. */
  hasRemaining?: boolean
}

function previousLabel(catalogName: string | undefined): string {
  return catalogName === undefined ? 'skip' : catalogName
}

export async function promptSelectCatalog(
  config: CatalogConfig,
  pkgName: string,
  options: PromptSelectCatalogOptions = {},
): Promise<CatalogSelection> {
  // Only default catalog: no prompt needed
  if (config.hasDefaultCatalog && !config.hasNamedCatalogs) {
    return { catalogName: 'default' }
  }

  if (options.programmatic) {
    return { catalogName: undefined }
  }

  const { previous, hasRemaining } = options

  const catalogChoices = config.catalogs.map(c => ({
    title: c.name,
    value: c.name,
  }))

  // When a previous package was already assigned via a prompt, surface shortcuts
  // at the top so the user doesn't have to re-pick the same catalog every time.
  const shortcutChoices: { title: string, value: string }[] = []
  if (previous) {
    const label = previousLabel(previous.catalogName)
    shortcutChoices.push({
      title: `${label} ${styleText('dim', '(same as previous)')}`,
      value: SAME_AS_PREVIOUS,
    })
    if (hasRemaining) {
      shortcutChoices.push({
        title: `${label} ${styleText('dim', '(apply to all remaining)')}`,
        value: APPLY_TO_REST,
      })
    }
  }

  const { catalog } = await prompts({
    type: 'select',
    name: 'catalog',
    message: `select catalog for ${styleText('yellow', pkgName)}`,
    choices: [
      ...shortcutChoices,
      ...catalogChoices,
      { title: styleText('dim', 'create new catalog'), value: CREATE_NEW },
      { title: styleText('dim', 'skip (install without catalog)'), value: SKIP },
    ],
  })

  if (catalog === undefined || catalog === SKIP) {
    return { catalogName: undefined }
  }

  if (catalog === SAME_AS_PREVIOUS) {
    return { catalogName: previous!.catalogName }
  }

  if (catalog === APPLY_TO_REST) {
    return { catalogName: previous!.catalogName, applyToRest: true }
  }

  if (catalog === CREATE_NEW) {
    const newName = await promptNewCatalogName()
    return { catalogName: newName }
  }

  return { catalogName: catalog }
}

async function promptNewCatalogName(): Promise<string | undefined> {
  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'new catalog name',
  })
  return name || undefined
}
