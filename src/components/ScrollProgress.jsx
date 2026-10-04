import React, { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[60] pointer-events-none">
      <div
        className="h-full bg-primary-container transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(230,128,154,0.6)]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

export default ScrollProgress;
