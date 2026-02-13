import { Layout } from './Layout.js'
import { Home } from './Home.js'
import { Post } from './Post.js'

const theme = {
  Layout,
  pages: {
    Home,
    Posts: Home,
    Tags: Home,
    Article: Post,
    NotFound: Home
  },
  components: {}
}

export { Layout, Home, Post }
export default theme
