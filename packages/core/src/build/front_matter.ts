import type { PostMeta } from '../types/matter.js'
import matter from 'gray-matter'

type FrontMatterParseResult = {
  frontMatter: Partial<PostMeta>
  body: string
}

export function parseFrontMatter (fileContent: string): FrontMatterParseResult {
  const result = matter(fileContent)
  const { data } = result

  if (typeof data !== 'object' || data === null) {
    return {
      frontMatter: {},
      body: result.content
    }
  }

  return {
    frontMatter: result.data,
    body: result.content
  }
}
