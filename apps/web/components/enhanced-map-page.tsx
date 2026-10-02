// Enhanced Map Page
// Apply to /apps/web/app/map/page.tsx

import React from 'react';

export const EnhancedMapPage = () => {
  const [showList, setShowList] = React.useState(true);
  const [selectedProperty, setSelectedProperty] = React.useState(null);
  const [mapType, setMapType] = React.useState('satellite');

  const properties = [
    {
      id: 1,
      title: 'Modern 2-Bedroom Apartment',
      location: 'Kigali',
      price: 'RWF 450,000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      verified: true,
    },
    {
      id: 2,
      title: 'Luxury Villa',
      location: 'Kigali',
      price: 'RWF 1,200,000',
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
      verified: true,
    },
    {
      id: 3,
      title: 'Studio Apartment',
      location: 'Huye',
      price: 'RWF 250,000',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      verified: false,
    },
  ];

  return (
    <div className="map-fullpage animate-fadeInUp">
      {/* Top Bar */}
      <div className="map-topbar animate-slideInDown">
        <div className="map-topbar-inner">
          <div className="map-topbar-left">
            <div className="map-topbar-brand">
              <span>🗺️</span>
              <span>IMIZI Map</span>
            </div>

            <div className="map-search-wrap">
              <svg className="map-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="map-search-input"
                placeholder="Search location..."
              />
            </div>

            <div className="map-type-chips">
              {['Rent', 'Buy', 'Short Stay'].map((type) => (
                <button
                  key={type}
                  className="chip hover-scale"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="map-topbar-right">
            <div className="map-count-badge">
              <span className="map-loading-dot"></span>
              {properties.length} properties
            </div>
            <button
              onClick={() => setShowList(!showList)}
              className={`btn-modern btn-secondary map-panel-toggle hover-scale ${showList ? 'active' : ''}`}
            >
              {showList ? '🗺️' : '📋'}
            </button>
          </div>
        </div>
      </div>

      {/* Map Stage */}
      <div className={`map-stage ${showList ? 'map-stage-split' : ''}`}>
        {/* Map Canvas */}
        <div className="map-canvas animate-scaleIn">
          <div className="realMap bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><path d=%22M0 0h100v100H0z%22 fill=%22none%22 stroke=%22%23ddd%22 stroke-width=%221%22/></svg>')]"></div>

            {/* Map Markers */}
            {properties.map((prop, i) => (
              <button
                key={prop.id}
                onClick={() => setSelectedProperty(prop.id)}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all hover:scale-125 hover-glow animate-scaleIn ${
                  selectedProperty === prop.id
                    ? 'bg-[var(--color-primary)] shadow-lg'
                    : 'bg-[var(--color-primary)] opacity-80 hover:opacity-100'
                }`}
                style={{
                  left: `${20 + i * 25}%`,
                  top: `${30 + i * 15}%`,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                📍
              </button>
            ))}
          </div>

          {/* Map Controls */}
          <div className="map-fab-group animate-slideInRight">
            <button className="map-fab hover-lift" title="Zoom in">
              +
            </button>
            <button className="map-fab hover-lift" title="Zoom out">
              −
            </button>
            <button className="map-fab hover-lift" title="Center map">
              🎯
            </button>
            <button className="map-fab hover-lift" title="My location">
              📍
            </button>
          </div>
        </div>

        {/* Side Panel */}
        {showList && (
          <div className="map-side-panel animate-slideInRight">
            <div className="map-side-head">
              <h3 className="font-bold">Properties</h3>
              <button
                onClick={() => setShowList(false)}
                className="btn-modern btn-secondary hover-scale"
              >
                ✕
              </button>
            </div>

            <div className="map-side-list">
              {properties.map((prop, i) => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop.id)}
                  className={`map-listing-row animate-slideInLeft ${
                    selectedProperty === prop.id ? 'map-listing-row-active' : ''
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="map-listing-img">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="map-listing-thumb"
                    />
                  </div>
                  <div className="map-listing-info">
                    <div className="map-listing-title">{prop.title}</div>
                    <div className="map-listing-district">
                      📍 {prop.location}
                    </div>
                    <div className="map-listing-price">{prop.price}</div>
                  </div>
                  <svg
                    className="map-listing-arrow"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Property Detail Card */}
      {selectedProperty && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white rounded-2xl shadow-lg p-4 animate-slideInUp z-30">
          {(() => {
            const prop = properties.find(p => p.id === selectedProperty);
            return (
              <>
                <img
                  src={prop.image}
                  alt={prop.title}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
                <h3 className="font-bold text-lg mb-1">{prop.title}</h3>
                <div className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)] mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                  </svg>
                  {prop.location}
                </div>
                <div className="text-2xl font-bold mb-3">{prop.price}</div>
                <div className="flex gap-2">
                  <button className="btn-modern btn-primary flex-1 text-sm hover-glow">
                    View
                  </button>
                  <button className="btn-modern btn-secondary flex-1 text-sm hover-scale">
                    Save
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default EnhancedMapPage;
