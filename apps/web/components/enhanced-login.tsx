// Enhanced Login Page
// Apply to /apps/web/app/login/page.tsx

import React from 'react';

export const EnhancedLogin = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [rememberMe, setRememberMe] = React.useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (email && !email.includes('@')) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <div className="auth-page animate-fadeInUp">
      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>

        <div className="auth-brand-top">
          <div className="auth-logo">🏠</div>
          <div>
            <div className="auth-brand-name">IMIZI</div>
            <div className="auth-brand-tag">Rwanda</div>
          </div>
        </div>

        <div className="auth-brand-body animate-slideInLeft" style={{ animationDelay: '200ms' }}>
          <div className="auth-eyebrow-pill">
            <span className="inline-block w-2 h-2 rounded-full bg-[#A7F3D0]"></span>
            Welcome back
          </div>
          <h2 className="auth-brand-h2">
            Find Your <span className="auth-brand-h2-accent">Perfect Property</span>
          </h2>
          <p className="auth-brand-lead">
            Access your account to manage properties, bookings, and messages
          </p>
          <div className="auth-features">
            <div className="auth-feature-row">
              <div className="auth-feature-icon">✓</div>
              <span>Secure authentication</span>
            </div>
            <div className="auth-feature-row">
              <div className="auth-feature-icon">✓</div>
              <span>Real-time notifications</span>
            </div>
            <div className="auth-feature-row">
              <div className="auth-feature-icon">✓</div>
              <span>24/7 support</span>
            </div>
          </div>
        </div>

        <div className="auth-social-proof animate-slideInLeft" style={{ animationDelay: '300ms' }}>
          <div className="auth-proof-item">
            <strong>5K+</strong>
            <span>Properties</span>
          </div>
          <div className="auth-proof-item">
            <strong>1.2K</strong>
            <span>Bookings</span>
          </div>
          <div className="auth-proof-item">
            <strong>4.8★</strong>
            <span>Rating</span>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner animate-slideInRight" style={{ animationDelay: '200ms' }}>
          <div className="auth-mobile-logo">
            <div className="auth-logo-sm">🏠</div>
            <div>
              <div className="font-bold text-lg">IMIZI</div>
              <div className="text-xs text-[var(--color-fg-muted)]">Rwanda</div>
            </div>
          </div>

          <div className="auth-form-head">
            <h1 className="auth-form-title">Sign In</h1>
            <p className="auth-form-sub">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="animate-slideInUp" style={{ animationDelay: '300ms' }}>
              <label className="auth-label-row">
                <span className="text-sm font-bold text-[var(--color-fg-soft)]">Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`field w-full ${errors.email ? 'border-[var(--color-danger)]' : ''}`}
              />
              {errors.email && (
                <p className="text-xs text-[var(--color-danger)] mt-1 animate-slideUp">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="animate-slideInUp" style={{ animationDelay: '400ms' }}>
              <div className="auth-label-row">
                <span className="text-sm font-bold text-[var(--color-fg-soft)]">Password</span>
                <a href="/forgot" className="auth-forgot-link hover-scale">
                  Forgot?
                </a>
              </div>
              <div className="auth-pw-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`field w-full ${errors.password ? 'border-[var(--color-danger)]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-pw-toggle hover-scale"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[var(--color-danger)] mt-1 animate-slideUp">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 animate-slideInUp" style={{ animationDelay: '500ms' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm font-bold text-[var(--color-fg-muted)] cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn btn-primary animate-slideInUp hover-glow"
              style={{ animationDelay: '600ms' }}
            >
              {loading ? (
                <>
                  <div className="auth-spinner"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider animate-slideInUp" style={{ animationDelay: '700ms' }}>
            Or continue with
          </div>

          {/* Social Buttons */}
          <div className="space-y-2 animate-slideInUp" style={{ animationDelay: '800ms' }}>
            <button className="auth-register-cta hover-lift">
              <span>🔵</span>
              Google
            </button>
            <button className="auth-register-cta hover-lift">
              <span>📱</span>
              Phone
            </button>
          </div>

          {/* Register Link */}
          <div className="auth-legal animate-slideInUp" style={{ animationDelay: '900ms' }}>
            Don't have an account?{' '}
            <a href="/register" className="hover-scale">
              Create one
            </a>
          </div>

          {/* Legal */}
          <div className="auth-legal mt-6 animate-slideInUp" style={{ animationDelay: '1000ms' }}>
            By signing in, you agree to our{' '}
            <a href="/legal/terms" className="hover-scale">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/legal/privacy" className="hover-scale">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;
