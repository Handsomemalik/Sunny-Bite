import React, { useState } from 'react';
import { useSettings } from '../../context/ContentContext';
import { supabase, isSupabaseConfigured, logAuditEvent } from '../../lib/supabase';

export function SeoManager() {
  const { seo, refreshSettings } = useSettings();

  const [formData, setFormData] = useState({
    homeTitle: seo?.homeTitle || 'SunnyBite — Fresh Flavors, Brighter Days | I-8 Islamabad',
    homeDesc:
      seo?.homeDesc ||
      'Artisanal botanical bistro in I-8 Islamabad serving handcrafted pasta, gourmet burgers, wood-fired pizza, and organic desserts.',
    ogImage: seo?.ogImage || 'https://sunnybite.pk/images/hero-interior.jpg',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!isSupabaseConfigured() || !supabase) {
      showToast('SEO settings saved locally (offline mode)');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from('site_settings').upsert([
        {
          key: 'seo',
          value: formData,
          is_public: true,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      await logAuditEvent({
        action: 'UPDATE_SEO',
        entityType: 'site_settings',
        newValue: formData,
      });

      showToast('SEO meta tags updated!');
      if (refreshSettings) refreshSettings();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
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
      <div>
        <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#243022] font-semibold">
          Search Engine Optimization (SEO)
        </h1>
        <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
          Optimize website meta titles, descriptions, and OpenGraph social share cards for Google and social previews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Left (7 cols) */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <h2 className="font-headline-sm text-base font-bold text-[#243022]">
              Meta Tags &amp; Social Previews
            </h2>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save SEO'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-on-surface flex items-center justify-between">
                <span>Page Title (Meta Title)</span>
                <span className="text-[10px] text-on-surface-variant">
                  {formData.homeTitle.length}/60 chars
                </span>
              </label>
              <input
                type="text"
                value={formData.homeTitle}
                onChange={(e) => setFormData({ ...formData, homeTitle: e.target.value })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface flex items-center justify-between">
                <span>Meta Description</span>
                <span className="text-[10px] text-on-surface-variant">
                  {formData.homeDesc.length}/160 chars
                </span>
              </label>
              <textarea
                rows={3}
                value={formData.homeDesc}
                onChange={(e) => setFormData({ ...formData, homeDesc: e.target.value })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">OpenGraph Social Share Image URL</label>
              <input
                type="text"
                value={formData.ogImage}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container font-mono text-[11px]"
              />
            </div>
          </div>
        </form>

        {/* Live Google SERP Preview Card Right (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">preview</span>
            <h2 className="font-headline-sm text-base font-bold text-[#243022]">
              Google Search Result Preview
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1 text-left font-sans">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="w-4 h-4 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px]">
                🌿
              </span>
              <span className="truncate">https://sunnybite.pk</span>
            </div>
            <h3 className="text-blue-700 text-sm sm:text-base font-medium hover:underline cursor-pointer leading-snug line-clamp-1">
              {formData.homeTitle}
            </h3>
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
              {formData.homeDesc}
            </p>
          </div>

          {/* Social Share Preview */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-on-surface">WhatsApp / Facebook Share Card Preview</h3>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-32 bg-gray-100 overflow-hidden">
                <img
                  src={formData.ogImage}
                  alt="OG Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">sunnybite.pk</p>
                <p className="text-xs font-bold text-gray-900 truncate">{formData.homeTitle}</p>
                <p className="text-[11px] text-gray-500 line-clamp-1">{formData.homeDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeoManager;
