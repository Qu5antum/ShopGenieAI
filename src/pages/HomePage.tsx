import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { categories, products } from '../data/products'

type HomePageProps = {
  favorites: number[]
  searchQuery: string
  onAddToCart: () => void
  onSearchChange: (query: string) => void
  onToggleFavorite: (productId: number) => void
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  )
}

function HomePage({
  favorites,
  searchQuery,
  onAddToCart,
  onSearchChange,
  onToggleFavorite,
}: HomePageProps) {
  const [activeCategory, setActiveCategory] = useState('All Products')
  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'All Products' || product.category === activeCategory
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <main id="home">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            WHERE PRODUCTS COME TO LIFE
          </div>
          <h1>
            Great items.
            <br />
            <span>Big</span> stories.
          </h1>
          <p>
            Discover products you love, explore new arrivals, and create videos that
            make customers fall in love with your brand at first sight.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#catalog">
              Browse catalog <span aria-hidden="true">↘</span>
            </a>
            <a className="button button-light" href="#/studio">
              <SparkleIcon /> Create video
            </a>
          </div>
          <div className="hero-note">
            <div className="avatar-stack" aria-hidden="true">
              <span>A</span>
              <span>K</span>
              <span>M</span>
              <span>+</span>
            </div>
            <span>
              <strong>Over 2,400+</strong> products found their story
            </span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Featured products of the week">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-product hero-product-main">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=90"
              alt="Aero Mini Wireless Headphones"
            />
          </div>
          <div className="hero-product hero-product-small">
            <img
              src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=85"
              alt="Daily Ritual Cosmetics"
            />
          </div>
          <div className="hero-sticker">
            <SparkleIcon />
            <span>Item of the day</span>
          </div>
          <div className="hero-caption">
            <span className="caption-dot" />
            <span>Made with love and AI</span>
            <span className="caption-play" aria-hidden="true">
              ▶
            </span>
          </div>
          <div className="hero-scribble" aria-hidden="true">
            ✳
          </div>
        </div>

        <div className="hero-bottom">
          <span>SCROLL TO DISCOVER</span>
          <span className="scroll-line" />
          <span>01 / 04</span>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading">
          <div>
            <div className="section-kicker">CURATED COLLECTION</div>
            <h2>
              Items with <span>character</span>
            </h2>
          </div>
          <a className="text-link" href="#catalog">
            View all <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="catalog-toolbar">
          <div className="category-list" role="group" aria-label="Product categories">
            {categories.map((category) => (
              <button
                className={`category-chip${activeCategory === category ? ' selected' : ''}`}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
          <span className="product-total">
            {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <div
                key={product.id}
                className="product-card-animated"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <ProductCard
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={() => onToggleFavorite(product.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-sparkle">
              <SparkleIcon />
            </span>
            <h3>No products found</h3>
            <p>Try changing your search query or selecting another category.</p>
            <button
              className="button button-dark"
              type="button"
              onClick={() => {
                onSearchChange('')
                setActiveCategory('All Products')
              }}
            >
              Show all products
            </button>
          </div>
        )}
      </section>

      <section className="studio-banner" id="studio-teaser">
        <div className="studio-icon">
          <SparkleIcon />
        </div>
        <div className="studio-copy">
          <span className="section-kicker">YOUR PRODUCT IS THE HERO</span>
          <h2>
            One photo. Video idea. <span>Done.</span>
          </h2>
          <p>
            AI Studio converts product photos into high-converting videos — no crew
            required.
          </p>
        </div>
        <a className="button button-dark" href="#/studio">
          Open AI Studio <span aria-hidden="true">↗</span>
        </a>
        <div className="studio-sparkle studio-sparkle-one">✳</div>
        <div className="studio-sparkle studio-sparkle-two">✦</div>
      </section>
    </main>
  )
}

export default HomePage