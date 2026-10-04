import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export function DishQuickViewModal({ dish, isOpen, onClose }) {
  const [qty, setQty] = useState(1);
  const { addToCart, showToast } = useCart();

  useEffect(() => {
    setQty(1);
  }, [dish]);

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!dish) return null;

  const handleAdd = () => {
    addToCart(dish, qty);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#FDFAF3] rounded-3xl overflow-hidden shadow-2xl z-10 border border-white/80 p-6 sm:p-8"
          >
            {/* Close Button */}
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors shadow-sm z-10"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Dish Image */}
            <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-surface-container mb-6 shadow-sm">
              <img
                src={dish.image}
                alt={dish.name}
                width="600"
                height="400"
                className="w-full h-full object-cover"
              />
              {dish.badge && (
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md font-label-sm text-label-sm text-secondary font-semibold shadow-xs">
                  {dish.badge}
                </span>
              )}
            </div>

            {/* Dish Header & Price */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-headline-sm text-2xl text-[#243022] font-semibold leading-tight">
                  {dish.name}
                </h3>
                <span className="inline-block mt-1 font-label-sm text-label-sm text-secondary font-medium">
                  {dish.dietary || 'Chef Selection'}
                </span>
              </div>
              <span className="font-title-md text-2xl font-bold text-primary shrink-0">
                Rs. {dish.price}
              </span>
            </div>

            {/* Description */}
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6">
              {dish.description}
            </p>

            {/* Tags */}
            {dish.tags && dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {dish.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-surface-container-low text-xs font-medium text-on-surface-variant"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-4 pt-4 border-t border-surface-container">
              {dish.available === false ? (
                <div className="w-full py-3.5 px-6 rounded-full bg-surface-container-high text-on-surface-variant/60 font-label-lg text-center font-semibold cursor-not-allowed">
                  This dish is currently sold out
                </div>
              ) : (
                <>
                  {/* Stepper */}
                  <div className="flex items-center gap-3 bg-surface-container-low px-3 py-2 rounded-full border border-surface-container">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-7 h-7 rounded-full bg-surface-container-lowest text-on-surface font-bold text-base shadow-2xs hover:bg-surface-container"
                    >
                      –
                    </button>
                    <span className="w-5 text-center font-bold text-base text-on-surface">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQty(qty + 1)}
                      className="w-7 h-7 rounded-full bg-surface-container-lowest text-on-surface font-bold text-base shadow-2xs hover:bg-surface-container"
                    >
                      +
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-1 py-3.5 px-6 rounded-full bg-primary-container hover:bg-[#d9708b] text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    <span>Add to Order · Rs. {dish.price * qty}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default DishQuickViewModal;
