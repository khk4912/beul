import { runBuildPipeline } from './pipeline.js'
import type { BuildOptions } from './pipeline.js'
import type { BeulConfig } from '../types/config.js'

/**
 * Beul 빌드 entrypoint
 */
type BuildParams = {
  configPath?: string
  overwrites?: Partial<BeulConfig>
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
