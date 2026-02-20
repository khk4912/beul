import type { DocumentProps } from './types.js'

export function Document ({ title, description, baseURL, children }: DocumentProps) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta name='description' content={description} />
        <base href={baseURL} />
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  )
}
