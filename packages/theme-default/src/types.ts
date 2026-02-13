import type { ReactNode } from 'react'

export type PageType = 'home' | 'posts' | 'tags' | 'article' | '404'

export interface BeulConfig {
  siteTitle: string
  description: string
  baseURL: string
  contentDir: string
  outDir: string
  theme: string
}

export interface RouteEntry {
  filePath: string
  type: PageType
}

export interface ThemeProps {
  beulConfig: BeulConfig
  route: RouteEntry
  children?: ReactNode
}
