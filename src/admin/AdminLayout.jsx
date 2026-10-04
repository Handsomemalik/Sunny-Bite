import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from './AdminAuthContext';
import { SunnyBiteLogoHorizontal } from '../components/SunnyBiteLogo';

export function AdminLayout() {
  const { user, role, isOwner, isDemoMode, logout, showInactivityWarning, warningSecondsLeft, resetInactivity } = useAdminAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/admin', end: true, label: 'Dashboard', icon: 'dashboard', color: 'text-secondary' },
    { to: '/admin/menu', label: 'Menu Manager', icon: 'restaurant_menu', color: 'text-primary' },
    { to: '/admin/pages', label: 'Page Editor', icon: 'edit_note', color: 'text-tertiary' },
    { to: '/admin/media', label: 'Media Library', icon: 'photo_library', color: 'text-secondary' },
    { to: '/admin/settings', label: 'Site Settings', icon: 'tune', color: 'text-primary' },
    { to: '/admin/assistant', label: 'Assistant Manager', icon: 'smart_toy', color: 'text-secondary' },
    { to: '/admin/inbox', label: 'Inbox', icon: 'inbox', color: 'text-primary' },
    { to: '/admin/seo', label: 'SEO', icon: 'travel_explore', color: 'text-tertiary' },
    { to: '/admin/backup', label: 'Backup & History', icon: 'history', color: 'text-secondary' },
    { to: '/admin/security', label: 'Security & Accounts', icon: 'shield', color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF5EB] text-on-surface flex flex-col font-body-md antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* 1. Inactivity Warning Banner / Modal */}
      <AnimatePresence>
        {showInactivityWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] bg-[#ffdad6] text-[#410002] p-4 rounded-2xl shadow-warm-elevated border border-error/40 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[24px] text-error animate-pulse">timer</span>
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Inactivity Logout Warning</p>
                <p>Logging out in {warningSecondsLeft}s for security.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetInactivity}
              className="px-4 py-2 bg-error text-white font-label-sm text-xs font-bold rounded-full shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Stay Logged In
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FDFAF3]/90 backdrop-blur-md border-b border-surface-container/80 px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <Link to="/admin" className="flex items-center gap-2 group">
            <SunnyBiteLogoHorizontal className="h-7 sm:h-8 w-auto object-contain" />
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold tracking-wider uppercase hidden sm:inline">
              Admin
            </span>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Demo Mode (Local)</span>
            </span>
          )}

          {/* Persistent View Live Site Button */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold shadow-2xs transition-all border border-white/60 hover:scale-105"
            title="Open live customer website in new tab"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">visibility</span>
            <span className="hidden sm:inline">View Live Site</span>
            <span className="sm:hidden">Live</span>
          </a>

          {/* User Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-surface-container text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-on-surface font-medium max-w-[140px] truncate">{user?.email}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-secondary/10 text-secondary font-bold text-[10px] uppercase">
              {role}
            </span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-full bg-surface-container-low hover:bg-error-container hover:text-error text-on-surface-variant text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            title="Sign out of Admin Panel"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* 3. Main Workspace Container with Sidebar */}
      <div className="flex-1 flex max-w-full overflow-hidden">
        {/* Desktop Sidebar (Left) */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-[#FDFAF3] border-r border-surface-container/80 p-4 justify-between min-h-[calc(100vh-4rem)]">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Management Modules
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isActive ? 'text-white' : item.color
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Quick Support Card */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container/60 text-xs space-y-1">
            <p className="font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
              <span>RLS Protected</span>
            </p>
            <p className="text-on-surface-variant">
              Every save is validated against Supabase Row Level Security policies.
            </p>
          </div>
        </aside>

        {/* Mobile Slide-Out Drawer Navigation */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="fixed top-0 bottom-0 left-0 w-[84vw] max-w-xs bg-[#FDFAF3] z-50 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto md:hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                      <SunnyBiteLogoHorizontal className="h-7 w-auto object-contain" />
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase">
                        Admin
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Close menu"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`material-symbols-outlined text-[20px] ${
                                isActive ? 'text-white' : item.color
                              }`}
                            >
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-container space-y-2 text-xs">
                  <div className="text-on-surface-variant truncate">
                    Logged in as: <strong className="text-on-surface">{user?.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full py-2.5 rounded-full bg-error-container text-error font-bold flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 4. Mobile Quick Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#FDFAF3]/95 backdrop-blur-md border-t border-surface-container px-2 py-1.5 flex items-center justify-around shadow-warm-elevated">
        {[
          { to: '/admin', end: true, label: 'Home', icon: 'dashboard' },
          { to: '/admin/menu', label: 'Menu', icon: 'restaurant_menu' },
          { to: '/admin/inbox', label: 'Inbox', icon: 'inbox' },
          { to: '/admin/pages', label: 'Pages', icon: 'edit_note' },
          { to: '/admin/media', label: 'Media', icon: 'photo_library' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AdminLayout;
