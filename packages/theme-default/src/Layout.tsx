import React from 'react'

type LayoutProps = {
  title?: string
  children?: React.ReactNode
}

export function Layout ({ title, children }: LayoutProps) {
  return (
    <div className="layout">
      {title ? <h1>{title}</h1> : null}
      <main>{children}</main>
    </div>
  )
}
