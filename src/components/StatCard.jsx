import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function StatCard({ icon, value, label, iconBg = "bg-primary-fixed/40", iconColor = "text-[#98415a]" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !isInView) return;

    // Parse numeric part and suffix
    const match = String(value).match(/^(\d+)(.*)$/);
    if (!match) return;

    const targetNum = parseInt(match[1], 10);
    const suffix = match[2] || '';

    let current = 0;
    const duration = 1200; // ms
    const steps = 30;
    const increment = targetNum / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetNum) {
        setDisplayValue(`${targetNum}${suffix}`);
        clearInterval(timer);
      } else {
        setDisplayValue(`${Math.floor(current)}${suffix}`);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#FDFAF3] rounded-3xl p-8 shadow-[0_12px_32px_-4px_rgba(60,45,30,0.06),0_4px_12px_-2px_rgba(60,45,30,0.03)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_-6px_rgba(60,45,30,0.1)] border border-white/60"
    >
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mb-4 ${iconColor} shrink-0 shadow-xs transition-transform duration-300 hover:rotate-6`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <p className="font-display-lg text-display-lg text-[#e6809a] mb-2 leading-none font-medium">
        {displayValue}
      </p>
      <p className="font-body-md text-body-md text-on-surface-variant font-medium">
        {label}
      </p>
    </motion.div>
  );
}

export default StatCard;

