import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';
import { SunnyBiteLogoHorizontal } from '../../components/SunnyBiteLogo';

export function Login() {
  const { login, requestPasswordReset, session, isAdmin, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@sunnybite.pk');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Rate limiting / Brute force protection state
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return parseInt(sessionStorage.getItem('sunnybite_login_fails') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // If already authenticated and verified as admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session && isAdmin) {
      const destination = location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    }
  }, [session, isAdmin, authLoading, navigate, location]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotMode) {
        await requestPasswordReset(email);
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
        setLoading(false);
        return;
      }

      await login(email, password, rememberMe);

      // Reset failed attempts on success
      setFailedAttempts(0);
      try {
        sessionStorage.removeItem('sunnybite_login_fails');
      } catch {}

      const destination = location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      try {
        sessionStorage.setItem('sunnybite_login_fails', String(nextFails));
      } catch {}

      // Calculate brute-force delay
      if (nextFails >= 5) {
        setLockoutSeconds(30);
      } else if (nextFails >= 4) {
        setLockoutSeconds(15);
      } else if (nextFails >= 3) {
        setLockoutSeconds(5);
      }

      setErrorMessage(
        err.message || 'Incorrect password. Please enter the valid admin password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5EB] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Background Soft Blobs */}
      <div className="fixed top-12 left-12 w-80 h-80 rounded-full bg-[#F6E3A6]/40 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-12 right-12 w-96 h-96 rounded-full bg-[#E6809A]/20 blur-3xl pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#FDFAF3] rounded-3xl p-7 sm:p-10 shadow-[0_18px_40px_-6px_rgba(60,45,30,0.08),0_4px_12px_-2px_rgba(60,45,30,0.03)] border border-white/80 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" aria-label="SunnyBite Home" className="inline-block group mb-1">
            <SunnyBiteLogoHorizontal className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span>Password Protected</span>
          </div>
          <h1 className="font-headline-sm text-2xl text-[#243022] font-semibold pt-1">
            {isForgotMode ? 'Reset Your Password' : 'Admin Panel Login'}
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            {isForgotMode
              ? 'Enter your admin email to receive a password reset link'
              : 'Enter your admin password to access the dashboard'}
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs flex items-start gap-2.5 border border-error/20">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
            <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container text-xs flex items-start gap-2.5 border border-secondary/20">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">check_circle</span>
            <div className="flex-1 leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Brute force delay warning */}
        {lockoutSeconds > 0 && (
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-900 text-xs flex items-center gap-2 border border-amber-300">
            <span className="material-symbols-outlined text-[18px] text-amber-700 animate-spin">hourglass_empty</span>
            <span>Too many attempts. Please wait {lockoutSeconds} seconds before trying again.</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface">
              Admin Account / Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                account_circle
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sunnybite.pk"
                className="w-full bg-surface-container-lowest text-on-surface text-sm pl-10 pr-4 py-3 rounded-2xl border border-outline-variant/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          {!isForgotMode && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-on-surface">
                  Admin Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                  key
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-surface-container-lowest text-on-surface text-sm pl-10 pr-11 py-3 rounded-2xl border border-outline-variant/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {!isForgotMode && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-secondary focus:ring-secondary/30 w-4 h-4"
                />
                <span>Remember on this browser</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotMode(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="w-full py-3.5 px-6 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Verifying Password...</span>
              </>
            ) : isForgotMode ? (
              <span>Send Reset Email</span>
            ) : (
              <>
                <span>Unlock Admin Panel</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>

          {isForgotMode && (
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="w-full py-2.5 text-xs text-on-surface-variant hover:text-on-surface font-semibold text-center block"
            >
              ← Back to Sign In
            </button>
          )}
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-surface-container text-center space-y-1">
          <p className="text-[11px] text-on-surface-variant flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
            <span>Protected by SunnyBite Security System</span>
          </p>
          <a href="/" className="text-xs text-secondary hover:underline font-medium block">
            Return to Public Website
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
