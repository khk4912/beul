import path from 'path'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import React from 'react'
import type { ComponentType } from 'react'

import type { BeulTheme, BeulThemeProps } from '../types/theme.js'
import type { PageType, RouteEntry } from '../types/route.js'
import type { BeulConfig } from '../types/config.js'

// Page Type
type GenericPageComponent = ComponentType<{ beulConfig: BeulConfig, route: RouteEntry, children?: React.ReactNode }>

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
    Layout: typeof layout === 'function' ? layout as ComponentType<BeulThemeProps> : fallback.Layout,
    pages: {
      Home: typeof pages.Home === 'function' ? pages.Home as ComponentType<BeulThemeProps> : fallback.pages.Home,
      Posts: typeof pages.Posts === 'function' ? pages.Posts as ComponentType<BeulThemeProps> : fallback.pages.Posts,
      Tags: typeof pages.Tags === 'function' ? pages.Tags as ComponentType<BeulThemeProps> : fallback.pages.Tags,
      Article: typeof pages.Article === 'function' ? pages.Article as ComponentType<BeulThemeProps> : fallback.pages.Article,
      NotFound: typeof pages.NotFound === 'function' ? pages.NotFound as ComponentType<BeulThemeProps> : fallback.pages.NotFound
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
 * - file://로 시작하는 경우, 해당 경로에서 직접 import 시도
 * - 그 외의 경우, require.resolve로 경로를 찾은 후 import 시도
 * - 실패할 경우, fallback 테마
 */
export async function loadTheme (themeName: string = '@beul-ssg/theme-default', cwd = process.cwd()): Promise<BeulTheme> {
  try {
    // file:// 형태일 경우, 경로 직접 import
    if (themeName.startsWith('file:')) {
      const mod = await import(themeName) as unknown
      return resolveTheme(mod)
    }

    // 그 외 경우, package.json 기반으로 require.resolve 사용
    const requireFromCwd = createRequire(path.join(cwd, 'package.json'))
    const specifier = path.isAbsolute(themeName)
      ? themeName
      : themeName.startsWith('.')
        ? path.resolve(cwd, themeName)
        : themeName
    const resolvedPath = requireFromCwd.resolve(specifier)
    const mod = await import(pathToFileURL(resolvedPath).href) as unknown

    return resolveTheme(mod)
  } catch (error) {
    console.warn(`[beul:theme] Failed to load theme "${themeName}" from "${cwd}". Falling back to built-in fallback theme.`)
    console.warn(error instanceof Error ? error.message : String(error))
    return resolveTheme({})
  }
}
