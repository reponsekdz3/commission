// Enhanced Bookings Page
// Apply to /apps/web/app/bookings/page.tsx

import React from 'react';

export const EnhancedBookings = () => {
  const [filter, setFilter] = React.useState('all');

  const bookings = [
    {
      id: 1,
      property: 'Modern 2-Bedroom Apartment',
      location: 'Kigali',
      date: '2024-01-15',
      status: 'confirmed',
      price: 'RWF 450,000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      property: 'Luxury Villa',
      location: 'Kigali',
      date: '2024-02-20',
      status: 'pending',
      price: 'RWF 1,200,000',
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      property: 'Studio Apartment',
      location: 'Huye',
      date: '2024-03-10',
      status: 'completed',
      price: 'RWF 250,000',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    },
  ];

  const statusConfig = {
    confirmed: { badge: 'badge-success', label: 'Confirmed', icon: '✓' },
    pending: { badge: 'badge-warning', label: 'Pending', icon: '⏳' },
    completed: { badge: 'badge-primary', label: 'Completed', icon: '✓' },
    cancelled: { badge: 'badge-danger', label: 'Cancelled', icon: '✕' },
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <div className="animate-fadeInUp">
      <div className="wrap py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 animate-slideInLeft">
          <div>
            <h1 className="page-heading">My Bookings</h1>
            <p className="page-sub">Manage your property viewings and reservations</p>
          </div>
          <button className="btn-modern btn-primary hover-glow">
            + New Booking
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="tab-bar mb-8 animate-slideInUp" style={{ animationDelay: '100ms' }}>
          {['all', 'pending', 'confirmed', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`tab-btn ${filter === tab ? 'active' : ''} hover-scale`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className="ml-2 text-xs font-bold">
                  ({bookings.filter(b => b.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4 animate-fadeIn">
            {filteredBookings.map((booking, i) => {
              const config = statusConfig[booking.status];
              return (
                <div
                  key={booking.id}
                  className="card-modern hover-lift animate-slideInUp"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Image */}
                    <div className="md:col-span-1">
                      <img
                        src={booking.image}
                        alt={booking.property}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>

                    {/* Details */}
                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{booking.property}</h3>
                          <div className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)] mt-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                            </svg>
                            {booking.location}
                          </div>
                        </div>
                        <span className={`badge-modern ${config.badge}`}>
                          {config.icon} {config.label}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
                          <span className="text-[var(--color-fg-muted)]">
                            Booking Date: <strong>{new Date(booking.date).toLocaleDateString()}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
                          <span className="text-[var(--color-fg-muted)]">
                            Duration: <strong>3 nights</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-1 flex flex-col gap-2">
                      <div className="text-right mb-2">
                        <div className="text-2xl font-bold">{booking.price}</div>
                        <div className="text-xs text-[var(--color-fg-muted)]">Total</div>
                      </div>
                      <button className="btn-modern btn-primary text-sm hover-glow">
                        View Details
                      </button>
                      <button className="btn-modern btn-secondary text-sm hover-scale">
                        Contact Owner
                      </button>
                      {booking.status === 'pending' && (
                        <button className="btn-modern btn-ghost text-sm hover-scale">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-modern animate-fadeIn">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3>No bookings found</h3>
            <p>You don't have any {filter !== 'all' ? filter : ''} bookings yet. Start exploring properties!</p>
            <button className="btn-modern btn-primary mt-4 hover-glow">
              Browse Properties
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 animate-slideInUp" style={{ animationDelay: '300ms' }}>
          <div className="stat-card hover-lift">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{bookings.length}</div>
          </div>
          <div className="stat-card hover-lift">
            <div className="stat-label">Confirmed</div>
            <div className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</div>
          </div>
          <div className="stat-card hover-lift">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{bookings.filter(b => b.status === 'completed').length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookings;
