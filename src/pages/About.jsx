import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings, useContent } from '../context/ContentContext';
import { StatCard } from '../components/StatCard';

export function About() {
  const { brand, stats, contact } = useSettings();
  const { content: intro, visible: introVisible } = useContent('about', 'intro');
  const { content: story, visible: storyVisible } = useContent('about', 'story');
  const { content: ctaBanner, visible: ctaVisible } = useContent('about', 'cta_banner');

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex flex-col w-full">
      {/* 1. Top Intro Section */}
      {introVisible && (
        <section className="relative w-full overflow-hidden px-6 lg:px-12 pt-12 pb-16 md:pt-16 md:pb-24">
          {/* Faint warm-yellow radial glow */}
          <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-tertiary-fixed/40 via-tertiary-fixed/15 to-transparent blur-3xl -z-10" />

          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Centered badge pill */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface-container-high text-primary shadow-sm mb-6 transition-transform hover:scale-105 duration-200">
              <span className="text-primary text-[14px]">♥</span>
              <span className="font-label-lg text-label-lg tracking-wide text-on-surface-variant font-medium">
                {intro.badge || 'Our story'}
              </span>
            </div>

            {/* H1 Serif */}
            <h1 className="font-display-lg text-3xl sm:text-5xl lg:text-display-lg text-[#243022] mb-6 max-w-3xl leading-tight">
              {intro.title || 'Made with love, served with joy.'}
            </h1>

            {/* Subtext */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              {intro.subtitle || `${brand.name} started with one simple idea: food should make people happy. Years later, that's still at the heart of everything we serve in ${contact.location}.`}
            </p>
          </div>
        </section>
      )}

      {/* 2. Story Section (2 Columns) */}
      {storyVisible && (
        <section className="w-full px-6 lg:px-12 py-12 md:py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Image with layered pastel blurred blobs */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              {/* Pastel Blobs Behind Image with gentle looping drift */}
              <motion.div
                animate={prefersReduced ? {} : { x: [0, 8, 0], y: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -top-8 -left-8 w-56 h-56 rounded-full bg-tertiary-fixed/70 blur-2xl -z-10 transform -rotate-12"
              />
              <motion.div
                animate={prefersReduced ? {} : { x: [0, -10, 0], y: [0, 10, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -bottom-8 -right-8 w-64 h-64 rounded-full bg-primary-fixed/60 blur-2xl -z-10"
              />
              <motion.div
                animate={prefersReduced ? {} : { x: [0, 6, 0], y: [0, -6, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -bottom-6 -left-6 w-52 h-52 rounded-full bg-secondary-container/80 blur-2xl -z-10"
              />

              {/* Main Photo Card Frame */}
              <div className="relative w-full aspect-square max-w-[540px] p-3 rounded-[36px] bg-[#FDFAF3] shadow-[0_12px_32px_-4px_rgba(60,45,30,0.08),0_4px_12px_-2px_rgba(60,45,30,0.03)] border border-white/60">
                <img
                  src={story.image || '/images/about-interior.jpg'}
                  alt={story.imageAlt || 'A sunlit, joyful dining room interior at SunnyBite featuring tall arched windows, dusty-rose chairs, and lush botanical greenery'}
                  loading="lazy"
                  width="600"
                  height="600"
                  className="w-full h-full object-cover rounded-[32px] shadow-inner"
                />

                {/* Tiny Botanical Floating Badge - Gentle Float */}
                <motion.div
                  animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-4 right-8 bg-[#FDFAF3] px-4 py-2 rounded-full shadow-[0_12px_24px_-4px_rgba(60,45,30,0.12)] flex items-center gap-2 border border-white/80"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold tracking-wide">
                    Since {story.since || stats.since}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Right Column: Story Copy */}
            <div className="lg:col-span-6 flex flex-col items-start justify-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/50 text-secondary">
                <span className="material-symbols-outlined text-[16px]">local_cafe</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  {story.badge || 'Artisanal Roots'}
                </span>
              </div>

              <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-[#243022] leading-tight">
                {story.title || 'A small kitchen with a big idea'}
              </h2>

              <div className="space-y-4 text-on-surface-variant font-body-lg text-body-lg leading-relaxed">
                <p>
                  {story.paragraph1 || 'It began in a small corner kitchen, where our founder believed a good meal could turn any ordinary day into something special. What started with a handful of family recipes has grown into a place where fresh ingredients, warm hospitality and a little bit of joy come together on every plate.'}
                </p>
                <p>
                  {story.paragraph2 || `Today, ${brand.name} is a home for anyone chasing good food and good company — whether it's a quick lunch, a long dinner, or a celebration worth remembering.`}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to={story.ctaLink || '/menu'}
                  className="inline-flex items-center gap-2.5 bg-[#e6809a] hover:bg-[#d9708b] text-on-primary font-label-lg text-label-lg px-8 py-3.5 rounded-full transition-all duration-200 shadow-[0_8px_20px_-4px_rgba(230,128,154,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{story.ctaLabel || 'Explore Our Menu'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Stats Row (4 cream cards #FDFAF3, soft warm shadow) */}
      <section className="w-full px-6 lg:px-12 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon="favorite"
              value={stats.years}
              label="Years of happy serving"
              iconBg="bg-primary-fixed/40"
              iconColor="text-[#98415a]"
            />
            <StatCard
              icon="restaurant_menu"
              value={stats.dishes}
              label="Dishes on rotation"
              iconBg="bg-secondary-container/60"
              iconColor="text-secondary"
            />
            <StatCard
              icon="groups"
              value={stats.customers}
              label="Happy customers"
              iconBg="bg-tertiary-fixed/60"
              iconColor="text-tertiary"
            />
            <StatCard
              icon="emoji_events"
              value={stats.awards}
              label="Local awards"
              iconBg="bg-primary-fixed/40"
              iconColor="text-[#98415a]"
            />
          </div>
        </div>
      </section>

      {/* 4. CTA Banner */}
      {ctaVisible && (
        <section className="w-full px-6 lg:px-12 py-12 md:py-20 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F8D7E3] to-[#FBE3D6] p-10 md:p-16 lg:p-20 shadow-[0_18px_40px_-6px_rgba(60,45,30,0.08)] flex flex-col items-center text-center">
              {/* Soft decorative glow elements inside banner */}
              <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-surface-container-lowest/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-surface-container-lowest/50 blur-3xl" />

              <div className="relative z-10 max-w-2xl flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest/80 text-primary flex items-center justify-center mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">room_service</span>
                </div>
                <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-[#243022] mb-4 tracking-tight">
                  {ctaBanner.title || 'Hungry for something fresh?'}
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-lg">
                  {ctaBanner.subtitle || "Come taste the happiness for yourself — we'll save you a seat."}
                </p>
                <Link
                  to={ctaBanner.buttonLink || '/menu'}
                  className="inline-flex items-center gap-2.5 bg-[#e6809a] hover:bg-[#d9708b] text-on-primary font-label-lg text-label-lg px-8 py-3.5 rounded-full transition-all duration-200 shadow-[0_10px_24px_-4px_rgba(230,128,154,0.45)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  <span>{ctaBanner.buttonLabel || 'Order Online'}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default About;
