import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export function FlyingCartItems() {
  const { flyingItems } = useCart();

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              x: item.startX,
              y: item.startY,
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: item.targetX,
              y: item.targetY,
              scale: 0.35,
              opacity: 0.8,
              rotate: 360,
            }}
            exit={{ opacity: 0, scale: 0.2 }}
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed top-0 left-0 w-12 h-12 rounded-full overflow-hidden shadow-2xl border-2 border-primary-container bg-surface-container"
          >
            <img src={item.image} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default FlyingCartItems;
