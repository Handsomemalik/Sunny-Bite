import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, uploadMediaFile, logAuditEvent } from '../../lib/supabase';

export function MediaLibrary() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Selected media for modal / detail / edit
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadMedia = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Local fallback initial assets
      setMediaList([
        { id: '1', url: '/images/hero-interior.jpg', path: 'hero-interior.jpg', alt_text: 'SunnyBite botanical bistro interior dining room', width: 1600, height: 1067, size: 342000, created_at: new Date().toISOString() },
        { id: '2', url: '/images/story-barista.jpg', path: 'story-barista.jpg', alt_text: 'Barista frothing oat milk for latte', width: 800, height: 600, size: 145000, created_at: new Date().toISOString() },
        { id: '3', url: '/images/story-friends.jpg', path: 'story-friends.jpg', alt_text: 'Friends sharing food and iced tea at round table', width: 800, height: 600, size: 158000, created_at: new Date().toISOString() },
        { id: '4', url: '/images/about-interior.jpg', path: 'about-interior.jpg', alt_text: 'Sunlit botanical dining room with dusty rose chairs', width: 1200, height: 800, size: 260000, created_at: new Date().toISOString() },
        { id: '5', url: '/images/dish-classic-cheeseburger.jpg', path: 'dish-classic-cheeseburger.jpg', alt_text: 'Classic Cheeseburger', width: 600, height: 600, size: 95000, created_at: new Date().toISOString() },
        { id: '6', url: '/images/dish-creamy-alfredo-pasta.jpg', path: 'dish-creamy-alfredo-pasta.jpg', alt_text: 'Creamy Alfredo Pasta', width: 600, height: 600, size: 98000, created_at: new Date().toISOString() },
        { id: '7', url: '/logo-horizontal.svg', path: 'logo-horizontal.svg', alt_text: 'SunnyBite brand logo', width: 400, height: 120, size: 18813, created_at: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaList(data || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Handle files upload
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Compressing & uploading ${i + 1} of ${files.length} (${file.name})...`);

        if (file.size > 15 * 1024 * 1024) {
          showToast(`Skipped ${file.name}: file exceeds 15MB limit.`, true);
          continue;
        }

        await uploadMediaFile(file, file.name);
      }

      showToast(`Uploaded ${files.length} image(s) optimized in WebP format!`);
      loadMedia();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    showToast('Image URL copied to clipboard! Ready to paste into menu or page editors.');
  };

  // Delete media
  const handleDeleteMedia = async (media) => {
    setDeleteConfirm(null);
    if (!isSupabaseConfigured() || !supabase) {
      setMediaList(mediaList.filter((m) => m.id !== media.id));
      showToast('Deleted locally');
      return;
    }

    try {
      // 1. Delete from storage bucket
      if (media.path) {
        await supabase.storage.from('site-media').remove([media.path]);
      }

      // 2. Delete row from public.media
      await supabase.from('media').delete().eq('id', media.id);

      await logAuditEvent({
        action: 'DELETE',
        entityType: 'media',
        entityId: media.id,
        oldValue: media,
      });

      showToast('Media removed from library.');
      loadMedia();
      if (selectedMedia?.id === media.id) setSelectedMedia(null);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Update alt text
  const handleUpdateAltText = async (mediaId, newAlt) => {
    if (!isSupabaseConfigured() || !supabase) {
      setMediaList(mediaList.map((m) => (m.id === mediaId ? { ...m, alt_text: newAlt } : m)));
      showToast('Alt text updated locally');
      return;
    }

    try {
      await supabase.from('media').update({ alt_text: newAlt }).eq('id', mediaId);
      showToast('Alt text saved');
      loadMedia();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    return (
      (m.alt_text && m.alt_text.toLowerCase().includes(search.toLowerCase())) ||
      (m.url && m.url.toLowerCase().includes(search.toLowerCase())) ||
      (m.path && m.path.toLowerCase().includes(search.toLowerCase()))
    );
  });

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
            Media Library
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Upload dish photos and banners. Files are automatically resized and converted to lightweight WebP format.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mobile Camera Upload Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="sm:hidden px-4 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>Camera</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
          />

          {/* Standard Upload Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>{isUploading ? 'Uploading...' : 'Upload Media'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleUploadFiles(e.dataTransfer.files);
        }}
        className="p-8 rounded-3xl bg-[#FDFAF3] border-2 border-dashed border-secondary/30 hover:border-secondary transition-all text-center space-y-2 cursor-pointer shadow-2xs group"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
        </div>
        <p className="font-title-md text-sm font-bold text-[#243022]">
          Drop photos here or click to browse
        </p>
        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
          High-resolution photos will be automatically converted to optimized WebP format (~80% compression, max 1600px width).
        </p>
        {uploadProgress && (
          <p className="text-xs font-bold text-secondary animate-pulse pt-2">
            {uploadProgress}
          </p>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-2xs flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-outline ml-2">search</span>
        <input
          type="text"
          placeholder="Search by alt text or file name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none"
        />
        <span className="text-xs text-on-surface-variant px-2">
          {filteredMedia.length} items
        </span>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredMedia.map((media) => (
          <div
            key={media.id}
            onClick={() => setSelectedMedia(media)}
            className="group relative rounded-2xl overflow-hidden bg-surface-container border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:border-secondary transition-all cursor-pointer flex flex-col aspect-square"
          >
            <img
              src={media.url}
              alt={media.alt_text || 'Media item'}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Hover details pill */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white text-[10px]">
              <p className="font-semibold truncate">{media.alt_text || media.path}</p>
              <div className="flex items-center justify-between opacity-80 pt-0.5">
                <span>{media.size ? `${Math.round(media.size / 1024)} KB` : 'WebP'}</span>
                <span>{media.width ? `${media.width}×${media.height}` : ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SELECTED MEDIA DETAILS MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFAF3] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-warm-elevated border border-white/80">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
                Media Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Preview Image */}
            <div className="w-full h-56 rounded-2xl overflow-hidden bg-surface-container border border-surface-container flex items-center justify-center">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt_text}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Alt Text / Description (SEO)</label>
                <input
                  type="text"
                  value={selectedMedia.alt_text || ''}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedMedia({ ...selectedMedia, alt_text: next });
                    handleUpdateAltText(selectedMedia.id, next);
                  }}
                  className="w-full bg-surface-container-lowest text-xs p-2.5 rounded-xl border border-surface-container"
                  placeholder="e.g. Delicious grilled chicken skewers with herbal garnish"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Public Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedMedia.url}
                    className="flex-1 bg-surface-container-lowest text-xs p-2.5 rounded-xl border border-surface-container font-mono text-[11px] truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedMedia.url)}
                    className="px-3.5 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-semibold shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-surface-container">
              <button
                type="button"
                onClick={() => setDeleteConfirm(selectedMedia)}
                className="text-xs text-error font-semibold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete Image</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="px-5 py-2 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFAF3] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-warm-elevated border border-error/30 text-center">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
              Delete this Image?
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              If this image is currently used on the menu or home page, it may show a broken link.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMedia(deleteConfirm)}
                className="flex-1 py-2.5 rounded-full bg-error text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaLibrary;
