import React from 'react';
import { motion } from 'framer-motion';

export function FloatingIngredients() {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 hidden lg:block select-none opacity-40">
      {/* 1. Mint Leaf Top Left */}
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-16 left-6 w-16 h-16"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 10 C20 40, 20 80, 50 90 C80 80, 80 40, 50 10 Z"
            fill="#9FD3AE"
            fillOpacity="0.4"
          />
          <path d="M50 15 L50 85" stroke="#2F5D3E" strokeWidth="2" strokeOpacity="0.3" />
        </svg>
      </motion.div>

      {/* 2. Lemon Wedge Top Right */}
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-44 right-10 w-20 h-20"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 50 A40 40 0 0 1 90 50 Z"
            fill="#F6E3A6"
            fillOpacity="0.5"
            stroke="#AE9E67"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          <circle cx="50" cy="50" r="30" fill="#FFF9E6" fillOpacity="0.6" />
        </svg>
      </motion.div>

      {/* 3. Basil Sprig Mid Left */}
      <motion.div
        animate={{ y: [0, 22, 0], rotate: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-8 w-14 h-14"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M30 60 C10 40, 40 10, 70 30 C90 50, 60 90, 30 60 Z"
            fill="#3A6848"
            fillOpacity="0.25"
          />
        </svg>
      </motion.div>

      {/* 4. Tomato Slice Bottom Right */}
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-28 right-8 w-16 h-16"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#E6809A" fillOpacity="0.35" />
          <circle cx="50" cy="50" r="32" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.4" />
          <circle cx="42" cy="42" r="5" fill="#FFFFFF" fillOpacity="0.5" />
          <circle cx="58" cy="58" r="5" fill="#FFFFFF" fillOpacity="0.5" />
        </svg>
      </motion.div>
    </div>
  );
}

export default FloatingIngredients;
