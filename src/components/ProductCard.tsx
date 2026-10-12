import type { Product } from '../types/product'

type ProductCardProps = {
  product: Product
  isFavorite: boolean
  onAddToCart: () => void
  onToggleFavorite: () => void
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={filled ? 'heart-filled' : undefined}
    >
      <path d="M20.8 8.8c0 4.1-8.8 10-8.8 10s-8.8-5.9-8.8-10A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" />
    </svg>
  )
}

function ProductCard({
  product,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) {
  return (
    <article className="product-card">
      <div className={`product-image ${product.tone}`}>
        <a href={`#/product/${product.id}`} aria-label={`Open ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </a>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className={`favorite-button${isFavorite ? ' favorited' : ''}`}
          type="button"
          aria-label={
            isFavorite
              ? `Remove ${product.name} from favorites`
              : `Add ${product.name} to favorites`
          }
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
        >
          <HeartIcon filled={isFavorite} />
        </button>
        <button className="quick-add" type="button" onClick={onAddToCart}>
          + Add to cart
        </button>
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span>{product.category}</span>
          <span className="product-rating">
            <span aria-hidden="true">★</span> {product.rating}
          </span>
        </div>
        <div className="product-title-row">
          <h3>
            <a href={`#/product/${product.id}`}>{product.name}</a>
          </h3>
          <span className="product-price">
            ${product.price.toLocaleString('en-US')}
          </span>
        </div>
      </div>
    </article>
  )
}

export default ProductCard