type NavbarProps = {
  cartCount: number
  isStudio: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function Navbar({
  cartCount,
  isStudio,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  return (
    <>
      <div className="announcement">
        <SparkleIcon />
        <span>Your showcase. Your style. A touch of AI magic.</span>
        <a href="#/studio">
          Try AI Studio <span aria-hidden="true">↗</span>
        </a>
      </div>

      <header className="site-header">
        <a className="brand" href="#/" aria-label="ShopGenie — homepage">
          <span className="brand-mark">
            <SparkleIcon />
          </span>
          <span>shopgenie</span>
          <span className="brand-ai">AI</span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a
            className={`nav-link${!isStudio ? ' active' : ''}`}
            href="#/"
            aria-current={!isStudio ? 'page' : undefined}
          >
            Store
          </a>
          <a
            className={`nav-link${isStudio ? ' active' : ''}`}
            href="#/studio"
            aria-current={isStudio ? 'page' : undefined}
          >
            AI Studio <span className="nav-new">NEW</span>
          </a>
          <a className="nav-link" href="#about">
            About Us
          </a>
        </nav>

        <div className="header-actions">
          <label className="header-search">
            <SearchIcon />
            <input
              aria-label="Search products"
              placeholder="Find something cool"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
          <button
            className="icon-button cart-button"
            type="button"
            aria-label={`Shopping cart, items: ${cartCount}`}
          >
            <BagIcon />
            <span className="cart-count">{cartCount}</span>
          </button>
          <button className="avatar-button" type="button" aria-label="Profile">
            M
          </button>
        </div>
      </header>
    </>
  )
}

export default Navbar