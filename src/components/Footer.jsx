import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SunnyBiteLogoHorizontal } from './SunnyBiteLogo';
import { SITE } from '../config/site';
import { useSettings, useContent } from '../context/ContentContext';
import { useCart } from '../context/CartContext';
import { submitSubscriber } from '../lib/supabase';

export function Footer() {
  const [emailInput, setEmailInput] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const { showToast } = useCart();
  const { brand, contact, hours, socials } = useSettings();
  const { content: footerContent } = useContent('footer', 'content');

  const siteName = brand.name || SITE.name;
  const siteLocation = contact.location || SITE.location;
  const siteHours = hours || SITE.hours;
  const siteEmail = contact.email || SITE.email;
  const sitePhone = contact.phone || SITE.phone;
  const sitePhoneRaw = contact.phoneRaw || SITE.phoneRaw;
  const siteSocials = socials || SITE.socials;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      await submitSubscriber(emailInput, honeypot);
    } catch (err) {
      console.warn('[Footer] Subscriber error:', err.message);
    }

    showToast("Welcome to the SunnyBite Foodie Club! 🍽️");
    setEmailInput('');
  };

  return (
    <footer className="w-full bg-[#ebf2e8] text-on-surface border-t border-surface-container overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 pt-8 pb-20 md:pt-space-xl md:pb-space-lg">
        {/* 4 Column Layout on Desktop, Compact 2-Column Responsive Grid on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-space-lg mb-6 md:mb-space-xl">
          {/* Column 1: Brand & Socials (Full width on mobile, 1 col on desktop) */}
          <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
            <Link to="/" aria-label={`${siteName} Home`} className="inline-flex items-center select-none group">
              <SunnyBiteLogoHorizontal className="h-8 md:h-9 lg:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
            </Link>
            <p className="text-sm md:text-body-md md:font-body-md leading-relaxed text-on-surface-variant line-clamp-3 md:line-clamp-none pr-0 md:pr-4">
              {footerContent.tagline || 'Good food brings people together. Fresh flavors and a little happiness, served every day in our cozy botanical retreat.'}
            </p>
            <div className="flex items-center gap-3 pt-1 md:pt-2">
              <a
                href={siteSocials.instagram}
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-surface-container-lowest/80 text-secondary hover:bg-secondary hover:text-on-secondary flex items-center justify-center transition-colors shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">photo_camera</span>
              </a>
              <a
                href={siteSocials.facebook}
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-surface-container-lowest/80 text-secondary hover:bg-secondary hover:text-on-secondary flex items-center justify-center transition-colors shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">public</span>
              </a>
              <a
                href={siteSocials.youtube}
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-surface-container-lowest/80 text-secondary hover:bg-secondary hover:text-on-secondary flex items-center justify-center transition-colors shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">play_circle</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (Side-by-side with Visit Us on mobile) */}
          <div className="col-span-1 space-y-2 md:space-y-3">
            <h4 className="text-base md:text-title-md md:font-title-md font-semibold text-[#243022] mb-2 md:mb-3">
              Quick Links
            </h4>
            <ul className="space-y-0.5 md:space-y-2 text-on-surface-variant">
              <li>
                <Link
                  to="/"
                  className="hover:text-primary transition-colors text-sm md:text-body-md md:font-body-md py-1.5 md:py-0 min-h-[40px] md:min-h-0 flex items-center md:inline"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/menu"
                  className="hover:text-primary transition-colors text-sm md:text-body-md md:font-body-md py-1.5 md:py-0 min-h-[40px] md:min-h-0 flex items-center md:inline"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-primary transition-colors text-sm md:text-body-md md:font-body-md py-1.5 md:py-0 min-h-[40px] md:min-h-0 flex items-center md:inline"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-primary transition-colors text-sm md:text-body-md md:font-body-md py-1.5 md:py-0 min-h-[40px] md:min-h-0 flex items-center md:inline"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Visit Us (Side-by-side with Quick Links on mobile) */}
          <div className="col-span-1 space-y-2 md:space-y-3">
            <h4 className="text-base md:text-title-md md:font-title-md font-semibold text-[#243022] mb-2 md:mb-3">
              Visit Us
            </h4>
            <div className="space-y-2 md:space-y-2.5 text-on-surface-variant">
              <p className="flex items-start gap-1.5 sm:gap-2 text-sm md:text-body-md md:font-body-md">
                <span className="material-symbols-outlined text-[16px] md:text-[18px] text-secondary shrink-0 mt-0.5">location_on</span>
                <span className="break-words leading-snug">{siteLocation}</span>
              </p>
              <p className="flex items-start gap-1.5 sm:gap-2 text-sm md:text-body-md md:font-body-md">
                <span className="material-symbols-outlined text-[16px] md:text-[18px] text-secondary shrink-0 mt-0.5">schedule</span>
                <span className="break-words leading-snug">Daily, {siteHours.daily}</span>
              </p>
              <p className="flex items-start gap-1.5 sm:gap-2 text-sm md:text-body-md md:font-body-md">
                <span className="material-symbols-outlined text-[16px] md:text-[18px] text-secondary shrink-0 mt-0.5">mail</span>
                <a
                  href={`mailto:${siteEmail}`}
                  className="hover:text-primary transition-colors break-all leading-snug py-1 md:py-0 min-h-[36px] md:min-h-0 flex items-center md:inline"
                >
                  {siteEmail}
                </a>
              </p>
              <p className="flex items-start gap-1.5 sm:gap-2 text-sm md:text-body-md md:font-body-md">
                <span className="material-symbols-outlined text-[16px] md:text-[18px] text-secondary shrink-0 mt-0.5">call</span>
                <a
                  href={`tel:${sitePhoneRaw}`}
                  className="hover:text-primary transition-colors whitespace-nowrap leading-snug py-1 md:py-0 min-h-[36px] md:min-h-0 flex items-center md:inline"
                >
                  {sitePhone}
                </a>
              </p>
            </div>
          </div>

          {/* Column 4: Join Our Foodie Club (Full width on mobile, 1 col on desktop) */}
          <div className="col-span-2 md:col-span-1 space-y-2 md:space-y-3">
            <h4 className="text-base md:text-title-md md:font-title-md font-semibold text-[#243022] mb-1.5 md:mb-3">
              {footerContent.newsletterTitle || 'Join Our Foodie Club'}
            </h4>
            <p className="text-sm md:text-body-md md:font-body-md text-on-surface-variant line-clamp-2 md:line-clamp-none leading-relaxed">
              {footerContent.newsletterSubtitle || 'Get updates on new seasonal dishes, chef specials, and happy dining perks.'}
            </p>
            <form
              onSubmit={handleSubscribe}
              className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-outline-variant/60 shadow-sm w-full max-w-full overflow-hidden h-11 md:h-auto"
            >
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Your email address"
                aria-label="Your email address for Foodie Club"
                className="w-full bg-transparent px-3 sm:px-4 py-1 md:py-2 text-sm md:text-body-md md:font-body-md text-on-surface placeholder:text-outline placeholder:text-sm md:placeholder:text-body-md focus:outline-none min-w-0"
              />
              <input
                type="text"
                name="b_hp_footer"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />
              <button
                type="submit"
                aria-label="Subscribe to club"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#e6809a] hover:bg-[#d9708b] text-on-primary flex items-center justify-center shrink-0 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Credits & Legal */}
        <div className="pt-4 mt-4 md:pt-space-md md:mt-0 border-t border-secondary/15 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs md:text-caption md:font-caption text-on-surface-variant text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <span>© 2026 {siteName} Restaurant. {footerContent.copyright || 'All rights reserved.'} ♥</span>
            <span className="hidden md:inline">•</span>
            <span className="text-secondary font-medium">
              {footerContent.builtBy || `Designed & developed by ${SITE.creator.name} (${SITE.creator.role})`}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs md:text-caption">
            <Link to="/privacy" className="hover:text-primary transition-colors py-1.5 px-1 min-h-[36px] flex items-center">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors py-1.5 px-1 min-h-[36px] flex items-center">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors py-1.5 px-1 min-h-[36px] flex items-center">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
