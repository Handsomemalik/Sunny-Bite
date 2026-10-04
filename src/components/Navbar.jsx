import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SunnyBiteLogoHorizontal } from './SunnyBiteLogo';
import { SITE } from '../config/site';
import { useSettings } from '../context/ContentContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const { cartCount, setIsDrawerOpen, cartButtonRef } = useCart();
  const { brand, contact, hours, announcement } = useSettings();
  const location = useLocation();

  const siteName = brand.name || SITE.name;
  const siteTagline = brand.tagline || SITE.tagline;
  const siteLocation = contact.location || SITE.location;
  const siteHours = hours || SITE.hours;
  const sitePhone = contact.phone || SITE.phone;
  const sitePhoneRaw = contact.phoneRaw || SITE.phoneRaw;

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (!prefersReduced && currentScrollY > 120) {
        if (currentScrollY > lastScrollY.current + 6) {
          setIsVisible(false); // scrolling down
        } else if (currentScrollY < lastScrollY.current - 6) {
          setIsVisible(true); // scrolling up
        }
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home', icon: 'cottage' },
    { to: '/menu', label: 'Menu', icon: 'restaurant_menu' },
    { to: '/about', label: 'About', icon: 'potted_plant' },
    { to: '/contact', label: 'Contact', icon: 'mark_email_read' },
  ];

  return (
    <>
      {/* Optional Announcement Banner if enabled by Admin */}
      {announcement?.enabled && announcement.text && (
        <div className="relative z-50 bg-[#F6E3A6] text-[#403508] py-1.5 px-4 text-center text-xs sm:text-sm font-medium border-b border-[#ae9e67]/30 shadow-xs flex items-center justify-center gap-2">
          {announcement.badge && (
            <span className="px-2 py-0.5 rounded-full bg-[#E6809A] text-white text-[10px] font-bold uppercase tracking-wider">
              {announcement.badge}
            </span>
          )}
          <span>{announcement.text}</span>
          {announcement.link && (
            <Link to={announcement.link} className="underline hover:text-black font-semibold ml-1">
              Learn more →
            </Link>
          )}
        </div>
      )}

      {/* Floating Desktop / Tablet / Mobile Navigation Bar with spring hide/show */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className={`fixed left-3 right-3 sm:left-6 sm:right-6 md:left-8 md:right-8 z-40 transition-all duration-300 ${
          announcement?.enabled ? 'top-10 sm:top-11' : isScrolled ? 'top-2.5 sm:top-3' : 'top-3 sm:top-4'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto rounded-full px-3.5 sm:px-5 md:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 backdrop-blur-2xl backdrop-saturate-[180%] border ${
            isScrolled
              ? 'h-13 sm:h-14 md:h-14 bg-white/60 border-white/75 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.02),0_16px_36px_-6px_rgba(40,30,20,0.1),0_4px_12px_-2px_rgba(40,30,20,0.04)]'
              : 'h-14 sm:h-15 md:h-16 bg-white/35 hover:bg-white/45 border-white/55 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.75),inset_0_-1px_1px_rgba(0,0,0,0.01),0_10px_30px_-4px_rgba(40,30,20,0.06),0_4px_10px_-2px_rgba(40,30,20,0.02)]'
          }`}
        >
          {/* Mobile Hamburger Button + Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-white/50 active:scale-95 transition-all backdrop-blur-sm border border-white/30"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <Link to="/" aria-label={`${siteName} Home`} className="flex items-center select-none group">
              <SunnyBiteLogoHorizontal className="h-7 sm:h-8 md:h-9 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-[1.03]" />
            </Link>
          </div>

          {/* Center Navigation Links with sliding active pill (layoutId) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full relative bg-white/25 backdrop-blur-md border border-white/35 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.6)]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className="relative px-5 py-2 font-label-lg text-label-lg transition-colors z-10 select-none text-on-surface-variant hover:text-on-surface"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="absolute inset-0 bg-[#f9e4ea]/85 backdrop-blur-sm rounded-full -z-10 shadow-xs border border-white/60"
                    />
                  )}
                  <span className={isActive ? 'text-on-primary-container font-semibold' : ''}>
                    {link.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              ref={cartButtonRef}
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#e6809a] hover:bg-[#d9708b] text-on-primary font-label-lg text-xs sm:text-label-lg px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">shopping_bag</span>
              <span className="hidden sm:inline">Order Online</span>
              <span className="sm:hidden">Order</span>

              {/* Animated Bouncing Cart Counter */}
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0.5, rotate: 20 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                    className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-white text-[#98415a] font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-xs"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Glass Sheet Drawer Menu for Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 md:hidden"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 bottom-0 w-[82vw] max-w-xs bg-[#fdf8f0]/80 backdrop-blur-2xl backdrop-saturate-[180%] z-50 p-6 flex flex-col justify-between shadow-2xl border-r border-white/60 md:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-surface-variant/60">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center select-none group"
                    aria-label={`${siteName} Home`}
                  >
                    <SunnyBiteLogoHorizontal className="h-8 w-auto object-contain" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-white/80 transition-colors border border-white/60"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex flex-col space-y-2">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-2xl text-body-lg transition-all ${
                          isActive
                            ? 'bg-[#f9e4ea] text-on-primary-container font-semibold shadow-xs'
                            : 'text-on-surface hover:bg-surface-container'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                      <span>{link.label}</span>
                    </NavLink>
                  ))}
                </div>

                <div className="pt-4 border-t border-surface-variant space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full h-12 rounded-full bg-[#e6809a] text-on-primary font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    <span>Order Online ({cartCount})</span>
                  </button>

                  <div className="p-4 rounded-2xl bg-surface-container-low text-xs space-y-1.5 text-on-surface-variant">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                      <span>{siteLocation}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                      <span>{siteHours.daily}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">call</span>
                      <a href={`tel:${sitePhoneRaw}`} className="hover:underline">{sitePhone}</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-variant text-center">
                <p className="font-caption text-caption text-on-surface-variant">
                  {siteTagline}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
