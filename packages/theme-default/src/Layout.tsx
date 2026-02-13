import type { ThemeProps } from './types.js'
import styles from './theme.css?raw'

const THEME_SCRIPT = `(function () {
  var STORAGE_KEY = 'beul-theme';
  var root = document.documentElement;

  function detectTheme() {
    var saved = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch (_) {}

    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var button = document.getElementById('theme-toggle');
    if (button) button.textContent = theme === 'dark' ? 'Light' : 'Dark';
  }

  applyTheme(detectTheme());

  var button = document.getElementById('theme-toggle');
  if (!button) return;

  button.addEventListener('click', function () {
    var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  });
}());`

function getPageTitle ({ route }: ThemeProps): string {
  if (route.type === 'home') return 'Home'
  if (route.type === 'posts') return 'Posts'
  if (route.type === 'tags') return 'Tags'
  if (route.type === '404') return 'Not Found'
  const normalizedPath = route.filePath.replace(/\\/g, '/')
  const lastSegment = normalizedPath.split('/').pop() ?? ''
  const fileName = lastSegment.replace(/\.mdx$/, '')
  return fileName.replace(/[-_]/g, ' ')
}

export function Layout ({ beulConfig, route, children }: ThemeProps) {
  const pageTitle = getPageTitle({ beulConfig, route })

  return (
    <>
      <style>{styles}</style>
      <header className='site-header'>
        <div className='container site-header-inner'>
          <h1 className='brand'>
            <a href='./'>{beulConfig.siteTitle}</a>
          </h1>
          <nav className='site-nav' aria-label='Global'>
            <a href='./'>Home</a>
            <a href='posts/'>Posts</a>
            <a href='tags/'>Tags</a>
            <button id='theme-toggle' type='button' className='theme-toggle' aria-label='Toggle color mode'>Dark</button>
          </nav>
        </div>
      </header>
      <main className='container content'>
        {route.type !== 'home' ? <h2 className='page-title'>{pageTitle}</h2> : null}
        <div className='mdx-body'>{children}</div>
      </main>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    </>
  )
}
