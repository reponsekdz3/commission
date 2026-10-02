// Enhanced Property Detail Page
// Apply to /apps/web/app/properties/[id]/page.tsx

import React from 'react';

export const EnhancedPropertyDetail = () => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="animate-fadeInUp">
      {/* Hero Gallery */}
      <div className="relative h-96 bg-[var(--color-surface-3)] overflow-hidden rounded-b-3xl animate-scaleIn">
        <img
          src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop"
          alt="Property"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        {/* Save Button */}
        <button
          onClick={() => setSaved(!saved)}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover-scale transition-all"
        >
          <span className="text-xl">{saved ? '❤️' : '🤍'}</span>
        </button>

        {/* Media Count */}
        <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-black/60 text-white text-sm font-bold backdrop-blur-sm">
          📸 12 photos
        </div>
      </div>

      {/* Content */}
      <div className="wrap py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 animate-slideInLeft">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge-modern badge-primary">Verified</span>
                    <span className="badge-modern badge-success">Available</span>
                  </div>
                  <h1 className="text-4xl font-bold text-[var(--color-fg)] mb-2">
                    Modern 2-Bedroom Apartment
                  </h1>
                  <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                    </svg>
                    Kigali, Rwanda
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-[var(--color-fg)]">
                    RWF 450,000
                  </div>
                  <div className="text-sm text-[var(--color-fg-muted)]">/month</div>
                </div>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8 animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <div className="spec-item hover-lift">
                <div className="spec-icon">🛏️</div>
                <div className="spec-val">2</div>
                <div className="spec-lbl">Bedrooms</div>
              </div>
              <div className="spec-item hover-lift">
                <div className="spec-icon">🚿</div>
                <div className="spec-val">1</div>
                <div className="spec-lbl">Bathrooms</div>
              </div>
              <div className="spec-item hover-lift">
                <div className="spec-icon">📐</div>
                <div className="spec-val">85</div>
                <div className="spec-lbl">m²</div>
              </div>
              <div className="spec-item hover-lift">
                <div className="spec-icon">📅</div>
                <div className="spec-val">2024</div>
                <div className="spec-lbl">Built</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 animate-fadeIn" style={{ animationDelay: '300ms' }}>
              <div className="flex gap-2 border-b border-[var(--color-border)] mb-6">
                {['overview', 'amenities', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${
                      activeTab === tab
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fadeIn">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <p className="text-[var(--color-fg-muted)] leading-relaxed">
                      Beautiful modern apartment in the heart of Kigali. Fully furnished with premium amenities and stunning city views. Perfect for professionals and families.
                    </p>
                    <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg p-6">
                      <h3 className="font-bold mb-4">Key Features</h3>
                      <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
                        <li>✓ Modern kitchen with stainless steel appliances</li>
                        <li>✓ Air conditioning in all rooms</li>
                        <li>✓ Secure parking</li>
                        <li>✓ 24/7 security</li>
                        <li>✓ Gym and pool access</li>
                      </ul>
                    </div>
                  </div>
                )}
                {activeTab === 'amenities' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['WiFi', 'Parking', 'Pool', 'Gym', 'Security', 'Elevator'].map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 p-3 bg-[var(--color-surface-1)] rounded-lg hover-lift">
                        <span>✓</span>
                        <span className="text-sm font-bold">{amenity}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 bg-[var(--color-surface-1)] rounded-lg border border-[var(--color-border)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold">John Doe</span>
                          <span className="text-sm text-[var(--color-fg-muted)]">2 weeks ago</span>
                        </div>
                        <div className="text-sm text-yellow-500 mb-2">⭐⭐⭐⭐⭐</div>
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          Great apartment! Clean, well-maintained, and the location is perfect.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="animate-slideInRight">
            {/* Booking Card */}
            <div className="booking-card sticky top-24 animate-scaleIn">
              <div className="mb-6">
                <div className="booking-price">
                  RWF 450,000
                  <small>/month</small>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-fg-muted)]">Monthly rent</span>
                  <span className="font-bold">RWF 450,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-fg-muted)]">Security deposit</span>
                  <span className="font-bold">RWF 900,000</span>
                </div>
                <div className="divider-modern"></div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>RWF 1,350,000</span>
                </div>
              </div>

              <button className="btn-modern btn-primary w-full mb-3 hover-glow">
                Book Viewing
              </button>
              <button className="btn-modern btn-secondary w-full">
                Contact Owner
              </button>
            </div>

            {/* Owner Card */}
            <div className="card-modern mt-6 animate-slideInRight" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <div className="font-bold">John Doe</div>
                  <div className="text-xs text-[var(--color-fg-muted)]">Property Owner</div>
                </div>
              </div>
              <button className="btn-modern btn-secondary w-full text-sm">
                💬 Send Message
              </button>
            </div>

            {/* Share Card */}
            <div className="card-modern mt-6 animate-slideInRight" style={{ animationDelay: '300ms' }}>
              <div className="text-sm font-bold mb-3">Share this property</div>
              <div className="flex gap-2">
                <button className="flex-1 btn-modern btn-secondary text-sm hover-scale">
                  📱
                </button>
                <button className="flex-1 btn-modern btn-secondary text-sm hover-scale">
                  📧
                </button>
                <button className="flex-1 btn-modern btn-secondary text-sm hover-scale">
                  🔗
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPropertyDetail;
