import fs from 'fs-extra'
import path from 'path'
import { pathToFileURL } from 'url'
import React from 'react'
import type { ComponentType } from 'react'

import { evaluate } from '@mdx-js/mdx'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'

import { resolvePageComponent } from './theme_handler.js'
import type { BeulTheme } from '../types/theme.js'
import type { BeulConfig } from '../types/config.js'
import type { RouteEntry } from '../types/route.js'
import type { ArticleMeta } from '../types/matter.js'
import { parseFrontMatter, toArticleMeta } from './front_matter.js'

export interface RenderContext {
  config: BeulConfig
  contentDir: string
  outDir: string
  route: RouteEntry
  theme: BeulTheme
}

type MdxContentProps = {
  components?: Record<string, ComponentType<unknown>>
}

type MdxContentComponent = ComponentType<MdxContentProps>

interface LoadedMdxContent {
  articleMeta: ArticleMeta
  MDXContent: MdxContentComponent
}

interface RenderPageOptions {
  title: string
  pageProps?: Record<string, unknown>
  MDXContent: MdxContentComponent
}

function toOutputFilePath (outDir: string, contentDir: string, filePath: string): string {
  const relativePath = path.relative(contentDir, filePath)
  const htmlPath = relativePath.replace(/\.mdx$/, '.html')
  return path.join(outDir, htmlPath)
}

async function loadMdxContent (filePath: string): Promise<LoadedMdxContent> {
  const source = await fs.readFile(filePath, 'utf-8')
  const { frontMatter, body } = parseFrontMatter(source)
  const articleMeta = toArticleMeta(frontMatter)

  const evaluated = await evaluate(body, {
    ...runtime,
    baseUrl: pathToFileURL(filePath)
  })
  const MDXContent = evaluated.default as MdxContentComponent

  return { articleMeta, MDXContent }
}

async function renderPageToFile (context: RenderContext, options: RenderPageOptions): Promise<string> {
  const { config, route, theme, contentDir, outDir } = context
  const { title, pageProps, MDXContent } = options

  const app = React.createElement(
    theme.Layout,
    { beulConfig: config, route },
    React.createElement(
      resolvePageComponent(theme, route.type),
      {
        beulConfig: config,
        route,
        ...(pageProps ?? {})
      },
      React.createElement(MDXContent, { components: theme.components })
    )
  )

  const document = React.createElement(
    theme.Document,
    {
      title,
      description: config.description,
      baseURL: config.baseURL
    },
    app
  )
  const html = '<!DOCTYPE html>\n' + renderToStaticMarkup(document)
  const outputFilePath = toOutputFilePath(outDir, contentDir, route.filePath)

  await fs.outputFile(outputFilePath, html)
  return outputFilePath
}

async function renderDefaultPage (context: RenderContext): Promise<string> {
  const { articleMeta, MDXContent } = await loadMdxContent(context.route.filePath)
  const articleTitle = articleMeta.title ?? path.basename(context.route.filePath, '.mdx')
  const title = context.route.type === 'home'
    ? context.config.siteTitle
    : `${articleTitle} | ${context.config.siteTitle}`
  return await renderPageToFile(context, { title, MDXContent })
}

// TODO: 각 페이지 유형별로 별도 렌더러?
export async function renderHomePage (context: RenderContext): Promise<string> {
  return await renderDefaultPage(context)
}

export async function renderPostsPage (context: RenderContext): Promise<string> {
  return await renderDefaultPage(context)
}

export async function renderTagsPage (context: RenderContext): Promise<string> {
  return await renderDefaultPage(context)
}

export async function renderArticlePage (context: RenderContext): Promise<string> {
  const { articleMeta, MDXContent } = await loadMdxContent(context.route.filePath)

  const title = articleMeta.title ?? path.basename(context.route.filePath, '.mdx')
  const date = articleMeta.date ?? (await fs.stat(context.route.filePath)).mtime.toISOString()

  return await renderPageToFile(context, {
    title,
    pageProps: { ...articleMeta, date },
    MDXContent
  })
}

export async function renderNotFoundPage (context: RenderContext): Promise<string> {
  return await renderDefaultPage(context)
}
