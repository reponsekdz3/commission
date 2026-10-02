// Enhanced Favorites Page
// Apply to /apps/web/app/favorites/page.tsx

import React from 'react';

export const EnhancedFavorites = () => {
  const [favorites, setFavorites] = React.useState([
    {
      id: 1,
      title: 'Modern 2-Bedroom Apartment',
      location: 'Kigali',
      price: 'RWF 450,000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      verified: true,
      savedDate: '2024-01-15',
    },
    {
      id: 2,
      title: 'Luxury Villa',
      location: 'Kigali',
      price: 'RWF 1,200,000',
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
      verified: true,
      savedDate: '2024-01-10',
    },
  ]);

  const [sortBy, setSortBy] = React.useState('recent');

  const handleRemove = async (id) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.savedDate) - new Date(a.savedDate);
    }
    return 0;
  });

  return (
    <div className="animate-fadeInUp">
      <div className="wrap py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 animate-slideInLeft">
          <div>
            <h1 className="page-heading">Saved Properties</h1>
            <p className="page-sub">Your favorite properties and saved searches</p>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select-field hover-scale"
          >
            <option value="recent">Recently Saved</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="tab-bar mb-8 animate-slideInUp" style={{ animationDelay: '100ms' }}>
          <button className="tab-btn active hover-scale">
            Properties ({favorites.length})
          </button>
          <button className="tab-btn hover-scale">
            Searches (3)
          </button>
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {sortedFavorites.map((property, i) => (
              <div
                key={property.id}
                className="hp-prop-card hover-lift animate-slideInUp"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="hp-prop-media">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="hp-prop-img"
                  />
                  <div className="hp-prop-overlay"></div>
                  <div className="hp-prop-badges">
                    {property.verified && (
                      <span className="hp-badge-verified">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(property.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover-scale transition-all"
                  >
                    <span className="text-lg">❤️</span>
                  </button>
                </div>
                <div className="hp-prop-body">
                  <div className="hp-prop-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                    </svg>
                    {property.location}
                  </div>
                  <h3 className="hp-prop-title">{property.title}</h3>
                  <div className="hp-prop-price">
                    {property.price}
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
        ) : (
          <div className="empty-modern animate-fadeIn">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>No saved properties yet</h3>
            <p>Start exploring and save your favorite properties to view them later</p>
            <button className="btn-modern btn-primary mt-4 hover-glow">
              Browse Properties
            </button>
          </div>
        )}

        {/* Saved Searches Section */}
        {favorites.length > 0 && (
          <div className="mt-16 animate-slideInUp" style={{ animationDelay: '300ms' }}>
            <h2 className="text-2xl font-bold mb-6">Saved Searches</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-modern hover-lift animate-slideInUp" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold">2-Bedroom in Kigali</h3>
                      <p className="text-xs text-[var(--color-fg-muted)] mt-1">Updated 2 hours ago</p>
                    </div>
                    <button className="btn-modern btn-secondary hover-scale">
                      ⋮
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    <span className="badge-modern badge-primary">2 Beds</span>
                    <span className="badge-modern badge-primary">Kigali</span>
                  </div>
                  <button className="btn-modern btn-primary w-full text-sm hover-glow">
                    View Results (12)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedFavorites;
