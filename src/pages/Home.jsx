import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMenu, useSettings, useContent } from '../context/ContentContext';
import { DishCard } from '../components/DishCard';
import { FeatureCard } from '../components/FeatureCard';
import { DishQuickViewModal } from '../components/DishQuickViewModal';
import { MarqueeStrip } from '../components/MarqueeStrip';
import { FloatingIngredients } from '../components/FloatingIngredients';

export function Home() {
  const { items: menuItems } = useMenu();
  const { brand, stats, contact } = useSettings();
  const { content: hero, visible: heroVisible } = useContent('home', 'hero');
  const { content: features, visible: featuresVisible } = useContent('home', 'features');
  const { content: specials, visible: specialsVisible } = useContent('home', 'specials');
  const { content: story, visible: storyVisible } = useContent('home', 'story');

  const popularDishes = menuItems.filter((item) => item.popular);
  const [quickViewDish, setQuickViewDish] = useState(null);
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex flex-col w-full relative">
      {/* Background Floating Ingredient Accents */}
      <FloatingIngredients />

      {/* 1. Hero Section */}
      {heroVisible && (
        <section className="relative w-full min-h-[92vh] flex items-center overflow-hidden -mt-16 pt-28 pb-16">
          {/* Hero Background with Ken-Burns slow zoom */}
          <motion.div
            initial={{ scale: 1 }}
            animate={prefersReduced ? {} : { scale: 1.06 }}
            transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${hero.heroImage || '/images/hero-interior.jpg'}')` }}
            aria-hidden="true"
          />

          {/* Ambient Floating Pastel Blobs */}
          {!prefersReduced && (
            <>
              <motion.div
                animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute top-20 left-10 w-72 h-72 rounded-full bg-[#F6E3A6]/30 blur-3xl"
              />
              <motion.div
                animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute bottom-20 right-20 w-80 h-80 rounded-full bg-[#E6809A]/20 blur-3xl"
              />
            </>
          )}

          {/* Directional Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FBF5EB]/95 via-[#FBF5EB]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#EFFEE8] via-transparent to-transparent" />

          {/* Hero Content Container */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
            <div className="max-w-2xl flex flex-col items-start space-y-6">
              {/* Badge Pill */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm border border-white/60"
              >
                <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="font-label-lg text-label-lg text-primary tracking-wide font-medium">
                  {hero.taglinePill || brand.tagline}
                </span>
              </motion.div>

              {/* Headline with word-by-word reveal & self-drawing pink underline */}
              <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-display-lg text-on-surface tracking-tight leading-[1.1]">
                <span className="inline-block overflow-hidden mr-3">
                  <motion.span
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                  >
                    {hero.headlineWord1 || 'Fresh'}
                  </motion.span>
                </span>
                <span className="inline-block overflow-hidden">
                  <motion.span
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                  >
                    {hero.headlineWord2 || 'flavors,'}
                  </motion.span>
                </span>
                <br />
                <span className="relative inline-block italic font-normal text-on-surface mt-1">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                  >
                    {hero.headlineWord3 || 'brighter days.'}
                  </motion.span>

                  {/* Hand-drawn SVG Pink Underline */}
                  <svg
                    viewBox="0 0 280 20"
                    fill="none"
                    className="absolute -bottom-3 left-0 w-full h-4 overflow-visible pointer-events-none"
                  >
                    <motion.path
                      d="M 5 12 Q 130 3, 275 13"
                      stroke="#E6809A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, delay: 0.5, ease: 'easeInOut' }}
                    />
                  </svg>
                </span>
              </h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="font-body-lg text-body-lg text-on-surface-variant max-w-lg leading-relaxed"
              >
                {hero.subtitle || `Delicious food, fresh ingredients and a little happiness served every day in our cozy botanical retreat in ${contact.location}.`}
              </motion.p>

              {/* CTAs with magnetic hover scale */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  to={hero.ctaPrimaryLink || '/menu'}
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group"
                >
                  <span>{hero.ctaPrimaryLabel || 'Explore Menu'}</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  to={hero.ctaSecondaryLink || '/menu'}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md hover:bg-surface-container-lowest text-on-surface font-label-lg text-label-lg transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-white/60 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">shopping_bag</span>
                  <span>{hero.ctaSecondaryLabel || 'Order Online'}</span>
                </Link>
              </motion.div>

              {/* Rating Strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className="pt-6 flex items-center gap-6"
              >
                <div className="flex items-center -space-x-2">
                  {['S', 'B', 'R'].map((letter, i) => (
                    <motion.div
                      key={letter}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-label-sm text-label-sm ring-2 ring-surface-container-lowest shadow-sm font-semibold ${
                        i === 0 ? 'bg-secondary-fixed text-on-secondary-fixed' :
                        i === 1 ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                        'bg-primary-fixed text-on-primary-fixed'
                      }`}
                    >
                      {letter}
                    </motion.div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-tertiary">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.08, type: 'spring' }}
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </motion.span>
                    ))}
                    <span className="font-title-md text-title-md text-on-surface ml-1 font-bold">
                      {hero.ratingNumber || stats.rating}
                    </span>
                  </div>
                  <p className="font-caption text-caption text-on-surface-variant">
                    {hero.ratingSubtitle || `Over ${stats.reviews} happy neighborhood foodies`}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Feature Cards Section (4 Across) */}
      {featuresVisible && (
        <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 -mt-10 z-20 mb-space-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(features.items || []).map((card, i) => (
              <FeatureCard
                key={i}
                icon={card.icon}
                colorVariant={card.colorVariant || 'mint'}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ambient Marquee Strip */}
      <MarqueeStrip />

      {/* 3. Popular Dishes Section */}
      {specialsVisible && (
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-space-xl mb-space-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container text-secondary">
                <span className="material-symbols-outlined text-[16px]">restaurant</span>
                <span className="font-label-sm text-label-sm tracking-wide font-medium">
                  {specials.badge || 'Our specials'}
                </span>
              </div>
              <h2 className="font-headline-lg text-3xl sm:text-headline-lg text-on-surface">
                {specials.title || 'Popular dishes'}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                {specials.subtitle || "From classic favorites to unique creations, our menu is full of flavors you'll love."}
              </p>
            </div>

            <Link
              to={specials.ctaLink || '/menu'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-lg text-label-lg transition-all duration-200 self-start md:self-auto shadow-sm hover:scale-105 active:scale-95"
            >
              <span>{specials.ctaLabel || 'View Full Menu'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* 6-Dish Grid with quick view hook */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                variant="home"
                onQuickView={(d) => setQuickViewDish(d)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Interactive Story & Ambience Mosaic */}
      {storyVisible && (
        <section className="w-full bg-[#f4faee] py-space-xl my-6 border-y border-surface-container/60 relative overflow-hidden">
          {/* Drifting background blobs */}
          {!prefersReduced && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary-container/40 blur-3xl -z-10"
            />
          )}

          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Story Text (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface text-secondary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">local_cafe</span>
                  <span>{story.badge || `The ${brand.name} Experience`}</span>
                </div>
                <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface leading-snug">
                  {story.title || 'A sanctuary of botanical calm and joyful bites.'}
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  {story.paragraph || `Every corner of ${brand.name} is thoughtfully curated—from soft velvet chairs and terrazzo tables to lush cascading monstera leaves and neon glow. Whether meeting an old friend or savoring quiet time over sparkling lemonade, you belong here.`}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm border border-surface-container/50">
                    <span className="font-display-lg text-2xl sm:text-headline-lg text-primary block mb-1 font-semibold">
                      {story.stat1Value || '100%'}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {story.stat1Label || 'Natural ingredients & farm milk'}
                    </span>
                  </div>
                  <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm border border-surface-container/50">
                    <span className="font-display-lg text-2xl sm:text-headline-lg text-secondary block mb-1 font-semibold">
                      {story.stat2Value || 'Zero'}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {story.stat2Label || 'Artificial additives or shortcuts'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mosaic Photo & Cards Grid (7 Cols) */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="rounded-3xl overflow-hidden shadow-sm h-64 sm:h-72 bg-surface-container group">
                    <img
                      src={story.image1 || '/images/story-barista.jpg'}
                      alt={story.image1Alt || 'Barista frothing oat milk for velvety matcha latte inside bright botanical cafe counter'}
                      loading="lazy"
                      width="400"
                      height="350"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary-fixed text-on-secondary-fixed space-y-2 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">timer</span>
                      <span className="font-label-lg text-label-lg font-bold">{story.card1Title || 'Table Reservations'}</span>
                    </div>
                    <p className="font-body-md text-body-md opacity-90 leading-relaxed">
                      {story.card1Text || 'Walk-ins always warmly welcomed; weekend patio reservations recommended.'}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-6 pt-6 sm:pt-10">
                  <div className="p-6 rounded-3xl bg-primary-fixed text-on-primary-fixed space-y-2 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">celebration</span>
                      <span className="font-label-lg text-label-lg font-bold">{story.card2Title || 'Gatherings'}</span>
                    </div>
                    <p className="font-body-md text-body-md opacity-90 leading-relaxed">
                      {story.card2Text || 'Host private brunches, birthdays, and joyful pastry tastings with us.'}
                    </p>
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-sm h-64 sm:h-72 bg-surface-container group">
                    <img
                      src={story.image2 || '/images/story-friends.jpg'}
                      alt={story.image2Alt || 'Friends laughing around round pink terrazzo cafe table laden with food and iced teas'}
                      loading="lazy"
                      width="400"
                      height="350"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shared Quick View Modal */}
      <DishQuickViewModal
        dish={quickViewDish}
        isOpen={!!quickViewDish}
        onClose={() => setQuickViewDish(null)}
      />
    </div>
  );
}

export default Home;
