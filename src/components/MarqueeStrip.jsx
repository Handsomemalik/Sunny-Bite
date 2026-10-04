import React from 'react';
import { motion } from 'framer-motion';

export function MarqueeStrip() {
  const items = [
    "Fresh Ingredients",
    "Good Food · Good Mood",
    "Artisanal Recipes",
    "Made With Love",
    "Cozy Botanical Retreat",
    "Farm Fresh Milk",
    "Wood-Fired Pizzas",
    "Handmade Pastas",
    "Since 2018"
  ];

  return (
    <div className="w-full py-4 overflow-hidden bg-surface-container-low/70 backdrop-blur-sm border-y border-surface-container/60 select-none">
      <div className="flex w-max group hover:[animation-play-state:paused]">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 28,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="flex items-center gap-8 whitespace-nowrap text-on-surface-variant font-label-lg text-sm font-medium tracking-wide"
        >
          {[...items, ...items, ...items, ...items].map((text, i) => (
            <div key={i} className="flex items-center gap-8">
              <span>{text}</span>
              <span className="text-primary text-xs">✿</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default MarqueeStrip;
