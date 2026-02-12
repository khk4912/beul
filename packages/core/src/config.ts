import fs from 'fs/promises'
import path from 'path'

import { createJiti } from 'jiti'
import type { BeulConfig } from './types/config.ts'
import { ConfigNotFound } from './errors/config.js'

// 기본 설정
const DEFAULT_CONFIG: BeulConfig = {
  siteTitle: 'My Beul Blog',
  description: 'A blog powered by Beul',
  baseURL: '/',
  contentDir: 'contents',
  outDir: 'dist',
  theme: '@beul-ssg/theme-default',
}
const CONFIG_KEYS: readonly (keyof BeulConfig)[] = ['siteTitle', 'description', 'baseURL', 'contentDir', 'outDir', 'theme'] as const
const CONFIG_FILE_CANDIDATES = [
  'beul.config.ts',
  'beul.config.mts',
  'beul.config.js',
  'beul.config.mjs',
] as const

const isTS = (fileName: string) =>
  fileName.endsWith('.ts') || fileName.endsWith('.mts')

const logConfigWarning = (message: string) => {
  console.warn(`[beul:config] ${message}`)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const extractConfigExport = (mod: unknown): unknown => {
  if (!isPlainObject(mod)) return mod
  return 'default' in mod ? mod.default : mod
}

function normalizeConfig (raw: unknown, configPath: string): BeulConfig {
  if (!isPlainObject(raw)) {
    logConfigWarning(`Invalid config format in "${configPath}". Expected object export. Falling back to defaults.`)
    return { ...DEFAULT_CONFIG }
  }

  const normalized: Partial<BeulConfig> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!CONFIG_KEYS.includes(key as typeof CONFIG_KEYS[number])) {
      logConfigWarning(`Unknown key "${key}" in "${configPath}". This key will be ignored.`)
      continue
    }

    if (typeof value !== 'string') {
      logConfigWarning(`Key "${key}" in "${configPath}" must be a string. This value will be ignored.`)
      continue
    }

    normalized[key as keyof BeulConfig] = value
  }

  return { ...DEFAULT_CONFIG, ...normalized }
}
/**
 * Utility function to define Beul configuration with type safety.
 *
 * @param {Partial<BeulConfig>} config Beul configuration object
 * @example
 * ```ts
 * import { defineConfig } from '@beul-ssg/core'
 *
 * export default defineConfig({
 *  siteTitle: 'My Beul Blog',
 *  description: 'A blog powered by Beul',
 * })
 * ```
 */
export function defineConfig (config: Partial<BeulConfig>): Partial<BeulConfig> {
  return config
}

export async function loadConfig (cwd = process.cwd()): Promise<BeulConfig> {
  const configPath = await findConfig(cwd)
  const ts = isTS(configPath)

  if (ts) { return await loadTSConfig(configPath) }
  return await loadJSConfig(configPath)
}

async function findConfig (cwd: string): Promise<string> {
  for (const fn of CONFIG_FILE_CANDIDATES) {
    const fullPath = path.join(cwd, fn)
    try {
      await fs.access(fullPath)
      return fullPath
    } catch { }
  }
  throw new ConfigNotFound(`Cannot find config file in ${cwd}. Forgot to create beul.config.ts / beul.config.js?`)
}

// TS일 경우 jiti
async function loadTSConfig (configPath: string): Promise<BeulConfig> {
  try {
    const jiti = createJiti(path.dirname(configPath), {})
    const mod = await jiti.import(configPath)
    const config = extractConfigExport(mod)
    return normalizeConfig(config, configPath)
  } catch (error) {
    logConfigWarning(`Failed to load "${configPath}". Falling back to defaults.`)
    if (error instanceof Error) {
      logConfigWarning(error.message)
    } else {
      logConfigWarning(String(error))
    }
    return { ...DEFAULT_CONFIG }
  }
}

// JS일 경우 dynamic import
async function loadJSConfig (configPath: string): Promise<BeulConfig> {
  try {
    const mod: unknown = await import(configPath)
    const config = extractConfigExport(mod)
    return normalizeConfig(config, configPath)
  } catch (error) {
    logConfigWarning(`Failed to load "${configPath}". Falling back to defaults.`)
    if (error instanceof Error) {
      logConfigWarning(error.message)
    } else {
      logConfigWarning(String(error))
    }
    return { ...DEFAULT_CONFIG }
  }
}
