import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SITE } from '../config/site';
import { useSettings, useContent } from '../context/ContentContext';
import { submitContactMessage, submitReservation } from '../lib/supabase';

export function Contact() {
  const { brand, contact, hours, settings } = useSettings();
  const { content: header } = useContent('contact', 'header');
  const { content: venueCard } = useContent('contact', 'venue_card');
  const { content: mapSection } = useContent('contact', 'map_section');
  const { content: tipsSection } = useContent('contact', 'arrival_tips');

  const siteName = brand.name || SITE.name;
  const siteLocation = contact.location || SITE.location;
  const sitePhone = contact.phone || SITE.phone;
  const sitePhoneRaw = contact.phoneRaw || SITE.phoneRaw;
  const siteEmail = contact.email || SITE.email;
  const siteWhatsapp = contact.whatsappLink || SITE.whatsappLink;
  const siteMapQuery = mapSection.mapQuery || contact.mapQuery || SITE.mapQuery;
  const siteHours = hours || SITE.hours;
  const arrivalTipsList = tipsSection.tips || settings.arrivalTips || SITE.arrivalTips;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'table',
    date: '',
    time: '',
    guests: '2',
    message: '',
    dietaryFlag: false,
    honeypot: '',
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }

    setSubmitting(true);
    setFormSubmitted(true);

    const topicLabels = {
      table: 'Table Reservation',
      event: 'Private Gathering (Conservatory up to 40)',
      feedback: 'Compliments & Hello',
    };

    // 1. Submit to Supabase Inbox (RLS protected, insert-only for public)
    try {
      if (formData.topic === 'table') {
        await submitReservation({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          guests: parseInt(formData.guests || '2', 10),
          date: formData.date || new Date().toISOString().split('T')[0],
          time: formData.time || '19:00',
          seating_area: 'Indoor Dining',
          notes: `${formData.message.trim()}${formData.dietaryFlag ? ' [Allergen/Dietary Note Requested]' : ''}`,
          honeypot: formData.honeypot,
        });
      } else {
        await submitContactMessage({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          subject: topicLabels[formData.topic] || formData.topic,
          message: `${formData.message.trim()}${formData.dietaryFlag ? ' [Allergen/Dietary Note Requested]' : ''}`,
          honeypot: formData.honeypot,
        });
      }
    } catch (err) {
      console.warn('[Contact] Supabase inbox submit error:', err.message);
    } finally {
      setSubmitting(false);
    }

    // 2. Open WhatsApp for instant customer confirmation
    let waMsg = `*${siteName} Reservation / Contact* 🌿\n-------------------------\n` +
      `*Name:* ${formData.name.trim()}\n` +
      (formData.phone.trim() ? `*Phone:* ${formData.phone.trim()}\n` : '') +
      `*Email:* ${formData.email.trim()}\n` +
      `*Inquiry:* ${topicLabels[formData.topic] || formData.topic}\n` +
      (formData.date ? `*Date:* ${formData.date}\n` : '') +
      (formData.time ? `*Time:* ${formData.time}\n` : '') +
      (formData.topic === 'table' || formData.topic === 'event' ? `*Guests:* ${formData.guests}\n` : '') +
      `*Message:* ${formData.message.trim()}\n` +
      (formData.dietaryFlag ? `*Dietary Note:* Allergen / Gluten-free accommodation requested\n` : '') +
      `-------------------------\nLooking forward to confirmation!`;

    const waUrl = `${siteWhatsapp}?text=${encodeURIComponent(waMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className="flex flex-col w-full">
      {/* 1. Header Region */}
      <section className="relative w-full overflow-hidden pt-12 pb-14 px-6 md:px-12 flex flex-col items-center text-center">
        {/* Atmospheric Ambient Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-tertiary-fixed/30 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-primary-fixed/30 rounded-full blur-[90px] pointer-events-none -z-10" />
        <div className="absolute top-20 -left-20 w-80 h-80 bg-secondary-fixed/40 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Centered Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-sm mb-5 transition-transform hover:scale-105 duration-200 border border-white/60">
          <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            forum
          </span>
          <span className="font-label-lg text-label-lg text-primary tracking-wide font-medium">
            Get in touch
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-display-lg text-3xl sm:text-5xl lg:text-display-lg text-on-background max-w-3xl font-medium tracking-tight mb-4 leading-tight">
          We'd love to hear from you.
        </h1>

        {/* Subtext */}
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          Have questions, reserving a table, or planning an event? Reach out and we'll reply with a smile.
        </p>

        {/* Quick Stat Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low/80 backdrop-blur-sm shadow-sm border border-white/40">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-surface font-medium">
              Average reply time: under 15 mins
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low/80 backdrop-blur-sm shadow-sm border border-white/40">
            <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
            <span className="font-label-sm text-label-sm text-on-surface font-medium">
              Reservations &amp; Private Dinners Open
            </span>
          </div>
        </div>
      </section>

      {/* 2. Two-Column Workspace & Form */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 pb-20 overflow-hidden">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Info Cards & Curated Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Info Card 1: Address */}
            <div className="p-6 md:p-7 rounded-3xl bg-surface-container-lowest shadow-[0_12px_32px_-4px_rgba(60,45,30,0.05),0_4px_12px_-2px_rgba(60,45,30,0.03)] hover:shadow-[0_18px_40px_-6px_rgba(60,45,30,0.08)] transition-all duration-300 group border border-white/60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#CFE8D5] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    location_on
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                      Our Bistro
                    </span>
                    <span className="font-caption text-caption text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-medium">
                      I-8 Markaz
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md text-on-background mt-1 mb-1 font-semibold">
                    Visit {siteName}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                    {siteLocation}
                  </p>
                  <p className="font-caption text-caption text-outline mt-1">
                    Easy parking available steps from the entrance.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card 2: Hours */}
            <div className="p-6 md:p-7 rounded-3xl bg-surface-container-lowest shadow-[0_12px_32px_-4px_rgba(60,45,30,0.05),0_4px_12px_-2px_rgba(60,45,30,0.03)] hover:shadow-[0_18px_40px_-6px_rgba(60,45,30,0.08)] transition-all duration-300 group border border-white/60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F6E3A6] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-tertiary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    schedule
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-semibold">
                      Hours of Grace
                    </span>
                    <span className="font-caption text-caption text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full font-medium">
                      Kitchen Open
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md text-on-background mt-1 mb-1 font-semibold">
                    Serving Times
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                    Open daily, {siteHours.daily}
                  </p>
                  <div className="mt-2.5 pt-2.5 flex items-center justify-between font-caption text-caption text-on-surface-variant/80 border-t border-surface-container/60">
                    <span>Brunch: {siteHours.brunch}</span>
                    <span>•</span>
                    <span>Dinner: {siteHours.dinner}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card 3: Direct Inquiries & Quick Contact Actions */}
            <div className="p-6 md:p-7 rounded-3xl bg-surface-container-lowest shadow-[0_12px_32px_-4px_rgba(60,45,30,0.05),0_4px_12px_-2px_rgba(60,45,30,0.03)] hover:shadow-[0_18px_40px_-6px_rgba(60,45,30,0.08)] transition-all duration-300 group border border-white/60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F7C9D8] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mail
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                      Direct Desk
                    </span>
                    <span className="font-caption text-caption text-primary bg-primary-fixed px-2 py-0.5 rounded-full font-medium">
                      Concierge
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md text-on-background mt-1 mb-1 font-semibold">
                    Call or Drop a Note
                  </h2>
                  <a href={`mailto:${siteEmail}`} className="font-body-md text-body-md text-primary font-semibold hover:underline block">
                    {siteEmail}
                  </a>
                  <a href={`tel:${sitePhoneRaw}`} className="font-body-md text-body-md text-[#243022] font-semibold hover:underline block mt-0.5">
                    {sitePhone}
                  </a>

                  {/* Call Us & WhatsApp Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-surface-container/60">
                    <a
                      href={`tel:${sitePhoneRaw}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Call Us</span>
                    </a>
                    <a
                      href={siteWhatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366] text-white font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient Mini Venue Feature Card */}
            <div className="p-6 rounded-3xl bg-surface-container-low flex items-center gap-4 shadow-sm border border-white/50">
              <img
                src="/images/contact-greenhouse.jpg"
                alt="Sunlit conservatory greenhouse corner inside SunnyBite filled with leafy botanical monstera"
                loading="lazy"
                width="80"
                height="80"
                className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-title-md text-title-md text-on-surface font-semibold text-[16px]">
                  Host a Garden Gathering
                </h3>
                <p className="font-caption text-caption text-on-surface-variant">
                  Our conservatory hosts intimate celebrations of up to 40 seated guests.
                </p>
              </div>
              <button
                type="button"
                aria-label="Inquire about gathering"
                onClick={() => setFormData(prev => ({ ...prev, topic: 'event' }))}
                className="w-10 h-10 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center shadow-sm shrink-0 hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface-container-lowest p-8 md:p-10 shadow-[0_12px_32px_-4px_rgba(60,45,30,0.05),0_4px_12px_-2px_rgba(60,45,30,0.03)] relative overflow-hidden border border-white/60">
              {/* Subtle corner ornament */}
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold">
                    Send an Inquiry
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-background mt-1 font-semibold">
                    Write to our team
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-medium" htmlFor="full-name">
                    <span>Full Name</span>
                    <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="full-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Amina Khan"
                      className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-body-md px-5 py-3.5 rounded-full placeholder:text-outline border border-[#EADDCF] focus:border-primary-container focus:ring-4 focus:ring-[#f9e4ea] shadow-xs transition-all"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      person
                    </span>
                  </div>
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-medium" htmlFor="email">
                      <span>Email Address</span>
                      <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="amina@example.com"
                        className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-body-md px-5 py-3.5 rounded-full placeholder:text-outline border border-[#EADDCF] focus:border-primary-container focus:ring-4 focus:ring-[#f9e4ea] shadow-xs transition-all"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                        alternate_email
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="font-label-lg text-label-lg text-on-surface flex items-center justify-between font-medium" htmlFor="phone">
                      <span>Phone Number</span>
                      <span className="font-caption text-caption text-outline">Optional</span>
                    </label>
                    <div className="relative">
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-body-md px-5 py-3.5 rounded-full placeholder:text-outline border border-[#EADDCF] focus:border-primary-container focus:ring-4 focus:ring-[#f9e4ea] shadow-xs transition-all"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                        call
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topic Radio Pills */}
                <div className="space-y-2 pt-1">
                  <label className="font-label-lg text-label-lg text-on-surface font-medium">Topic of Interest</label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: 'table', label: 'Table Reservation', icon: 'restaurant' },
                      { id: 'event', label: 'Private Dining (up to 40)', icon: 'celebration' },
                      { id: 'feedback', label: 'Compliments & Hello', icon: 'favorite' },
                    ].map((item) => (
                      <label key={item.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="topic"
                          value={item.id}
                          checked={formData.topic === item.id}
                          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                          className="peer sr-only"
                        />
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low peer-checked:bg-secondary peer-checked:text-on-secondary transition-colors duration-150 border border-transparent peer-checked:border-secondary shadow-xs">
                          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Conditional Reservation Details: Date, Time & Guests */}
                {(formData.topic === 'table' || formData.topic === 'event') && (
                  <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-white/60 space-y-3">
                    <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      <span>Reservation Preference</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1 font-medium" htmlFor="res-date">
                          Date
                        </label>
                        <input
                          id="res-date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-sm px-3.5 py-2.5 rounded-xl border border-[#EADDCF] focus:border-primary-container focus:ring-2 focus:ring-[#f9e4ea] shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1 font-medium" htmlFor="res-time">
                          Time
                        </label>
                        <input
                          id="res-time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-sm px-3.5 py-2.5 rounded-xl border border-[#EADDCF] focus:border-primary-container focus:ring-2 focus:ring-[#f9e4ea] shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1 font-medium" htmlFor="res-guests">
                          Guests
                        </label>
                        <select
                          id="res-guests"
                          value={formData.guests}
                          onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                          className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-sm px-3.5 py-2.5 rounded-xl border border-[#EADDCF] focus:border-primary-container focus:ring-2 focus:ring-[#f9e4ea] shadow-xs"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40].map((num) => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? 'Guest' : 'Guests'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-medium" htmlFor="message">
                    <span>Your Message</span>
                    <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us how we can make your dining experience memorable..."
                    className="w-full bg-[#fdfaf3] text-on-surface font-body-md text-body-md px-5 py-4 rounded-2xl placeholder:text-outline border border-[#EADDCF] focus:border-primary-container focus:ring-4 focus:ring-[#f9e4ea] shadow-xs resize-none transition-all"
                  />
                </div>

                {/* Dietary Flag */}
                <div className="flex items-center gap-3 py-1">
                  <input
                    id="dietary-flag"
                    type="checkbox"
                    checked={formData.dietaryFlag}
                    onChange={(e) => setFormData({ ...formData, dietaryFlag: e.target.checked })}
                    className="w-5 h-5 rounded-md accent-secondary cursor-pointer"
                  />
                  {/* Honeypot anti-spam trap */}
                  <input
                    type="text"
                    name="b_sunny_hp"
                    value={formData.honeypot}
                    onChange={(e) => setFormData(prev => ({ ...prev, honeypot: e.target.value }))}
                    style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                    tabIndex="-1"
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <label htmlFor="dietary-flag" className="font-caption text-caption text-on-surface-variant cursor-pointer select-none">
                    Please prepare gluten-free or allergen-conscious accommodations for this party.
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#E6809A] hover:bg-[#d9708b] text-on-primary font-label-lg text-label-lg px-8 py-3.5 rounded-full shadow-[0_8px_20px_-4px_rgba(230,128,154,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
                  >
                    <span>{submitting ? 'Sending...' : 'Send Message & WhatsApp'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  <span className="font-caption text-caption text-outline flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
                    Privacy protected. No promotional spam.
                  </span>
                </div>

                {/* Success feedback with animated drawn SVG checkmark */}
                {formSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="mt-4 p-4 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center gap-3.5 shadow-sm border border-secondary-container"
                  >
                    <svg
                      className="w-7 h-7 text-secondary shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M20 6L9 17l-5-5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                      />
                    </svg>
                    <div>
                      <p className="font-body-md text-body-md font-semibold">
                        Thank you! Your note has reached the {siteName} host desk.
                      </p>
                      <p className="font-caption text-caption text-on-secondary-variant mt-0.5">
                        WhatsApp message opened to finalize your details instantly.
                      </p>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Map & Neighborhood Highlights Banner */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-12 pb-24">
        <div className="rounded-3xl overflow-hidden shadow-[0_12px_32px_-4px_rgba(60,45,30,0.05),0_4px_12px_-2px_rgba(60,45,30,0.03)] bg-surface-container-lowest border border-white/60">
          {/* Top Banner Strip */}
          <div className="p-6 md:p-8 bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                Neighborhood Walk
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-background mt-0.5 font-semibold">
                Finding Us in {siteMapQuery}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Located conveniently in the heart of {siteLocation}, with easy access and pleasant outdoor strolls.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteMapQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">directions</span>
                <span>Get Directions</span>
              </a>
            </div>
          </div>

          {/* Real Google Maps iframe embed */}
          <div className="w-full h-80 sm:h-96 relative bg-surface-container overflow-hidden">
            <iframe
              title={`${siteName} Location Map`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen=""
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(siteMapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            />

            {/* Overlay Pin Badge with Pin Drop Bounce */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.55, duration: 0.8 }}
              className="absolute top-4 left-4 p-3 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center gap-3 border border-white/60 pointer-events-none"
            >
              <div className="w-10 h-10 rounded-full bg-[#E6809A] flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  restaurant
                </span>
              </div>
              <div className="pr-2">
                <p className="font-label-lg text-label-lg font-bold text-on-background leading-none">
                  {siteName} Bistro
                </p>
                <p className="font-caption text-caption text-outline mt-0.5">
                  {siteLocation} • Open daily 9am–10pm
                </p>
              </div>
            </motion.div>
          </div>

          {/* Quick Arrival Tips from config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-surface-container-high/60 gap-4 p-6 bg-surface-container-low/60">
            {arrivalTipsList.map((tip, i) => (
              <div key={i} className="flex items-center gap-3 pt-3 sm:pt-0">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  {tip.icon}
                </span>
                <div>
                  <p className="font-label-sm text-label-sm font-semibold text-on-surface">
                    {tip.title}
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
