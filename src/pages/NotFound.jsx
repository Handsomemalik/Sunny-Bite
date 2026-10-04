import React from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../config/site';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full bg-[#FDFAF3] rounded-3xl p-8 sm:p-12 text-center shadow-[0_18px_40px_-6px_rgba(60,45,30,0.08)] border border-white/60 space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary-fixed/60 text-primary flex items-center justify-center mx-auto shadow-xs">
          <span className="material-symbols-outlined text-[32px]">cookie</span>
        </div>

        <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold">
          404 · Page Not Found
        </span>

        <h1 className="font-display-lg text-3xl sm:text-4xl text-[#243022] leading-tight font-medium">
          A crumb strayed off the path.
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          The page you are looking for might have been moved, devoured, or never existed in the {SITE.name} pantry.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e6809a] hover:bg-[#d9708b] text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">cottage</span>
            <span>Back Home</span>
          </Link>
          <Link
            to="/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg px-6 py-3 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span>View Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
