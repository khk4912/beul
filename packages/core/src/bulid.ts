import fs from 'fs-extra'
import path from 'path'
import { pathToFileURL } from 'url'
import React from 'react'

import { evaluate } from '@mdx-js/mdx'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'

import { loadConfig } from './config.js'
import { loadTheme, resolvePageComponent } from './theme_handler.js'
import type { PageType, RouteEntry } from './types/route.js'

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

function toOutputFilePath (outDir: string, contentDir: string, filePath: string): string {
  const relativePath = path.relative(contentDir, filePath)
  const htmlPath = relativePath.replace(/\.mdx$/, '.html')
  return path.join(outDir, htmlPath)
}

function renderDocumentHtml (title: string, description: string, baseURL: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <base href="${baseURL}">
  <title>${title}</title>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

/**
 * Build the static site based on the configuration and content files.
 * This function processes MDX files, converts them to HTML, and outputs them
 * to the specified output directory.
 *
 * @returns {Promise<{successCount: number, failCount: number}>} The number of successfully built pages and failed builds.
*/
async function build () {
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
      const source = await fs.readFile(route.filePath, 'utf-8')
      const { default: MDXContent } = await evaluate(source, {
        ...runtime,
        baseUrl: pathToFileURL(route.filePath)
      })

      const articleTitle = path.basename(route.filePath, '.mdx')

      // 현재로는 home 페이지에선 siteTitle, article에선 articleTitle | siteTitle 형태 생성
      // FIXME: 추후 페이지 유형별 세분화, 커스터마이징
      const title = route.type === 'home'
        ? config.siteTitle
        : `${articleTitle} | ${config.siteTitle}`

      // React 요소 생성 및 HTML 렌더링
      const app = React.createElement(
        theme.Layout,
        { title, config, route },
        React.createElement(
          resolvePageComponent(theme, route.type),
          null,
          React.createElement(MDXContent, { components: theme.components })
        )
      )

      const bodyHtml = renderToStaticMarkup(app)
      const html = renderDocumentHtml(title, config.description, config.baseURL, bodyHtml)
      const outputFilePath = toOutputFilePath(outDir, contentDir, route.filePath)
      await fs.outputFile(outputFilePath, html)

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

export { build }
