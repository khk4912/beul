// TODO: any 제거하기

import type { ComponentType, ReactNode } from 'react'

import type { BeulConfig } from '../types/config.js'
import type { RouteEntry } from '../types/route.js'

export interface BeulDocumentProps {
  title: string
  description: string
  baseURL: string
  children?: ReactNode
}

export interface BeulThemeProps {
  beulConfig: BeulConfig
  route: RouteEntry
  children?: ReactNode
}

export interface ArticleProps extends BeulThemeProps {
  title?: string
  description?: string
  date?: string
  tags?: string[]
  slug?: string
  content?: ReactNode
}

export interface BeulTheme {
  Document: ComponentType<BeulDocumentProps>
  Layout: ComponentType<BeulThemeProps> // 공통 레이아웃 컴포넌트
  pages: {
    Home: ComponentType<BeulThemeProps>
    Posts: ComponentType<BeulThemeProps>
    Tags: ComponentType<BeulThemeProps>
    Article: ComponentType<ArticleProps>
    NotFound: ComponentType<BeulThemeProps>
  }
  components: Record<string, ComponentType<unknown>>
}
