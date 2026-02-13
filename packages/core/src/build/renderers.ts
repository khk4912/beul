import fs from 'fs-extra'
import path from 'path'
import { pathToFileURL } from 'url'
import React from 'react'

import { evaluate } from '@mdx-js/mdx'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'

import { resolvePageComponent } from './theme_handler.js'
import type { BeulTheme } from '../types/theme.js'
import type { BeulConfig } from '../types/config.js'
import type { RouteEntry } from '../types/route.js'

export interface RenderContext {
  config: BeulConfig
  contentDir: string
  outDir: string
  route: RouteEntry
  theme: BeulTheme
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

async function renderPage (context: RenderContext): Promise<string> {
  const { config, route, theme, contentDir, outDir } = context
  const source = await fs.readFile(route.filePath, 'utf-8')

  const { default: MDXContent } = await evaluate(source, {
    ...runtime,
    baseUrl: pathToFileURL(route.filePath)
  })

  const articleTitle = path.basename(route.filePath, '.mdx')
  const title = route.type === 'home'
    ? config.siteTitle
    : `${articleTitle} | ${config.siteTitle}`

  const app = React.createElement(
    theme.Layout,
    { beulConfig: config, route },
    React.createElement(
      resolvePageComponent(theme, route.type),
      { beulConfig: config, route },
      React.createElement(MDXContent, { components: theme.components })
    )
  )

  const bodyHtml = renderToStaticMarkup(app)
  const html = renderDocumentHtml(title, config.description, config.baseURL, bodyHtml)
  const outputFilePath = toOutputFilePath(outDir, contentDir, route.filePath)
  await fs.outputFile(outputFilePath, html)
  return outputFilePath
}

// TODO: 각 페이지 유형별로 별도 렌더러?
export async function renderHomePage (context: RenderContext): Promise<string> {
  return await renderPage(context)
}

export async function renderPostsPage (context: RenderContext): Promise<string> {
  return await renderPage(context)
}

export async function renderTagsPage (context: RenderContext): Promise<string> {
  return await renderPage(context)
}

export async function renderArticlePage (context: RenderContext): Promise<string> {
  return await renderPage(context)
}

export async function renderNotFoundPage (context: RenderContext): Promise<string> {
  return await renderPage(context)
}
