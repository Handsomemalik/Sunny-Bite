import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenu, useContent } from '../context/ContentContext';
import { DishCard } from '../components/DishCard';
import { DishQuickViewModal } from '../components/DishQuickViewModal';
import { FloatingIngredients } from '../components/FloatingIngredients';

export function Menu() {
  const { categories, items: menuItems } = useMenu();
  const { content: header } = useContent('menu', 'header');
  const [activeCategory, setActiveCategory] = useState('all');
  const [quickViewDish, setQuickViewDish] = useState(null);

  const filteredDishes = activeCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  return (
    <div className="flex flex-col w-full relative min-h-screen">
      {/* Floating subtle botanical ingredient accents */}
      <FloatingIngredients />

      {/* Top Header Region */}
      <div className="relative w-full overflow-hidden px-4 md:px-8 pt-8 pb-10">
        {/* Ambient Warm Yellow Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-tertiary-fixed/30 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 bg-primary-fixed/60 text-primary px-4 py-1.5 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
              {header.badge || 'Our menu'}
            </span>
          </div>

          {/* Page H1 */}
          <h1 className="font-headline-lg text-3xl sm:text-headline-lg text-[#243022] max-w-2xl leading-tight">
            {header.title || 'Something for every craving.'}
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            {header.subtitle || 'Made fresh daily, from cozy comfort food to lighter bites and sweet finishes.'}
          </p>

          {/* Category Filter Chips Bar with layoutId sliding pill */}
          <div className="w-full pt-6 overflow-x-auto pb-2 no-scrollbar flex justify-start sm:justify-center">
            <div className="inline-flex items-center gap-1.5 p-1.5 bg-surface-container-low/80 backdrop-blur-md rounded-full shadow-xs border border-white/50">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative px-5 py-2 rounded-full font-label-lg text-label-lg transition-colors duration-200 whitespace-nowrap ${
                      isActive
                        ? 'text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="menu-category-chip"
                        className="absolute inset-0 bg-surface-container-lowest rounded-full shadow-[0_4px_14px_-2px_rgba(60,45,30,0.08)] border border-white/80"
                        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                      />
                    )}
                    <span className="relative z-10">{cat.label || cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dish Grid Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-24 w-full">
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredDishes.map((dish) => (
              <motion.div
                key={dish.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <DishCard
                  dish={dish}
                  variant="menu"
                  onQuickView={(d) => setQuickViewDish(d)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredDishes.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 text-primary">search_off</span>
            <p className="font-title-md">No dishes found in this category.</p>
          </div>
        )}
      </section>

      {/* Quick View Shared Modal */}
      <DishQuickViewModal
        dish={quickViewDish}
        isOpen={!!quickViewDish}
        onClose={() => setQuickViewDish(null)}
      />
    </div>
  );
}

export default Menu;
