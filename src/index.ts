import fs from 'fs-extra'
import path from 'path'

import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const OUTPUT_DIR = path.join(process.cwd(), 'dist')

async function build () {
  await fs.emptyDir(OUTPUT_DIR)

  const files = await fs.readdir(CONTENT_DIR)

  for (const file of files) {
    if (path.extname(file) !== '.mdx') continue

    const filePath = path.join(CONTENT_DIR, file)
    const source = await fs.readFile(filePath, 'utf-8')

    const { default: MDXContent } = await evaluate(source, {
      ...runtime
    })

    const element = React.createElement(MDXContent, {})
    const html = renderToStaticMarkup(element)

    const output = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${path.basename(file, '.mdx')}</title>
        </head>
        <body>
            ${html}
        </body>
        </html>`

    const outputFilePath = path.join(OUTPUT_DIR, `${path.basename(file, '.mdx')}.html`)
    await fs.outputFile(outputFilePath, output)

    console.log(`Built: ${outputFilePath}`)
  }
}

build().catch(console.error)
