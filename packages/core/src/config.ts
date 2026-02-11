import fs from 'fs/promises'
import path from 'path'

import { createJiti } from 'jiti'
import type { BeulConfig } from './types/config.ts'

// 기본 설정
const DEFAULT_CONFIG: BeulConfig = {
  siteTitle: 'My Beul Blog',
  description: 'A blog powered by Beul',
  baseURL: '/',
  contentDir: 'contents',
  outDir: 'dist',
  theme: '@beul-ssg/theme-default',
}

const CONFIG_FILE_CANDIDATES = [
  'beul.config.ts',
  'beul.config.mts',
  'beul.config.js',
  'beul.config.mjs',
] as const

const isTS = (fileName: string) =>
  fileName.endsWith('.ts') || fileName.endsWith('.mts')

export function defineConfig (config: BeulConfig) {
  return { ...DEFAULT_CONFIG, ...config }
}

export async function loadConfig (cwd = process.cwd()): Promise<BeulConfig> {
  const configPath = await findConfig(cwd)
  if (configPath === null) { return DEFAULT_CONFIG }

  const ts = isTS(configPath)

  if (ts) { return await loadTSConfig(configPath) ?? DEFAULT_CONFIG }
  return await loadJSConfig(configPath) ?? DEFAULT_CONFIG
}

async function findConfig (cwd: string): Promise<string | null> {
  for (const fn of CONFIG_FILE_CANDIDATES) {
    const fullPath = path.join(cwd, fn)
    try {
      await fs.access(fullPath)
      return fullPath
    } catch { }
  }
  return null
}

async function loadTSConfig (configPath: string): Promise<BeulConfig> {
  const jiti = createJiti(path.dirname(configPath), {})
  const imp = await jiti.import(configPath)

  if (!imp) {
    throw new Error(`Failed to load config file: ${configPath}`)
  }

  if (!imp || typeof imp !== 'object' || !('default' in imp)) {
    return DEFAULT_CONFIG
  }

  const { default: config } = imp

  if (!isBeulConfig(config)) {
    throw new Error(`Invalid Beul config file: ${configPath}`)
  }

  return { ...DEFAULT_CONFIG, ...config }
}

async function loadJSConfig (configPath: string): Promise<BeulConfig> {
  const imp: unknown = await import(configPath)
  if (!imp || typeof imp !== 'object' || !('default' in imp)) {
    return DEFAULT_CONFIG
  }

  const { default: config } = imp

  if (!isBeulConfig(config)) {
    throw new Error(`Invalid Beul config file: ${configPath}`)
  }
  return { ...DEFAULT_CONFIG, ...config }
}

function isBeulConfig (obj: unknown): obj is BeulConfig {
  if (typeof obj !== 'object' || obj === null) return false

  const allowedKeys = ['siteTitle', 'description', 'baseURL', 'contentDir', 'outDir', 'theme']

  // allowedKeys 중 아무것도 없으면 false
  if (!allowedKeys.some(key => key in obj)) return false
  return true
}
