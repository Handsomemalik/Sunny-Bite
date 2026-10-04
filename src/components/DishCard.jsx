import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export function DishCard({ dish, variant = "menu", onQuickView = null }) {
  const { addToCart, updateQty, getItemQty, showToast } = useCart();
  const currentQty = getItemQty(dish.id);

  const [isLiked, setIsLiked] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [displayedPrice, setDisplayedPrice] = useState(0);

  // 3D tilt state
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Price tick animation on mount
  useEffect(() => {
    if (prefersReduced) {
      setDisplayedPrice(dish.price);
      return;
    }
    let start = 0;
    const duration = 600;
    const steps = 15;
    const increment = dish.price / steps;
    const intervalTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= dish.price) {
        setDisplayedPrice(dish.price);
        clearInterval(timer);
      } else {
        setDisplayedPrice(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [dish.price, prefersReduced]);

  // Pointer tilt & glare
  const handleMouseMove = (e) => {
    if (prefersReduced || window.matchMedia('(pointer: coarse)').matches) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -6; // max 6 deg
    const rotY = ((x - centerX) / centerX) * 6;  // max 6 deg

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
    setIsHovered(false);
  };

  // Heart pop animation
  const handleToggleLike = (e) => {
    e.stopPropagation();
    setIsLiked(prev => {
      const next = !prev;
      if (next) {
        setShowHearts(true);
        setTimeout(() => setShowHearts(false), 900);
        showToast(`Saved ${dish.name} to your cravings ♥`);
      }
      return next;
    });
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    addToCart(dish, 1, e.currentTarget);
  };

  const handleCardClick = () => {
    if (onQuickView) {
      onQuickView(dish);
    }
  };

  const isHomeVariant = variant === "home";

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.15s ease-out'
      }}
      className="group relative bg-[#FDFAF3] rounded-3xl p-5 shadow-[0_12px_32px_-4px_rgba(60,45,30,0.05),0_4px_12px_-2px_rgba(60,45,30,0.03)] hover:shadow-[0_20px_44px_-6px_rgba(60,45,30,0.12)] transition-shadow duration-300 flex flex-col justify-between cursor-pointer border border-white/60 overflow-hidden"
    >
      {/* Glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
          opacity: glarePos.opacity
        }}
      />

      {/* Floating Sparkles when hovered */}
      {isHovered && !prefersReduced && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <span className="absolute top-8 left-8 w-2 h-2 rounded-full bg-[#F6E3A6] animate-ping" />
          <span className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-[#E6809A] animate-pulse" />
          <span className="absolute bottom-16 left-1/3 w-2 h-2 rounded-full bg-[#CFE8D5] animate-ping" />
        </div>
      )}

      <div>
        {/* Dish Image Container with parallax & shimmer */}
        <div
          className={`relative w-full ${
            isHomeVariant ? 'h-56' : 'aspect-square'
          } rounded-2xl overflow-hidden mb-4 bg-[#E4F2DD] shadow-inner`}
        >
          {/* Skeleton Shimmer */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          )}

          <img
            src={dish.image}
            alt={dish.name}
            loading="lazy"
            width="400"
            height="400"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isHovered && !prefersReduced ? 'scale-105 rotate-1' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Favorite Heart Button & Bursts */}
          <button
            type="button"
            aria-label={`Favorite ${dish.name}`}
            onClick={handleToggleLike}
            className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center transition-colors shadow-sm z-10 ${
              isLiked ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px] transition-transform active:scale-125"
              style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>

          {/* Burst mini-hearts */}
          <AnimatePresence>
            {showHearts && (
              <div className="absolute top-3.5 right-3.5 pointer-events-none z-20">
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos((deg * Math.PI) / 180) * 28,
                      y: Math.sin((deg * Math.PI) / 180) * 28,
                      scale: 1,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute text-[12px] text-primary"
                  >
                    ♥
                  </motion.span>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Badge */}
          {dish.badge && dish.available !== false && (
            <span className="absolute bottom-3.5 left-3.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md font-label-sm text-label-sm text-secondary font-semibold shadow-xs">
              {dish.badge}
            </span>
          )}

          {/* Sold Out Overlay Badge */}
          {dish.available === false && (
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="px-4 py-1.5 rounded-full bg-surface-container-lowest/95 text-error font-label-lg text-xs font-bold uppercase tracking-wider shadow-md">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Title and Price */}
        <div className="flex items-baseline justify-between mb-2 gap-2">
          <h3 className="font-headline-sm text-headline-sm text-on-surface leading-snug group-hover:text-primary transition-colors">
            {dish.name}
          </h3>
          <motion.span
            animate={{ y: isHovered && !prefersReduced ? -2 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="font-title-md text-title-md text-primary font-bold shrink-0"
          >
            Rs. {displayedPrice}
          </motion.span>
        </div>

        {/* Description */}
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">
          {dish.description}
        </p>
      </div>

      {/* Footer Strip: Dietary Dot + Add/Stepper Button Morph */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-container/60">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              dish.dietary?.toLowerCase().includes('vegetarian') ||
              dish.dietary?.toLowerCase().includes('organic') ||
              dish.dietary?.toLowerCase().includes('vegan')
                ? 'bg-secondary'
                : 'bg-tertiary'
            }`}
          />
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            {dish.dietary || 'Signature'}
          </span>
        </div>

        {/* Morphing Add Button / Quantity Stepper / Sold Out Button */}
        {dish.available === false ? (
          <span className="px-3.5 py-1.5 rounded-full bg-surface-container-high/80 text-on-surface-variant/60 font-label-sm text-xs font-medium cursor-not-allowed">
            Sold out
          </span>
        ) : currentQty > 0 ? (
          <motion.div
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex items-center gap-2 bg-primary-container px-2.5 py-1 rounded-full text-on-primary shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={`Decrease ${dish.name}`}
              onClick={(e) => {
                e.stopPropagation();
                updateQty(dish.id, currentQty - 1);
              }}
              className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform"
            >
              –
            </button>
            <span className="font-bold text-sm min-w-[16px] text-center">
              {currentQty}
            </span>
            <button
              type="button"
              aria-label={`Increase ${dish.name}`}
              onClick={(e) => {
                e.stopPropagation();
                updateQty(dish.id, currentQty + 1);
              }}
              className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform"
            >
              +
            </button>
          </motion.div>
        ) : (
          <motion.button
            layout
            type="button"
            aria-label={`Add ${dish.name} to order`}
            onClick={handleAddClick}
            className="w-10 h-10 rounded-full bg-primary-container hover:bg-[#d9708b] text-on-primary flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default DishCard;
