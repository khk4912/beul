/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: any 제거하기

import type { ComponentType, ReactNode } from 'react'

import type { BeulConfig } from '../types/config.js'
import type { RouteEntry } from '../types/route.js'

export interface ThemeLayoutProps {
  title: string // 페이지 제목
  config: BeulConfig
  route: RouteEntry
  children?: ReactNode // MDX 콘텐츠
}

export interface BeulTheme {
  Layout: ComponentType<ThemeLayoutProps> // 공통 레이아웃 컴포넌트
  pages: {
    Home: ComponentType<any>
    Posts: ComponentType<any>
    Tags: ComponentType<any>
    Article: ComponentType<any>
    NotFound: ComponentType<any>
  }
  components: Record<string, ComponentType<unknown>>
}
