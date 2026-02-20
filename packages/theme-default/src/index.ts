import { Document } from './Document.js'
import { Layout } from './Layout.js'
import { Home } from './Home.js'
import { Article } from './Article.js'

const theme = {
  Document,
  Layout,
  pages: {
    Home,
    Posts: Home,
    Tags: Home,
    Article: Article,
    NotFound: Home
  },
  components: {}
}

export { Document, Layout, Home, Article }
export default theme
