import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SITE } from '../config/site';

const pageTitles = {
  '/': `SunnyBite — Fresh Flavors, Brighter Days | I-8 Islamabad`,
  '/menu': `Our Menu — Pastas, Burgers, Pizzas & Shakes | SunnyBite Islamabad`,
  '/about': `Our Story — Made with Love, Served with Joy | SunnyBite Islamabad`,
  '/contact': `Contact & Table Reservations | SunnyBite I-8 Islamabad`,
};

const pageDescriptions = {
  '/': `Welcome to ${SITE.name} in ${SITE.location}. Enjoy delicious organic meals, cozy ambience, and artisanal comfort food. ${SITE.tagline}.`,
  '/menu': `Browse ${SITE.name}'s menu: handcrafted pasta, gourmet smash burgers, artisan wood-fired pizzas, fresh salads, and delectable desserts.`,
  '/about': `Discover the roots of ${SITE.name} in ${SITE.location}. Founded with a simple passion for joyful bites and warm community hospitality.`,
  '/contact': `Visit ${SITE.name} in ${SITE.location}, reserve your garden table, or contact our host desk directly. We reply in under 15 minutes.`,
};

export function PageWrapper({ children }) {
  const location = useLocation();
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Scroll to top on navigation
    window.scrollTo(0, 0);

    // Update Page Title and Meta Description dynamically
    const title = pageTitles[location.pathname] || `SunnyBite — Good Food, Good Mood | I-8 Islamabad`;
    const desc = pageDescriptions[location.pathname] || `SunnyBite Restaurant in I-8, Islamabad.`;
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
  }, [location.pathname]);

  if (prefersReduced) {
    return <main className="w-full pt-16 bg-surface min-h-screen overflow-x-hidden">{children}</main>;
  }

  return (
    <motion.main
      key={location.pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full pt-16 bg-surface min-h-screen overflow-x-hidden"
    >
      {children}
    </motion.main>
  );
}

export default PageWrapper;
