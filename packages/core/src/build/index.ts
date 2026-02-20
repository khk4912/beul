import { runBuildPipeline, type BuildOptions } from './pipeline.js'
import type { BeulConfig } from '../types/config.js'

/**
 * Beul 빌드 entrypoint
 */
type BuildParams = {
  configPath?: string | undefined
  overwrites?: Partial<BeulConfig> | undefined
}
export async function build ({
  configPath,
  overwrites
}: BuildParams = {}): Promise<void> {
  const options: BuildOptions = {}

  if (overwrites !== undefined) options.overwrites = overwrites
  if (configPath !== undefined) options.configPath = configPath

  await runBuildPipeline(options)
}
