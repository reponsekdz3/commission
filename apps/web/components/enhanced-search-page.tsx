// Enhanced Search Page Component
// Apply to /apps/web/app/search/page.tsx

import React from 'react';

export const EnhancedSearchPage = () => {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [filters, setFilters] = React.useState({
    type: 'all',
    priceMin: 0,
    priceMax: 1000000,
  });

  return (
    <div className="animate-fadeInUp">
      {/* Search Header */}
      <div className="search-header">
        <div className="wrap">
          <div className="search-list-head">
            <div>
              <h1 className="search-title animate-slideInLeft">
                Discover Properties
              </h1>
              <p className="search-sub animate-slideInLeft" style={{ animationDelay: '100ms' }}>
                Browse through verified listings across Rwanda
              </p>
            </div>
            <div className="search-head-actions animate-slideInRight">
              <button className="btn-modern btn-secondary hover-scale">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="18" x2="20" y2="18"></line>
                </svg>
                Filters
              </button>
              <button className="btn-modern btn-secondary hover-scale">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Sort
              </button>
            </div>
          </div>

          {/* Type Chips */}
          <div className="search-type-bar animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <div className="search-type-chips">
              <button className="chip active hover-scale">All</button>
              <button className="chip hover-scale">Rent</button>
              <button className="chip hover-scale">Buy</button>
              <button className="chip hover-scale">Short Stay</button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="search-filters-panel animate-slideUp" style={{ animationDelay: '300ms' }}>
            <div className="row-between">
              <div className="row-gap">
                <span className="badge-modern badge-primary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
                  Kigali
                </span>
                <span className="badge-modern badge-primary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
                  2-3 Bedrooms
                </span>
              </div>
              <button className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                Clear all
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="search-results-bar animate-fadeIn" style={{ animationDelay: '400ms' }}>
            <div className="search-results-count">
              <strong>1,234</strong>
              <span>properties found</span>
              <span className="search-results-region">in Kigali</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="wrap pb-20">
        {loading ? (
          <div className="search-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton skeleton-card"></div>
            ))}
          </div>
        ) : (
          <div className="search-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="hp-prop-card hover-lift animate-fadeInUp"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="hp-prop-media">
                  <img
                    src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop`}
                    alt="Property"
                    className="hp-prop-img"
                  />
                  <div className="hp-prop-overlay"></div>
                  <div className="hp-prop-badges">
                    <span className="hp-badge-verified">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                      Verified
                    </span>
                    <span className="hp-badge-type">Rent</span>
                  </div>
                </div>
                <div className="hp-prop-body">
                  <div className="hp-prop-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                    </svg>
                    Kigali
                  </div>
                  <h3 className="hp-prop-title">Modern 2-Bedroom Apartment</h3>
                  <div className="hp-prop-price">
                    RWF 450,000
                    <small>/month</small>
                  </div>
                  <div className="hp-prop-specs">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm0-9C5.03 1.5 1.5 5.03 1.5 10s3.53 8.5 8.5 8.5 8.5-3.53 8.5-8.5S14.97 1.5 10 1.5zm0 15c-3.59 0-6.5-2.91-6.5-6.5S6.41 3.5 10 3.5s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z"/>
                      </svg>
                      2 Beds
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      1 Bath
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      85 m²
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        <div className="flex justify-center mt-12 animate-fadeIn">
          <button className="btn-modern btn-secondary hover-lift">
            Load More Properties
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchPage;
