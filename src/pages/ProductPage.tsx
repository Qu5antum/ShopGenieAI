import ProductCard from '../components/ProductCard'
import VideoPlayer from '../components/VideoPlayer'
import { products } from '../data/products'
import type { Product } from '../types/product'

type ProductPageProps = {
  product: Product
  isFavorite: boolean
  favorites: number[]
  onAddToCart: () => void
  onToggleFavorite: (productId: number) => void
}

function ProductPage({
  product,
  isFavorite,
  favorites,
  onAddToCart,
  onToggleFavorite,
}: ProductPageProps) {
  const relatedProducts = products
    .filter(
      (item) => item.category === product.category && item.id !== product.id,
    )
    .slice(0, 4)

  return (
    <main className="product-page">
      <div className="product-breadcrumb">
        <a href="#/">Store</a>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </div>

      <section className="product-detail">
        <div className={`product-detail-image ${product.tone}`}>
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-detail-copy">
          <span className="section-kicker">{product.category.toUpperCase()}</span>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <span aria-hidden="true">★</span> {product.rating}
            <span className="detail-review-count">Demo product</span>
          </div>
          <p className="product-description">{product.description}</p>
          <div className="detail-price">
            ${product.price.toLocaleString('en-US')}
          </div>
          <div className="detail-actions">
            <button
              className="button button-dark"
              type="button"
              onClick={onAddToCart}
            >
              Add to cart <span aria-hidden="true">↗</span>
            </button>
            <button
              className={`button favorite-detail${isFavorite ? ' favorited' : ''}`}
              type="button"
              aria-pressed={isFavorite}
              onClick={() => onToggleFavorite(product.id)}
            >
              {isFavorite ? '♥ In favorites' : '♡ Add to favorites'}
            </button>
          </div>
          <div className="product-features">
            {product.features.map((feature) => (
              <div className="product-feature" key={feature}>
                <span aria-hidden="true">✓</span>
                {feature}
              </div>
            ))}
          </div>
          <a className="detail-studio-link" href={`#/studio?product=${product.id}`}>
            <span aria-hidden="true">✳</span>
            Create a promotional video for your product
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="product-video-section">
        <div className="product-video-copy">
          <span className="section-kicker">PRODUCT STORY</span>
          <h2>Not just an item. <span>An experience.</span></h2>
          <p>
            The promotional video for this product will appear here. Upload your photo
            to AI Studio to prepare a script for your video.
          </p>
          <a className="button button-dark" href="#/studio">
            Go to AI Studio <span aria-hidden="true">↗</span>
          </a>
        </div>
        <VideoPlayer
          poster={product.image}
          title={`Product video for ${product.name}`}
          videoUrl={product.videoUrl}
          emptyMessage="Demo video for this product has not been added yet"
        />
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products">
          <div className="section-heading">
            <div>
              <div className="section-kicker">MORE FROM THIS CATEGORY</div>
              <h2>
                You might <span>like</span>
              </h2>
            </div>
            <a className="text-link" href="#/">
              Full catalog <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="product-grid">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                isFavorite={favorites.includes(item.id)}
                onAddToCart={onAddToCart}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default ProductPage