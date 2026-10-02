// Enhanced Home Page Component
// Apply to /apps/web/app/page.tsx

import React from 'react';

export const EnhancedHomePage = () => {
  return (
    <div className="hp-root">
      {/* Hero Section with Animations */}
      <section className="hp-hero animate-fadeInUp">
        <div className="wrap">
          <div className="hp-hero-inner">
            <div className="hp-hero-copy">
              <div className="hp-eyebrow animate-slideInLeft" style={{ animationDelay: '100ms' }}>
                <span className="hp-live-dot"></span>
                Live marketplace
              </div>
              <h1 className="hp-h1 animate-slideInLeft" style={{ animationDelay: '200ms' }}>
                Find Your <span className="hp-h1-accent">Perfect Property</span>
              </h1>
              <p className="hp-lead animate-slideInLeft" style={{ animationDelay: '300ms' }}>
                Discover, compare, and book properties across Rwanda with real-time availability
              </p>

              {/* Interactive Search */}
              <div className="hp-search animate-slideInUp" style={{ animationDelay: '400ms' }}>
                <div className="hp-search-field">
                  <svg className="hp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input type="text" className="hp-search-input" placeholder="Search properties..." />
                </div>
                <select className="hp-search-select">
                  <option>All Types</option>
                  <option>Rent</option>
                  <option>Buy</option>
                </select>
                <button className="hp-search-btn hover-glow">
                  Search
                </button>
              </div>

              {/* Quick Links */}
              <div className="hp-chips animate-fadeIn" style={{ animationDelay: '500ms' }}>
                <button className="hp-chip hover-scale">Kigali</button>
                <button className="hp-chip hover-scale">Huye</button>
                <button className="hp-chip hover-scale">Musanze</button>
              </div>

              {/* Trust Indicators */}
              <div className="hp-trust animate-fadeIn" style={{ animationDelay: '600ms' }}>
                <div className="hp-trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  5,000+ Properties
                </div>
                <div className="hp-trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  Verified Listings
                </div>
                <div className="hp-trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  24/7 Support
                </div>
              </div>
            </div>

            {/* Hero Product Card */}
            <div className="hp-hero-card animate-scaleIn" style={{ animationDelay: '300ms' }}>
              <div className="hp-card-chrome">
                <div className="hp-chrome-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                <span>imizi.rw</span>
                <span className="hp-live-badge">
                  <span className="hp-live-dot"></span>
                  Live
                </span>
              </div>
              <div className="hp-card-map">
                <div className="hp-map-grid"></div>
                <div className="hp-map-road hp-road-a"></div>
                <div className="hp-map-road hp-road-b"></div>
                <div className="hp-map-road hp-road-c"></div>
                <div className="hp-map-pin hp-pin-1"></div>
                <div className="hp-map-pin hp-pin-2"></div>
                <div className="hp-map-pin hp-pin-3"></div>
                <div className="hp-map-pin hp-pin-4"></div>
                <div className="hp-map-float">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                  <b>Kigali</b>
                  <small>2.4M residents</small>
                </div>
              </div>
              <div className="hp-card-stats">
                <div className="hp-mini-stat">
                  <small>Properties</small>
                  <strong>5K+</strong>
                  <span>↑ 12%</span>
                </div>
                <div className="hp-mini-stat">
                  <small>Bookings</small>
                  <strong>1.2K</strong>
                  <span>↑ 8%</span>
                </div>
                <div className="hp-mini-action">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <b>Verified</b>
                  <span>All listings checked</span>
                </div>
              </div>
              <div className="hp-card-footer">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  Real-time updates
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                  Instant messaging
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="hp-section">
        <div className="wrap">
          <div className="hp-actions">
            <div className="hp-action-card hover-lift">
              <span>🔍</span>
              <strong>Search</strong>
              <small>Find properties</small>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="hp-action-card hover-lift">
              <span>❤️</span>
              <strong>Saved</strong>
              <small>Your favorites</small>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="hp-action-card hover-lift">
              <span>💬</span>
              <strong>Messages</strong>
              <small>Chat with owners</small>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="hp-action-card hover-lift">
              <span>📅</span>
              <strong>Bookings</strong>
              <small>Your viewings</small>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnhancedHomePage;
