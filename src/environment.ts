import process from 'node:process'

export interface EnvironmentOptions {
  autoInstall: boolean
}

const DEFAULT_ENVIRONMENT_OPTIONS: EnvironmentOptions = {
  autoInstall: false,
}

export function getEnvironmentOptions(): EnvironmentOptions {
  return {
    ...DEFAULT_ENVIRONMENT_OPTIONS,
    autoInstall: process.env.NI_AUTO_INSTALL === 'true',
  }
}
