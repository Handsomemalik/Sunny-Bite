import React, { useState } from 'react';
import { useSettings } from '../../context/ContentContext';
import { supabase, isSupabaseConfigured, logAuditEvent, saveContentVersion, uploadMediaFile } from '../../lib/supabase';

export function SiteSettings() {
  const { settings, refreshSettings } = useSettings();

  const [form, setForm] = useState(settings);
  const [savingKey, setSavingKey] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveGroup = async (groupKey, groupValue) => {
    setSavingKey(groupKey);

    if (!isSupabaseConfigured() || !supabase) {
      showToast(`Updated ${groupKey} locally (offline mode)`);
      setSavingKey(null);
      return;
    }

    try {
      // 1. Snapshot previous setting in content_versions
      const oldVal = settings[groupKey];
      if (oldVal) {
        await saveContentVersion({
          settingKey: groupKey,
          content: oldVal,
          changedBy: 'admin',
        });
      }

      // 2. Upsert in site_settings
      const { error } = await supabase.from('site_settings').upsert(
        [
          {
            key: groupKey,
            value: groupValue,
            is_public: true,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'key' }
      );

      if (error) throw error;

      await logAuditEvent({
        action: 'UPDATE_SETTINGS',
        entityType: 'site_setting',
        entityId: groupKey,
        oldValue: oldVal,
        newValue: groupValue,
      });

      showToast(`Saved ${groupKey} settings!`);
      if (refreshSettings) refreshSettings();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSavingKey(null);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await uploadMediaFile(file, 'SunnyBite Brand Logo');
      const updatedBrand = { ...form.brand, logoUrl: res.url };
      setForm({ ...form, brand: updatedBrand });
      await handleSaveGroup('brand', updatedBrand);
      showToast('Logo updated successfully!');
    } catch (err) {
      showToast(`Logo upload failed: ${err.message}`, true);
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-warm-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            feedback.isErr ? 'bg-error text-white' : 'bg-secondary text-on-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedback.isErr ? 'error' : 'check_circle'}
          </span>
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#243022] font-semibold">
            Site Settings &amp; Operations
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Centralized restaurant profile, phone numbers, WhatsApp, opening hours, ordering options, and announcement banner.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. BRAND & IDENTITY */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">storefront</span>
              <h2 className="font-headline-sm text-lg font-bold text-[#243022]">Brand Identity</h2>
            </div>
            <button
              type="button"
              disabled={savingKey === 'brand'}
              onClick={() => handleSaveGroup('brand', form.brand)}
              className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingKey === 'brand' ? 'Saving...' : 'Save Brand'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Restaurant Name</label>
              <input
                type="text"
                value={form.brand?.name || ''}
                onChange={(e) => setForm({ ...form, brand: { ...form.brand, name: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Tagline</label>
              <input
                type="text"
                value={form.brand?.tagline || ''}
                onChange={(e) => setForm({ ...form, brand: { ...form.brand, tagline: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Brand Logo</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={form.brand?.logoUrl || ''}
                  onChange={(e) => setForm({ ...form, brand: { ...form.brand, logoUrl: e.target.value } })}
                  className="flex-1 bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container font-mono text-[11px]"
                />
                <label className="px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs font-semibold cursor-pointer hover:bg-surface-container flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  <span>{uploadingLogo ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ORDERING SYSTEM FLAGS */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">shopping_cart_checkout</span>
              <h2 className="font-headline-sm text-lg font-bold text-[#243022]">Ordering Controls</h2>
            </div>
            <button
              type="button"
              disabled={savingKey === 'ordering'}
              onClick={() => handleSaveGroup('ordering', form.ordering)}
              className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingKey === 'ordering' ? 'Saving...' : 'Save Ordering'}
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={form.ordering?.enabled !== false}
                onChange={(e) =>
                  setForm({ ...form, ordering: { ...form.ordering, enabled: e.target.checked } })
                }
                className="w-4 h-4 rounded accent-secondary"
              />
              <span>Online Ordering Enabled on Website</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={!!form.ordering?.delivery}
                onChange={(e) =>
                  setForm({ ...form, ordering: { ...form.ordering, delivery: e.target.checked } })
                }
                className="w-4 h-4 rounded accent-primary"
              />
              <span>Offer Direct Home Delivery (If off, Pickup &amp; Dine-in only)</span>
            </label>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Max Quantity Per Dish (Bulk Limit)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.ordering?.maxQtyPerItem || 20}
                onChange={(e) =>
                  setForm({ ...form, ordering: { ...form.ordering, maxQtyPerItem: Number(e.target.value) } })
                }
                className="w-32 bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container font-bold"
              />
            </div>
          </div>
        </div>

        {/* 3. CONTACT & LOCATION */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">call</span>
              <h2 className="font-headline-sm text-lg font-bold text-[#243022]">Contact &amp; Location</h2>
            </div>
            <button
              type="button"
              disabled={savingKey === 'contact'}
              onClick={() => handleSaveGroup('contact', form.contact)}
              className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingKey === 'contact' ? 'Saving...' : 'Save Contact'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Phone Number (Formatted)</label>
                <input
                  type="text"
                  value={form.contact?.phone || ''}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })}
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Raw Phone (Dialer link)</label>
                <input
                  type="text"
                  value={form.contact?.phoneRaw || ''}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact, phoneRaw: e.target.value } })}
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">WhatsApp Link</label>
              <input
                type="text"
                value={form.contact?.whatsappLink || ''}
                onChange={(e) => setForm({ ...form, contact: { ...form.contact, whatsappLink: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Email Address</label>
              <input
                type="email"
                value={form.contact?.email || ''}
                onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Location / Address</label>
              <input
                type="text"
                value={form.contact?.location || ''}
                onChange={(e) => setForm({ ...form, contact: { ...form.contact, location: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
              />
            </div>
          </div>
        </div>

        {/* 4. OPENING HOURS */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[22px]">schedule</span>
              <h2 className="font-headline-sm text-lg font-bold text-[#243022]">Opening Hours</h2>
            </div>
            <button
              type="button"
              disabled={savingKey === 'hours'}
              onClick={() => handleSaveGroup('hours', form.hours)}
              className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingKey === 'hours' ? 'Saving...' : 'Save Hours'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Daily Hours</label>
              <input
                type="text"
                value={form.hours?.daily || ''}
                onChange={(e) => setForm({ ...form, hours: { ...form.hours, daily: e.target.value } })}
                placeholder="9am – 10pm"
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Brunch Window</label>
                <input
                  type="text"
                  value={form.hours?.brunch || ''}
                  onChange={(e) => setForm({ ...form, hours: { ...form.hours, brunch: e.target.value } })}
                  placeholder="9am – 2pm"
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Dinner Window</label>
                <input
                  type="text"
                  value={form.hours?.dinner || ''}
                  onChange={(e) => setForm({ ...form, hours: { ...form.hours, dinner: e.target.value } })}
                  placeholder="5pm – 10pm"
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. ANNOUNCEMENT BAR */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">campaign</span>
              <h2 className="font-headline-sm text-lg font-bold text-[#243022]">Top Announcement Banner</h2>
            </div>
            <button
              type="button"
              disabled={savingKey === 'announcement'}
              onClick={() => handleSaveGroup('announcement', form.announcement)}
              className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingKey === 'announcement' ? 'Saving...' : 'Save Banner'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={!!form.announcement?.enabled}
                onChange={(e) =>
                  setForm({ ...form, announcement: { ...form.announcement, enabled: e.target.checked } })
                }
                className="w-4 h-4 rounded accent-secondary"
              />
              <span>Display Announcement Banner Above Navbar</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-on-surface">Announcement Text</label>
                <input
                  type="text"
                  value={form.announcement?.text || ''}
                  onChange={(e) =>
                    setForm({ ...form, announcement: { ...form.announcement, text: e.target.value } })
                  }
                  placeholder="🌿 Complimentary beverage with any two mains this weekend!"
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Badge Pill</label>
                <input
                  type="text"
                  value={form.announcement?.badge || ''}
                  onChange={(e) =>
                    setForm({ ...form, announcement: { ...form.announcement, badge: e.target.value } })
                  }
                  placeholder="Special Offer"
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. STATS & REPUTATION COUNTERS */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">hotel_class</span>
              <h2 className="font-headline-sm text-lg font-bold text-[#243022]">Public Stats &amp; Counters</h2>
            </div>
            <button
              type="button"
              disabled={savingKey === 'stats'}
              onClick={() => handleSaveGroup('stats', form.stats)}
              className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {savingKey === 'stats' ? 'Saving...' : 'Save Stats'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Rating</label>
              <input
                type="text"
                value={form.stats?.rating || '4.9'}
                onChange={(e) => setForm({ ...form, stats: { ...form.stats, rating: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2 rounded-xl border font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Reviews Count</label>
              <input
                type="text"
                value={form.stats?.reviews || '1,200+'}
                onChange={(e) => setForm({ ...form, stats: { ...form.stats, reviews: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2 rounded-xl border font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Years of Serving</label>
              <input
                type="text"
                value={form.stats?.years || '8+'}
                onChange={(e) => setForm({ ...form, stats: { ...form.stats, years: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2 rounded-xl border font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Dishes Count</label>
              <input
                type="text"
                value={form.stats?.dishes || '120+'}
                onChange={(e) => setForm({ ...form, stats: { ...form.stats, dishes: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2 rounded-xl border font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Happy Customers</label>
              <input
                type="text"
                value={form.stats?.customers || '15k+'}
                onChange={(e) => setForm({ ...form, stats: { ...form.stats, customers: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2 rounded-xl border font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Since Year</label>
              <input
                type="text"
                value={form.stats?.since || '2018'}
                onChange={(e) => setForm({ ...form, stats: { ...form.stats, since: e.target.value } })}
                className="w-full bg-surface-container-lowest p-2 rounded-xl border font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteSettings;
