import React, { useState } from 'react';
import { useContent, ContentContext } from '../../context/ContentContext';
import { useContext } from 'react';
import { supabase, isSupabaseConfigured, logAuditEvent, saveContentVersion, uploadMediaFile } from '../../lib/supabase';

export function PageEditor() {
  const context = useContext(ContentContext);
  const pageContent = context?.data?.pageContent || {};
  const refreshContent = context?.refreshContent;

  const [activePage, setActivePage] = useState('home');
  const [feedback, setFeedback] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const pages = [
    { id: 'home', label: 'Home Page', icon: 'cottage' },
    { id: 'menu', label: 'Menu Header', icon: 'restaurant_menu' },
    { id: 'about', label: 'About Page', icon: 'potted_plant' },
    { id: 'contact', label: 'Contact & Map', icon: 'mark_email_read' },
    { id: 'footer', label: 'Footer & Club', icon: 'vertical_align_bottom' },
    { id: 'privacy', label: 'Privacy Policy', icon: 'shield' },
    { id: 'terms', label: 'Terms of Service', icon: 'verified' },
  ];

  // Save a section
  const handleSaveSection = async (page, sectionKey, content, isVisible = true) => {
    setSavingKey(`${page}-${sectionKey}`);

    if (!isSupabaseConfigured() || !supabase) {
      showToast(`Saved ${sectionKey} locally (offline mode)`);
      setSavingKey(null);
      return;
    }

    try {
      // 1. Snapshot previous version
      const oldSection = pageContent?.[page]?.[sectionKey];
      if (oldSection) {
        await saveContentVersion({
          page,
          sectionKey,
          content: oldSection,
          changedBy: 'admin',
        });
      }

      // 2. Upsert to page_content
      const { error } = await supabase.from('page_content').upsert(
        [
          {
            page,
            section_key: sectionKey,
            content,
            visible: isVisible !== false,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'page,section_key' }
      );

      if (error) throw error;

      await logAuditEvent({
        action: 'UPDATE_PAGE_CONTENT',
        entityType: 'page_content',
        entityId: `${page}/${sectionKey}`,
        oldValue: oldSection,
        newValue: content,
      });

      showToast(`Updated ${page} > ${sectionKey} successfully!`);
      if (refreshContent) refreshContent();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSavingKey(null);
    }
  };

  // Image upload handler
  const handleUploadImage = async (e, onImageSet) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large! Max 5MB.', true);
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadMediaFile(file, file.name);
      onImageSet(result.url);
      showToast('Image uploaded and optimized to WebP!');
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, true);
    } finally {
      setUploadingImage(false);
    }
  };

  const currentPageSections = pageContent[activePage] || {};

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
            Page Content Editor
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Edit every visible headline, paragraph, card repeater, and image across the entire restaurant site without touching code.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold shadow-2xs self-start sm:self-auto border border-white/60"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">visibility</span>
          <span>Preview Live Website</span>
        </a>
      </div>

      {/* Page Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {pages.map((p) => {
          const isActive = activePage === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePage(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-2xs ${
                isActive
                  ? 'bg-secondary text-on-secondary shadow-sm font-bold scale-[1.02]'
                  : 'bg-[#FDFAF3] text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-white/80'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Page Sections */}
      <div className="space-y-6">
        {activePage === 'home' && (
          <>
            <SectionFormCard
              title="Hero Section"
              description="Top banner headline, tagline pill, subtitle, call-to-actions, and background photo."
              sectionKey="hero"
              initialData={currentPageSections.hero}
              saving={savingKey === 'home-hero'}
              uploading={uploadingImage}
              onUploadImage={handleUploadImage}
              onSave={(data, vis) => handleSaveSection('home', 'hero', data, vis)}
              fields={[
                { key: 'taglinePill', label: 'Tagline Pill', type: 'text' },
                { key: 'headlineWord1', label: 'Headline Word 1 (Green)', type: 'text' },
                { key: 'headlineWord2', label: 'Headline Word 2', type: 'text' },
                { key: 'headlineWord3', label: 'Headline Word 3 (Italic Underlined)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle Paragraph', type: 'textarea' },
                { key: 'ctaPrimaryLabel', label: 'Primary Button Label', type: 'text' },
                { key: 'ctaPrimaryLink', label: 'Primary Button Link', type: 'text' },
                { key: 'ctaSecondaryLabel', label: 'Secondary Button Label', type: 'text' },
                { key: 'ctaSecondaryLink', label: 'Secondary Button Link', type: 'text' },
                { key: 'heroImage', label: 'Hero Background Image URL', type: 'image' },
                { key: 'ratingNumber', label: 'Rating Display (e.g. 4.9)', type: 'text' },
                { key: 'ratingSubtitle', label: 'Reviews Subtitle', type: 'text' },
              ]}
            />

            <SectionFormCard
              title="Specials & Popular Dishes Header"
              description="Title and badge above the popular dishes grid."
              sectionKey="specials"
              initialData={currentPageSections.specials}
              saving={savingKey === 'home-specials'}
              onSave={(data, vis) => handleSaveSection('home', 'specials', data, vis)}
              fields={[
                { key: 'badge', label: 'Section Badge Pill', type: 'text' },
                { key: 'title', label: 'Heading Title', type: 'text' },
                { key: 'subtitle', label: 'Subtitle Text', type: 'textarea' },
                { key: 'ctaLabel', label: 'Full Menu Button Label', type: 'text' },
              ]}
            />

            <SectionFormCard
              title="Story & Ambience Mosaic"
              description="Botanical atmosphere copy, stats (100% natural, zero additives), and cafe pictures."
              sectionKey="story"
              initialData={currentPageSections.story}
              saving={savingKey === 'home-story'}
              uploading={uploadingImage}
              onUploadImage={handleUploadImage}
              onSave={(data, vis) => handleSaveSection('home', 'story', data, vis)}
              fields={[
                { key: 'badge', label: 'Badge Pill', type: 'text' },
                { key: 'title', label: 'Story Headline', type: 'text' },
                { key: 'paragraph', label: 'Atmosphere Paragraph', type: 'textarea' },
                { key: 'stat1Value', label: 'Stat 1 Value (e.g. 100%)', type: 'text' },
                { key: 'stat1Label', label: 'Stat 1 Label', type: 'text' },
                { key: 'stat2Value', label: 'Stat 2 Value (e.g. Zero)', type: 'text' },
                { key: 'stat2Label', label: 'Stat 2 Label', type: 'text' },
                { key: 'image1', label: 'Barista Photo URL', type: 'image' },
                { key: 'image2', label: 'Friends Table Photo URL', type: 'image' },
                { key: 'card1Title', label: 'Reservation Card Title', type: 'text' },
                { key: 'card1Text', label: 'Reservation Card Text', type: 'textarea' },
                { key: 'card2Title', label: 'Gatherings Card Title', type: 'text' },
                { key: 'card2Text', label: 'Gatherings Card Text', type: 'textarea' },
              ]}
            />
          </>
        )}

        {activePage === 'menu' && (
          <SectionFormCard
            title="Menu Top Header"
            description="Page title and subtitle displayed above the dish categories."
            sectionKey="header"
            initialData={currentPageSections.header}
            saving={savingKey === 'menu-header'}
            onSave={(data, vis) => handleSaveSection('menu', 'header', data, vis)}
            fields={[
              { key: 'badge', label: 'Badge Pill', type: 'text' },
              { key: 'title', label: 'Main Headline', type: 'text' },
              { key: 'subtitle', label: 'Subtitle Description', type: 'textarea' },
            ]}
          />
        )}

        {activePage === 'about' && (
          <>
            <SectionFormCard
              title="About Header Intro"
              description="Intro badge and story heading."
              sectionKey="intro"
              initialData={currentPageSections.intro}
              saving={savingKey === 'about-intro'}
              onSave={(data, vis) => handleSaveSection('about', 'intro', data, vis)}
              fields={[
                { key: 'badge', label: 'Badge Pill', type: 'text' },
                { key: 'title', label: 'Headline', type: 'text' },
                { key: 'subtitle', label: 'Intro Paragraph', type: 'textarea' },
              ]}
            />

            <SectionFormCard
              title="Founder & Kitchen Story"
              description="Background story copy, photo, and year established."
              sectionKey="story"
              initialData={currentPageSections.story}
              saving={savingKey === 'about-story'}
              uploading={uploadingImage}
              onUploadImage={handleUploadImage}
              onSave={(data, vis) => handleSaveSection('about', 'story', data, vis)}
              fields={[
                { key: 'badge', label: 'Badge Pill', type: 'text' },
                { key: 'title', label: 'Headline', type: 'text' },
                { key: 'paragraph1', label: 'Story Paragraph 1', type: 'textarea' },
                { key: 'paragraph2', label: 'Story Paragraph 2', type: 'textarea' },
                { key: 'image', label: 'Interior Photo URL', type: 'image' },
                { key: 'since', label: 'Year Established (e.g. 2018)', type: 'text' },
                { key: 'ctaLabel', label: 'Button Label', type: 'text' },
              ]}
            />

            <SectionFormCard
              title="Hungry CTA Banner"
              description="Bottom call-to-action banner on the About page."
              sectionKey="cta_banner"
              initialData={currentPageSections.cta_banner}
              saving={savingKey === 'about-cta_banner'}
              onSave={(data, vis) => handleSaveSection('about', 'cta_banner', data, vis)}
              fields={[
                { key: 'title', label: 'Banner Headline', type: 'text' },
                { key: 'subtitle', label: 'Banner Subtitle', type: 'textarea' },
                { key: 'buttonLabel', label: 'Button Label', type: 'text' },
              ]}
            />
          </>
        )}

        {activePage === 'contact' && (
          <>
            <SectionFormCard
              title="Contact Header"
              description="Contact page heading and reply time chips."
              sectionKey="header"
              initialData={currentPageSections.header}
              saving={savingKey === 'contact-header'}
              onSave={(data, vis) => handleSaveSection('contact', 'header', data, vis)}
              fields={[
                { key: 'badge', label: 'Badge Pill', type: 'text' },
                { key: 'title', label: 'Headline', type: 'text' },
                { key: 'subtitle', label: 'Subtitle Description', type: 'textarea' },
                { key: 'chip1Text', label: 'Chip 1 Text', type: 'text' },
                { key: 'chip2Text', label: 'Chip 2 Text', type: 'text' },
              ]}
            />

            <SectionFormCard
              title="Neighborhood Walk & Google Map"
              description="Interactive map title and Google query string."
              sectionKey="map_section"
              initialData={currentPageSections.map_section}
              saving={savingKey === 'contact-map_section'}
              onSave={(data, vis) => handleSaveSection('contact', 'map_section', data, vis)}
              fields={[
                { key: 'badge', label: 'Badge', type: 'text' },
                { key: 'title', label: 'Finding Us Title', type: 'text' },
                { key: 'desc', label: 'Neighborhood Description', type: 'textarea' },
                { key: 'mapQuery', label: 'Map Search Query (e.g. I-8 Markaz, Islamabad)', type: 'text' },
              ]}
            />
          </>
        )}

        {activePage === 'footer' && (
          <SectionFormCard
            title="Footer & Foodie Club Copy"
            description="Tagline, newsletter invitation text, and credits."
            sectionKey="content"
            initialData={currentPageSections.content}
            saving={savingKey === 'footer-content'}
            onSave={(data, vis) => handleSaveSection('footer', 'content', data, vis)}
            fields={[
              { key: 'tagline', label: 'Brand Tagline Sentence', type: 'textarea' },
              { key: 'newsletterTitle', label: 'Newsletter Heading', type: 'text' },
              { key: 'newsletterSubtitle', label: 'Newsletter Subtitle', type: 'textarea' },
              { key: 'copyright', label: 'Copyright Notice', type: 'text' },
              { key: 'builtBy', label: 'Designer/Developer Credit', type: 'text' },
            ]}
          />
        )}

        {activePage === 'privacy' && (
          <SectionFormCard
            title="Privacy Policy Text"
            description="Full policy statement and customer trust promises."
            sectionKey="body"
            initialData={currentPageSections.body}
            saving={savingKey === 'privacy-body'}
            onSave={(data, vis) => handleSaveSection('privacy', 'body', data, vis)}
            fields={[
              { key: 'badge', label: 'Badge Pill', type: 'text' },
              { key: 'title', label: 'Document Title', type: 'text' },
              { key: 'lastUpdated', label: 'Last Updated Date', type: 'text' },
              { key: 'intro', label: 'Introductory Statement', type: 'textarea' },
              { key: 'section1Title', label: 'Section 1 Title', type: 'text' },
              { key: 'section1Text', label: 'Section 1 Text', type: 'textarea' },
              { key: 'section2Title', label: 'Section 2 Title', type: 'text' },
              { key: 'section2Text', label: 'Section 2 Text', type: 'textarea' },
              { key: 'section3Title', label: 'Section 3 Title', type: 'text' },
              { key: 'section3Text', label: 'Section 3 Text', type: 'textarea' },
              { key: 'section4Title', label: 'Section 4 Title', type: 'text' },
            ]}
          />
        )}

        {activePage === 'terms' && (
          <SectionFormCard
            title="Terms of Service Text"
            description="House etiquette, dining terms, and reservation policies."
            sectionKey="body"
            initialData={currentPageSections.body}
            saving={savingKey === 'terms-body'}
            onSave={(data, vis) => handleSaveSection('terms', 'body', data, vis)}
            fields={[
              { key: 'badge', label: 'Badge Pill', type: 'text' },
              { key: 'title', label: 'Document Title', type: 'text' },
              { key: 'lastUpdated', label: 'Last Updated Date', type: 'text' },
              { key: 'intro', label: 'Introductory Statement', type: 'textarea' },
              { key: 'section1Title', label: 'Section 1 Title', type: 'text' },
              { key: 'section1Text', label: 'Section 1 Text', type: 'textarea' },
              { key: 'section2Title', label: 'Section 2 Title', type: 'text' },
              { key: 'section2Text', label: 'Section 2 Text', type: 'textarea' },
              { key: 'section3Title', label: 'Section 3 Title', type: 'text' },
              { key: 'section3Text', label: 'Section 3 Text', type: 'textarea' },
              { key: 'section4Title', label: 'Section 4 Title', type: 'text' },
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------
// SUB-COMPONENT: SECTION FORM CARD WITH VISIBILITY TOGGLE & IMAGE PICKER
// ------------------------------------------------------------------------------
function SectionFormCard({
  title,
  description,
  initialData = {},
  fields = [],
  saving,
  uploading,
  onUploadImage,
  onSave,
}) {
  const [formData, setFormData] = useState(initialData);
  const [isVisible, setIsVisible] = useState(initialData._visible !== false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, isVisible);
  };

  return (
    <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-5">
      {/* Header with Title and Visibility Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
        <div>
          <h2 className="font-headline-sm text-lg font-bold text-[#243022]">{title}</h2>
          <p className="text-xs text-on-surface-variant">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="w-4 h-4 rounded accent-secondary cursor-pointer"
            />
            <span>{isVisible ? 'Section Visible' : 'Section Hidden'}</span>
          </label>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => {
            const isTextarea = f.type === 'textarea';
            const isImage = f.type === 'image';
            const colSpan = isTextarea ? 'md:col-span-2' : 'col-span-1';

            return (
              <div key={f.key} className={`space-y-1.5 ${colSpan}`}>
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>{f.label}</span>
                </label>

                {isImage ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData[f.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder="/images/example.jpg"
                        className="flex-1 bg-surface-container-lowest text-xs p-2.5 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary"
                      />
                      <label className="px-3 py-2 bg-secondary text-on-secondary rounded-2xl text-xs font-semibold cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>{uploading ? 'Compressing...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          onChange={(e) =>
                            onUploadImage(e, (url) => setFormData({ ...formData, [f.key]: url }))
                          }
                          className="hidden"
                        />
                      </label>
                    </div>

                    {formData[f.key] && (
                      <div className="w-24 h-16 rounded-xl overflow-hidden bg-surface-container border border-white/60 shadow-2xs">
                        <img
                          src={formData[f.key]}
                          alt="Section preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : isTextarea ? (
                  <textarea
                    rows={3}
                    value={formData[f.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="w-full bg-surface-container-lowest text-xs sm:text-sm p-3 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[f.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="w-full bg-surface-container-lowest text-xs sm:text-sm p-2.5 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save Section</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PageEditor;
