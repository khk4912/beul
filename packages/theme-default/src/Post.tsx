import React from 'react'

type PostProps = {
  title: string
  children?: React.ReactNode
}

export function Post ({ title, children }: PostProps) {
  return (
    <article className="post">
      <h2>{title}</h2>
      <section>{children}</section>
    </article>
  )
}
