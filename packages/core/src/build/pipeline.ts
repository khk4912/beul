import fs from 'fs-extra'
import path from 'path'

import { loadConfig } from '../config.js'
import { loadTheme } from '../theme_handler.js'
import type { PageType, RouteEntry } from '../types/route.js'
import {
  renderArticlePage,
  renderHomePage,
  renderNotFoundPage,
  renderPostsPage,
  renderTagsPage,
  type RenderContext
} from './renderers.js'

// 파일 경로로 페이지 유형 검증
function resolveTypeFromPath (relativePath: string): PageType {
  const normalizedPath = relativePath.replace(/\\/g, '/')
  const fileName = path.basename(normalizedPath, path.extname(normalizedPath))

  if (normalizedPath === 'index.mdx') return 'home'
  if (normalizedPath === 'posts/index.mdx') return 'posts'
  if (normalizedPath === 'tags/index.mdx') return 'tags'
  if (normalizedPath === '404.mdx') return '404'
  if (normalizedPath.startsWith('posts/') && fileName !== 'index') return 'article'
  return 'article'
}

/**
 * 재귀적으로 디렉토리를 탐색, .mdx 확장자의 파일을 수집합니다.
 *
 * @param {string} dir 탐색할 디렉토리 경로
 * @returns {Promise<string[]>} .mdx 파일들의 배열
 */
async function collectMDXFiles (dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const mdxFiles: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nestedFiles = await collectMDXFiles(fullPath)
      mdxFiles.push(...nestedFiles)
      continue
    }
    if (entry.isFile() && path.extname(entry.name) === '.mdx') {
      mdxFiles.push(fullPath)
    }
  }

  return mdxFiles
}

function buildRoutes (contentDir: string, files: string[]): RouteEntry[] {
  return files.map((filePath) => {
    const relativePath = path.relative(contentDir, filePath)
    return {
      filePath,
      type: resolveTypeFromPath(relativePath)
    }
  })
}

export interface BuildResult {
  successCount: number
  failCount: number
}

/**
 * Build the static site based on the configuration and content files.
 * This function processes MDX files, converts them to HTML, and outputs them
 * to the specified output directory.
 *
 * @returns {Promise<{successCount: number, failCount: number}>} The number of successfully built pages and failed builds.
*/
export async function runBuildPipeline (): Promise<BuildResult> {
  const config = await loadConfig()

  const cwd = process.cwd()
  const contentDir = path.resolve(cwd, config.contentDir)
  const outDir = path.resolve(cwd, config.outDir)

  await fs.emptyDir(outDir)

  const theme = await loadTheme(config.theme, cwd)
  const mdxFiles = await collectMDXFiles(contentDir)
  const routes = buildRoutes(contentDir, mdxFiles)

  let successCount = 0
  let failCount = 0

  for (const route of routes) {
    try {
      const renderContext: RenderContext = {
        config,
        contentDir,
        outDir,
        route,
        theme
      }

      let outputFilePath = ''
      switch (route.type) {
        case 'home':
          outputFilePath = await renderHomePage(renderContext)
          break
        case 'posts':
          outputFilePath = await renderPostsPage(renderContext)
          break
        case 'tags':
          outputFilePath = await renderTagsPage(renderContext)
          break
        case 'article':
          outputFilePath = await renderArticlePage(renderContext)
          break
        case '404':
          outputFilePath = await renderNotFoundPage(renderContext)
          break
      }

      console.log(`[beul:build] Built [${route.type}]: ${outputFilePath}`)
      successCount += 1
    } catch (error) {
      failCount += 1
      console.error(`[beul:build] Failed: ${route.filePath}`)
      console.error(error instanceof Error ? error.message : String(error))
    }
  }

  console.log(`[beul:build] Done. success=${successCount}, failed=${failCount}`)
  return { successCount, failCount }
}
