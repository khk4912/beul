export interface FrontMatterBase {
  title?: string
  description?: string
  [key: string]: unknown
}

export interface ArticleMeta extends FrontMatterBase {
  date?: string
  tags?: string[]
  slug?: string
}
export type HomeMeta = FrontMatterBase
export type PostsMeta = FrontMatterBase
export type TagsMeta = FrontMatterBase
export type NotFoundMeta = FrontMatterBase
