import React from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../config/site';
import { useSettings, useContent } from '../context/ContentContext';

export function TermsOfService() {
  const { brand, hours } = useSettings();
  const { content: terms } = useContent('terms', 'body');

  const siteName = brand.name || SITE.name;
  const siteDailyHours = hours?.daily || SITE.hours.daily;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-[#FDFAF3] rounded-3xl p-8 sm:p-12 shadow-[0_12px_32px_-4px_rgba(60,45,30,0.06)] border border-white/80 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface text-secondary font-label-sm text-sm">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>{terms.badge || 'Terms of Dining'}</span>
        </div>

        <h1 className="font-display-lg text-3xl sm:text-4xl text-[#243022] font-semibold">
          {terms.title || 'Terms of Service'}
        </h1>
        <p className="font-caption text-caption text-on-surface-variant">
          Last updated: {terms.lastUpdated || 'January 2026'}
        </p>

        <div className="space-y-4 text-on-surface-variant font-body-md text-base leading-relaxed">
          <p>
            {terms.intro || `Welcome to ${siteName}. By accessing our website, reserving tables, or ordering from our menu, you agree to these fair terms.`}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {terms.section1Title || '1. Dining & Reservations'}
          </h2>
          <p>
            {terms.section1Text || `Walk-ins are welcomed warmly during our operating hours (${siteDailyHours}). Table reservations are held for 15 minutes past the scheduled time. For garden gatherings of up to 40 seated guests, please reserve in advance with our host desk.`}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {terms.section2Title || '2. Menu & Prices'}
          </h2>
          <p>
            {terms.section2Text || 'All prices are quoted in Pakistan Rupees (Rs.) and reflect our artisanal recipe standards. While we strive to maintain accurate online prices, actual billings are confirmed upon order placement.'}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {terms.section3Title || '3. Allergens & Dietary Notes'}
          </h2>
          <p>
            {terms.section3Text || 'Our kitchen crafts foods using fresh dairy, nuts, wheat, and seasonal botanicals. If you have severe allergies, please notify our team via WhatsApp or telephone prior to preparation.'}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {terms.section4Title || '4. Digital Services'}
          </h2>
          <p>
            {terms.section4Text || `This website and its conversational assistant are provided for customer guidance. Content and website design are the intellectual property of ${siteName} and ${SITE.creator.name}.`}
          </p>
        </div>

        <div className="pt-4 border-t border-surface-container">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
