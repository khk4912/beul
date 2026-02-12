// 생성되는 Page들의 유형?
export type PageType = 'home' | 'posts' | 'tags' | 'article' | '404'
// home: 처음 홈페이지
// posts: 포스트 목록 페이지
// tags: 태그 목록 페이지
// 404: 404.html 페이지

export interface RouteEntry {
  filePath: string
  type: PageType
} // SSG Build시 생성되는 콘텐츠들의 metadata
