import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices with motion allowed
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasPointer || prefersReduced) return;

    setIsVisible(true);

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Check if hovering over interactive element
      const target = e.target;
      const interactive = target.closest('button, a, input, textarea, select, [role="button"], .group');
      setIsHovering(!!interactive);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
      {/* Outer soft ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-primary/50 pointer-events-none"
        animate={{
          x: position.x - (isHovering ? 24 : 16),
          y: position.y - (isHovering ? 24 : 16),
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          backgroundColor: isHovering ? 'rgba(230, 128, 154, 0.12)' : 'transparent',
        }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 280,
          mass: 0.4,
        }}
      />

      {/* Center dot */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full bg-primary pointer-events-none shadow-xs"
        animate={{
          x: position.x - 5,
          y: position.y - 5,
          scale: isHovering ? 1.4 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 400,
          mass: 0.1,
        }}
      />
    </div>
  );
}

export default CustomCursor;
