import type { ArticleProps } from './types.js'

export function Article ({ children, title, description, date, tags }: ArticleProps) {
  return <>
    <article> 
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {date && <p><em>{date}</em></p>}
      {tags && tags.length > 0 && (
        <ul>
          {tags.map(tag => <li key={tag}>{tag}</li>)}
        </ul>
      )}
      {children}  
    </article>
  </>

}
