// Enhanced Compare Page
// Apply to /apps/web/app/compare/page.tsx

import React from 'react';

export const EnhancedCompare = () => {
  const [properties, setProperties] = React.useState([
    {
      id: 1,
      title: 'Modern 2-Bedroom Apartment',
      location: 'Kigali',
      price: 'RWF 450,000',
      beds: 2,
      baths: 1,
      area: 85,
      verified: true,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Luxury Villa',
      location: 'Kigali',
      price: 'RWF 1,200,000',
      beds: 4,
      baths: 3,
      area: 250,
      verified: true,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Studio Apartment',
      location: 'Huye',
      price: 'RWF 250,000',
      beds: 1,
      baths: 1,
      area: 40,
      verified: false,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    },
  ]);

  const handleRemove = (id) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const getHighlight = (values) => {
    const nums = values.filter(v => typeof v === 'number');
    if (nums.length === 0) return null;
    const max = Math.max(...nums);
    return max;
  };

  return (
    <div className="animate-fadeInUp">
      <div className="wrap py-8">
        {/* Header */}
        <div className="mb-8 animate-slideInLeft">
          <h1 className="page-heading">Compare Properties</h1>
          <p className="page-sub">Side-by-side comparison of your selected properties</p>
        </div>

        {/* Compare Table */}
        {properties.length > 0 ? (
          <div className="compare-wrap animate-scaleIn">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-attr">Property</th>
                  {properties.map((prop, i) => (
                    <th key={prop.id} className="animate-slideInRight" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="relative">
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <button
                          onClick={() => handleRemove(prop.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover-scale"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="compare-head-title">{prop.title}</div>
                      <div className="text-xs text-[var(--color-fg-muted)]">{prop.location}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="compare-attr font-bold">Price</td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="animate-fadeIn">
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {prop.price}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Bedrooms */}
                <tr className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="compare-attr">Bedrooms</td>
                  {properties.map((prop) => (
                    <td
                      key={prop.id}
                      className={`animate-fadeIn font-bold text-lg ${
                        prop.beds === getHighlight(properties.map(p => p.beds))
                          ? 'text-[var(--color-primary)]'
                          : ''
                      }`}
                    >
                      {prop.beds}
                    </td>
                  ))}
                </tr>

                {/* Bathrooms */}
                <tr className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="compare-attr">Bathrooms</td>
                  {properties.map((prop) => (
                    <td
                      key={prop.id}
                      className={`animate-fadeIn font-bold text-lg ${
                        prop.baths === getHighlight(properties.map(p => p.baths))
                          ? 'text-[var(--color-primary)]'
                          : ''
                      }`}
                    >
                      {prop.baths}
                    </td>
                  ))}
                </tr>

                {/* Area */}
                <tr className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="compare-attr">Area (m²)</td>
                  {properties.map((prop) => (
                    <td
                      key={prop.id}
                      className={`animate-fadeIn font-bold text-lg ${
                        prop.area === getHighlight(properties.map(p => p.area))
                          ? 'text-[var(--color-primary)]'
                          : ''
                      }`}
                    >
                      {prop.area}
                    </td>
                  ))}
                </tr>

                {/* Verification */}
                <tr className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="compare-attr">Verified</td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="animate-fadeIn">
                      {prop.verified ? (
                        <span className="badge-modern badge-success">✓ Verified</span>
                      ) : (
                        <span className="badge-modern badge-warning">⚠ Pending</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="compare-attr">Rating</td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{prop.rating}</span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="compare-attr">Actions</td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="animate-fadeIn">
                      <div className="flex gap-2">
                        <button className="btn-modern btn-primary text-sm hover-glow">
                          View
                        </button>
                        <button className="btn-modern btn-secondary text-sm hover-scale">
                          Save
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-modern animate-fadeIn">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3>No properties to compare</h3>
            <p>Add properties to compare their features and prices</p>
            <button className="btn-modern btn-primary mt-4 hover-glow">
              Browse Properties
            </button>
          </div>
        )}

        {/* Comparison Tips */}
        {properties.length > 0 && (
          <div className="mt-12 animate-slideInUp" style={{ animationDelay: '300ms' }}>
            <div className="alert-modern alert-info">
              <strong>💡 Tip:</strong> Highlighted values indicate the best option in each category. You can add up to 5 properties to compare.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCompare;
