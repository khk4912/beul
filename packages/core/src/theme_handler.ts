import path from 'path'
import React from 'react'
import type { ComponentType } from 'react'

import type { BeulTheme, ThemeLayoutProps } from './types/theme.js'
import type { PageType } from './types/route.js'

// Page Type
type GenericPageComponent = ComponentType<{ children?: React.ReactNode }>

function createFallbackPage (): GenericPageComponent {
  return ({ children }) => React.createElement(React.Fragment, null, children)
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * 테마를 불러온 후, BeulTheme 객체로 변환합니다.
 *
 * 만약 테마가 올바르지 않으면,
 * fallback으로 children만 렌더합니다.
 *
 * @param mod 불러온 모듈
 * @returns BeulTheme 객체
 */
function resolveTheme (mod: unknown): BeulTheme {
  const fallbackPage = createFallbackPage()
  const fallback: BeulTheme = {
    Layout: ({ children }) => React.createElement(React.Fragment, null, children),
    pages: {
      Home: fallbackPage,
      Posts: fallbackPage,
      Tags: fallbackPage,
      Article: fallbackPage,
      NotFound: fallbackPage
    },
    components: {}
  }

  if (!isRecord(mod)) return fallback
  const root = isRecord(mod.default) ? mod.default : mod

  const layout = root.Layout
  const pages = isRecord(root.pages) ? root.pages : {}
  const components = root.components

  return {
    Layout: typeof layout === 'function' ? layout as ComponentType<ThemeLayoutProps> : fallback.Layout,
    pages: {
      Home: typeof pages.Home === 'function' ? pages.Home as GenericPageComponent : fallback.pages.Home,
      Posts: typeof pages.Posts === 'function' ? pages.Posts as GenericPageComponent : fallback.pages.Posts,
      Tags: typeof pages.Tags === 'function' ? pages.Tags as GenericPageComponent : fallback.pages.Tags,
      Article: typeof pages.Article === 'function' ? pages.Article as GenericPageComponent : fallback.pages.Article,
      NotFound: typeof pages.NotFound === 'function' ? pages.NotFound as GenericPageComponent : fallback.pages.NotFound
    },
    components: isRecord(components) ? components as Record<string, ComponentType<unknown>> : {}
  }
}

/**
 * pageType (route.type)에 해당하는 페이지 컴포넌트를 반환합니다.
 * @param theme
 * @param pageType
 * @returns
 */
export function resolvePageComponent (theme: BeulTheme, pageType: PageType): GenericPageComponent {
  if (pageType === 'home') return theme.pages.Home
  if (pageType === 'posts') return theme.pages.Posts
  if (pageType === 'tags') return theme.pages.Tags
  if (pageType === '404') return theme.pages.NotFound
  return theme.pages.Article
}

/**
 * 테마를 불러옵니다.
 */
export async function loadTheme (themeName: string = '@beul-ssg/theme-default', cwd = process.cwd()): Promise<BeulTheme> {
  try {
    const mod = await import(themeName) as unknown
    return resolveTheme(mod)
  } catch {
    const localThemePath = path.resolve(cwd, themeName)
    try {
      const mod = await import(localThemePath) as unknown
      return resolveTheme(mod)
    } catch {
      return resolveTheme({})
    }
  }
}
