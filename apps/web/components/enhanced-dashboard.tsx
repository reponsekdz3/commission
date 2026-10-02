// Enhanced Dashboard Page
// Apply to /apps/web/app/dashboard/page.tsx

import React from 'react';

export const EnhancedDashboard = () => {
  const [timeRange, setTimeRange] = React.useState('month');

  return (
    <div className="animate-fadeInUp">
      <div className="wrap py-8">
        {/* Header */}
        <div className="dash-header animate-slideInLeft">
          <div>
            <h1 className="page-heading">Dashboard</h1>
            <p className="page-sub">Track your property performance and bookings</p>
          </div>
          <div className="dash-header-actions">
            <button className="btn-modern btn-secondary hover-scale">
              📅 {timeRange === 'month' ? 'This Month' : 'This Year'}
            </button>
            <button className="btn-modern btn-secondary hover-scale">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid mt-8 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <div className="stat-card hover-lift">
            <div className="dash-stat-head">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase">Total Revenue</span>
            </div>
            <div className="stat-value">RWF 2.4M</div>
            <div className="stat-delta up">↑ 12% from last month</div>
          </div>

          <div className="stat-card hover-lift">
            <div className="dash-stat-head">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase">Bookings</span>
            </div>
            <div className="stat-value">48</div>
            <div className="stat-delta up">↑ 8% from last month</div>
          </div>

          <div className="stat-card hover-lift">
            <div className="dash-stat-head">
              <span className="text-2xl">🏠</span>
              <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase">Properties</span>
            </div>
            <div className="stat-value">12</div>
            <div className="stat-delta">All active</div>
          </div>

          <div className="stat-card hover-lift">
            <div className="dash-stat-head">
              <span className="text-2xl">⭐</span>
              <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase">Rating</span>
            </div>
            <div className="stat-value">4.8</div>
            <div className="stat-delta">From 156 reviews</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="dash-chart-row mt-8 animate-slideInUp" style={{ animationDelay: '300ms' }}>
          {/* Revenue Chart */}
          <div className="dash-chart-panel card-modern">
            <div className="dash-chart-head">
              <div>
                <h3 className="font-bold text-lg">Revenue Trend</h3>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1">Last 6 months</p>
              </div>
              <div className="dash-revenue-total">
                <span className="dash-revenue-label">Total</span>
                <strong>RWF 12.8M</strong>
              </div>
            </div>
            <div className="dash-chart-area bg-gradient-to-b from-[var(--color-primary-soft)] to-transparent rounded-lg p-4 flex items-end justify-around gap-2">
              {[40, 60, 45, 70, 55, 80].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[var(--color-primary)] rounded-t hover-lift transition-all"
                  style={{ height: `${height}%`, minHeight: '20px' }}
                />
              ))}
            </div>
          </div>

          {/* Health Ring */}
          <div className="dash-health-panel card-modern">
            <h3 className="font-bold text-lg mb-4">Property Health</h3>
            <div className="dash-health-ring-wrap">
              <div className="dash-health-ring">
                <div className="dash-health-ring-inner">
                  <div className="dash-health-big">92%</div>
                  <div className="dash-health-sub">Occupancy</div>
                </div>
              </div>
            </div>
            <div className="dash-health-metrics">
              <div className="dash-health-metric hover-lift">
                <span className="dash-health-metric-label">Maintenance</span>
                <span className="dash-health-metric-value">✓</span>
              </div>
              <div className="dash-health-metric hover-lift">
                <span className="dash-health-metric-label">Cleanliness</span>
                <span className="dash-health-metric-value">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Row */}
        <div className="dash-lists-row mt-8 animate-slideInUp" style={{ animationDelay: '400ms' }}>
          {/* Recent Bookings */}
          <div className="dash-list-section">
            <div className="dash-list-head">
              <h3 className="font-bold">Recent Bookings</h3>
              <a href="#" className="dash-list-link hover-scale">
                View all →
              </a>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="list-item-modern mb-2 hover-lift">
                <div className="dash-prop-left">
                  <div className="dash-prop-icon">📅</div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">Booking #{1000 + i}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">2 days ago</div>
                  </div>
                </div>
                <span className="badge-modern badge-success">Confirmed</span>
              </div>
            ))}
          </div>

          {/* Top Properties */}
          <div className="dash-list-section">
            <div className="dash-list-head">
              <h3 className="font-bold">Top Properties</h3>
              <a href="#" className="dash-list-link hover-scale">
                View all →
              </a>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="list-item-modern mb-2 hover-lift">
                <div className="dash-prop-left">
                  <div className="dash-prop-icon">🏠</div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">Property {i}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">12 bookings</div>
                  </div>
                </div>
                <span className="text-sm font-bold">RWF 450K</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 animate-slideInUp" style={{ animationDelay: '500ms' }}>
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <div className="dash-quick-actions">
            <div className="dash-quick-card hover-lift">
              <div className="dash-quick-icon">➕</div>
              <div className="flex-1">
                <div className="dash-quick-label">Add Property</div>
                <div className="dash-quick-sub">List new property</div>
              </div>
              <svg className="dash-quick-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            <div className="dash-quick-card hover-lift">
              <div className="dash-quick-icon">📊</div>
              <div className="flex-1">
                <div className="dash-quick-label">View Analytics</div>
                <div className="dash-quick-sub">Detailed insights</div>
              </div>
              <svg className="dash-quick-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            <div className="dash-quick-card hover-lift">
              <div className="dash-quick-icon">💬</div>
              <div className="flex-1">
                <div className="dash-quick-label">Messages</div>
                <div className="dash-quick-sub">3 new messages</div>
              </div>
              <svg className="dash-quick-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            <div className="dash-quick-card dash-quick-card-accent hover-lift">
              <div className="dash-quick-icon accent">🎯</div>
              <div className="flex-1">
                <div className="dash-quick-label">Upgrade Plan</div>
                <div className="dash-quick-sub">Get premium features</div>
              </div>
              <svg className="dash-quick-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
