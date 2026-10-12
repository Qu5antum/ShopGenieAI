import { lazy, Suspense, useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import { products } from './data/products'
import './App.css'

const AIStudioPage = lazy(() => import('./pages/AIStudioPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))

function getRoute() {
  const hash = window.location.hash.slice(1)
  const path = hash.split('?')[0]
  return path.startsWith('/') ? path : '/'
}

function getStudioProductId() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const productId = Number(params.get('product'))
  return products.some((product) => product.id === productId)
    ? productId
    : undefined
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [studioProductId, setStudioProductId] = useState(getStudioProductId)
  const [cartCount, setCartCount] = useState(0)
  const [favorites, setFavorites] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const updateRoute = () => {
      setRoute(getRoute())
      setStudioProductId(getStudioProductId())
    }
    window.addEventListener('hashchange', updateRoute)

    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  const productMatch = route.match(/^\/product\/(\d+)$/)
  const selectedProduct = productMatch
    ? products.find((product) => product.id === Number(productMatch[1]))
    : undefined
  const isStudio = route === '/studio'

  function toggleFavorite(productId: number) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
  }

  return (
    <div className="shop-shell">
      <Navbar
        cartCount={cartCount}
        isStudio={isStudio}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Suspense fallback={<div className="page-loading">Loading page…</div>}>
        {isStudio ? (
          <AIStudioPage initialProductId={studioProductId} />
        ) : productMatch ? (
          selectedProduct ? (
            <ProductPage
              product={selectedProduct}
              isFavorite={favorites.includes(selectedProduct.id)}
              favorites={favorites}
              onAddToCart={() => setCartCount((count) => count + 1)}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <main className="not-found">
              <h1>Product not found</h1>
              <a className="button button-dark" href="#/">
                Return to store
              </a>
            </main>
          )
        ) : (
          <HomePage
            favorites={favorites}
            searchQuery={searchQuery}
            onAddToCart={() => setCartCount((count) => count + 1)}
            onSearchChange={setSearchQuery}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </Suspense>

      <footer className="site-footer" id="about">
        <a className="brand footer-brand" href="#/">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" />
              <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
            </svg>
          </span>
          <span>shopgenie</span>
          <span className="brand-ai">AI</span>
        </a>
        <span>© 2025 ShopGenie. Made with a love for great things.</span>
        <a href="#/">Back to store ↑</a>
      </footer>
    </div>
  )
}

export default App
