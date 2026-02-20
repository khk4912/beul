import matter from 'gray-matter'
import type { ArticleMeta, FrontMatterBase } from '../types/matter.js'

type FrontMatterParseResult = {
  frontMatter: Record<string, unknown>
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

export function toArticleMeta (raw: unknown): ArticleMeta {
  if (!isRecord(raw)) return {}

  const meta: ArticleMeta = {}

  const title = asString(raw.title)
  const description = asString(raw.description)
  const date = asString(raw.date)
  const tags = asStringArray(raw.tags)
  const slug = asString(raw.slug)

  if (title !== undefined) meta.title = title
  if (description !== undefined) meta.description = description
  if (date !== undefined) meta.date = date
  if (tags !== undefined) meta.tags = tags
  if (slug !== undefined) meta.slug = slug

  return meta
}

export function toBaseMeta (raw: unknown): FrontMatterBase {
  if (!isRecord(raw)) return {}

  const meta: FrontMatterBase = {}

  const title = asString(raw.title)
  const description = asString(raw.description)

  if (title !== undefined) meta.title = title
  if (description !== undefined) meta.description = description

  return meta
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString (value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function asStringArray (value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '')

  return items.length > 0 ? items : undefined
}
