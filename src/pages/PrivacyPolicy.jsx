import React from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../config/site';
import { useSettings, useContent } from '../context/ContentContext';

export function PrivacyPolicy() {
  const { brand, contact } = useSettings();
  const { content: privacy } = useContent('privacy', 'body');

  const siteName = brand.name || SITE.name;
  const siteLocation = contact.location || SITE.location;
  const siteEmail = contact.email || SITE.email;
  const sitePhone = contact.phone || SITE.phone;
  const sitePhoneRaw = contact.phoneRaw || SITE.phoneRaw;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-[#FDFAF3] rounded-3xl p-8 sm:p-12 shadow-[0_12px_32px_-4px_rgba(60,45,30,0.06)] border border-white/80 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface text-secondary font-label-sm text-sm">
          <span className="material-symbols-outlined text-[16px]">shield</span>
          <span>{privacy.badge || 'Trust & Transparency'}</span>
        </div>

        <h1 className="font-display-lg text-3xl sm:text-4xl text-[#243022] font-semibold">
          {privacy.title || 'Privacy Policy'}
        </h1>
        <p className="font-caption text-caption text-on-surface-variant">
          Last updated: {privacy.lastUpdated || 'January 2026'}
        </p>

        <div className="space-y-4 text-on-surface-variant font-body-md text-base leading-relaxed">
          <p>
            {privacy.intro || `At ${siteName} (${siteLocation}), your privacy is paramount to us. We operate as an artisanal restaurant and bistro, and we treat your personal information with the same care and respect that we treat our ingredients.`}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {privacy.section1Title || '1. Information We Collect'}
          </h2>
          <p>
            {privacy.section1Text || 'When you contact us, book a table, or place an order via WhatsApp or our Contact form, we collect the details you voluntarily provide: your name, phone number, email address, table preferences, and any allergen or dietary accommodations.'}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {privacy.section2Title || '2. How We Use Your Information'}
          </h2>
          <p>
            {privacy.section2Text || 'We use your contact details solely to confirm table reservations, coordinate pickup and dining orders, and respond to your catering inquiries. We do not sell, rent, or trade your data to third parties or marketing spammers.'}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {privacy.section3Title || '3. Local Browser Storage'}
          </h2>
          <p>
            {privacy.section3Text || 'This website uses your browser\'s local storage and session storage to preserve your dining basket and recent assistant conversation during your visit. No tracking cookies are deployed.'}
          </p>

          <h2 className="font-title-md text-lg text-[#243022] font-bold pt-2">
            {privacy.section4Title || '4. Contact Us'}
          </h2>
          <p>
            {privacy.section4Text || (
              <>
                If you have questions regarding our privacy practices, please contact us at{' '}
                <a href={`mailto:${siteEmail}`} className="text-primary font-semibold hover:underline">
                  {siteEmail}
                </a>{' '}
                or call our host desk at{' '}
                <a href={`tel:${sitePhoneRaw}`} className="text-primary font-semibold hover:underline">
                  {sitePhone}
                </a>.
              </>
            )}
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

export default PrivacyPolicy;
