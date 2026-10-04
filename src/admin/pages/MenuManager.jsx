import React, { useState, useMemo } from 'react';
import { useMenu } from '../../context/ContentContext';
import { DishCard } from '../../components/DishCard';
import { supabase, isSupabaseConfigured, logAuditEvent, uploadMediaFile } from '../../lib/supabase';

export function MenuManager() {
  const { allItems, categories, refreshMenu } = useMenu();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available' | 'soldout'

  // Modal states
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deleteConfirmDish, setDeleteConfirmDish] = useState(null);

  // Bulk selection
  const [selectedDishIds, setSelectedDishIds] = useState([]);

  // Toast / feedback message
  const [feedback, setFeedback] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return allItems.filter((dish) => {
      const matchesSearch =
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        (dish.description && dish.description.toLowerCase().includes(search.toLowerCase())) ||
        (dish.aliases && dish.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase())));

      const matchesCategory =
        selectedCategory === 'all' || dish.category === selectedCategory;

      const matchesAvailability =
        availabilityFilter === 'all'
          ? true
          : availabilityFilter === 'available'
          ? dish.available !== false
          : dish.available === false;

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [allItems, search, selectedCategory, availabilityFilter]);

  // Quick 1-tap Sold Out toggle
  const handleToggleSoldOut = async (dish, e) => {
    e.stopPropagation();
    const nextAvailable = dish.available === false ? true : false;

    if (!isSupabaseConfigured() || !supabase) {
      dish.available = nextAvailable;
      showToast(`${dish.name} marked as ${nextAvailable ? 'Available' : 'Sold Out'} (Offline Mode)`);
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: nextAvailable, updated_at: new Date().toISOString() })
        .eq('id', dish.id);

      if (error) throw error;

      await logAuditEvent({
        action: 'UPDATE_AVAILABILITY',
        entityType: 'menu_item',
        entityId: dish.id,
        oldValue: { available: dish.available },
        newValue: { available: nextAvailable },
      });

      showToast(`${dish.name} marked as ${nextAvailable ? 'Available' : 'Sold Out'}`);
      refreshMenu();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Delete dish
  const handleDeleteDish = async () => {
    if (!deleteConfirmDish) return;
    const dish = deleteConfirmDish;
    setDeleteConfirmDish(null);

    if (!isSupabaseConfigured() || !supabase) {
      showToast(`${dish.name} deleted (offline)`);
      return;
    }

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', dish.id);
      if (error) throw error;

      await logAuditEvent({
        action: 'DELETE',
        entityType: 'menu_item',
        entityId: dish.id,
        oldValue: dish,
      });

      showToast(`Deleted ${dish.name} successfully`);
      refreshMenu();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Duplicate dish
  const handleDuplicateDish = (dish) => {
    const duplicated = {
      ...dish,
      id: `${dish.id}-copy-${Date.now().toString().slice(-4)}`,
      name: `${dish.name} (Copy)`,
      sort_order: (dish.sort_order || 0) + 1,
    };
    setEditingDish(duplicated);
    setIsDishModalOpen(true);
  };

  // Reorder dish step (Up / Down)
  const handleMoveDish = async (dish, direction) => {
    const currentIndex = allItems.findIndex((d) => d.id === dish.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= allItems.length) return;

    const otherDish = allItems[targetIndex];
    if (!isSupabaseConfigured() || !supabase) {
      showToast('Reordered locally');
      return;
    }

    try {
      const tempOrder = dish.sort_order || currentIndex;
      const targetOrder = otherDish.sort_order || targetIndex;

      await Promise.all([
        supabase.from('menu_items').update({ sort_order: targetOrder }).eq('id', dish.id),
        supabase.from('menu_items').update({ sort_order: tempOrder }).eq('id', otherDish.id),
      ]);

      refreshMenu();
      showToast('Menu order updated');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Handle image upload from file input
  const handleImageUpload = async (e, setFormState) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large! Maximum limit is 5MB.', true);
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadMediaFile(file, file.name);
      setFormState((prev) => ({ ...prev, image: result.url }));
      showToast('Image compressed to WebP and uploaded!');
    } catch (err) {
      showToast(`Image upload failed: ${err.message}`, true);
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (dishId) => {
    setSelectedDishIds((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDishIds.length === filteredDishes.length) {
      setSelectedDishIds([]);
    } else {
      setSelectedDishIds(filteredDishes.map((d) => d.id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-warm-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            feedback.isErr
              ? 'bg-error text-white'
              : 'bg-secondary text-on-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedback.isErr ? 'error' : 'check_circle'}
          </span>
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#243022] font-semibold">
            Menu Manager
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Manage all 18+ restaurant dishes, pricing, sold-out statuses, and natural language aliases for the AI assistant.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-xs font-semibold border border-surface-container/60 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">category</span>
            <span>Categories</span>
          </button>

          {selectedDishIds.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed font-label-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all animate-bounce"
            >
              <span className="material-symbols-outlined text-[18px]">checklist</span>
              <span>Bulk Edit ({selectedDishIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingDish({
                id: '',
                name: '',
                category: 'starters',
                price: 500,
                description: '',
                shortDescription: '',
                image: '/images/dish-classic-cheeseburger.jpg',
                tags: [],
                dietary: 'Vegetarian',
                badge: '',
                popular: false,
                available: true,
                aliases: [],
                sort_order: allItems.length + 1,
                visible: true,
              });
              setIsDishModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by dish name, ingredient, or chatbot alias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-lowest text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary shadow-2xs"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-surface-container-lowest text-xs sm:text-sm px-3 py-2.5 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary shadow-2xs text-on-surface"
          >
            <option value="all">All Categories ({allItems.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || c.name}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-surface-container-lowest text-xs sm:text-sm px-3 py-2.5 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary shadow-2xs text-on-surface"
          >
            <option value="all">All Availability</option>
            <option value="available">Available Only</option>
            <option value="soldout">Sold Out Only</option>
          </select>

          {/* Select all toggle */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-2.5 rounded-2xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold whitespace-nowrap"
          >
            {selectedDishIds.length === filteredDishes.length ? 'Deselect' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Dishes List (Responsive Cards) */}
      <div className="space-y-3">
        {filteredDishes.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#FDFAF3] border border-white/80 text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
            <p className="text-sm font-semibold">No dishes match your filter criteria.</p>
          </div>
        ) : (
          filteredDishes.map((dish, idx) => (
            <div
              key={dish.id}
              className={`p-4 rounded-3xl bg-[#FDFAF3] border transition-all shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                dish.available === false
                  ? 'border-amber-200 bg-amber-50/40 opacity-85'
                  : 'border-white/80 hover:border-secondary/40'
              }`}
            >
              {/* Checkbox + Image + Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedDishIds.includes(dish.id)}
                  onChange={() => handleToggleSelect(dish.id)}
                  className="w-4 h-4 rounded accent-secondary cursor-pointer"
                />

                {/* Dish Thumb */}
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-container shrink-0 border border-white/60">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                  {dish.available === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-error/90 px-1 py-0.5 rounded">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-title-md text-sm sm:text-base font-bold text-[#243022] truncate">
                      {dish.name}
                    </h3>
                    {dish.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        {dish.badge}
                      </span>
                    )}
                    {dish.popular && (
                      <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                        Popular
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                    {dish.description}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant flex-wrap">
                    <span className="font-bold text-primary text-xs">
                      Rs. {dish.price}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{dish.category}</span>
                    <span>•</span>
                    <span>{dish.dietary || 'Standard'}</span>
                    {dish.aliases && dish.aliases.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-secondary italic">
                          {dish.aliases.length} AI synonyms
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Strip */}
              <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container/60 shrink-0">
                {/* 1-Tap Sold Out Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSoldOut(dish, e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                    dish.available === false
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                  title="Toggle Sold Out Status"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {dish.available === false ? 'remove_shopping_cart' : 'check_circle'}
                  </span>
                  <span>{dish.available === false ? 'Sold Out' : 'Available'}</span>
                </button>

                {/* Move Up / Down */}
                <div className="flex items-center bg-surface-container rounded-full p-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveDish(dish, 'up')}
                    className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-on-surface disabled:opacity-30"
                    title="Move dish up"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    disabled={idx === filteredDishes.length - 1}
                    onClick={() => handleMoveDish(dish, 'down')}
                    className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-on-surface disabled:opacity-30"
                    title="Move dish down"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </button>
                </div>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingDish(dish);
                    setIsDishModalOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                  title="Edit dish details"
                >
                  <span className="material-symbols-outlined text-[17px]">edit</span>
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={() => handleDuplicateDish(dish)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                  title="Duplicate dish"
                >
                  <span className="material-symbols-outlined text-[17px]">content_copy</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmDish(dish)}
                  className="w-8 h-8 rounded-full bg-error-container/60 hover:bg-error-container text-error flex items-center justify-center transition-colors"
                  title="Delete dish"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DISH EDIT / ADD MODAL WITH LIVE PREVIEW */}
      {isDishModalOpen && editingDish && (
        <DishEditModal
          dish={editingDish}
          categories={categories}
          uploadingImage={uploadingImage}
          onImageUpload={handleImageUpload}
          onClose={() => setIsDishModalOpen(false)}
          onSave={async (savedDish) => {
            setIsDishModalOpen(false);
            if (!isSupabaseConfigured() || !supabase) {
              showToast('Dish saved in local state (offline)');
              return;
            }

            try {
              const dishId = savedDish.id || savedDish.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
              const payload = {
                id: dishId,
                name: savedDish.name,
                slug: dishId,
                category_id: savedDish.category,
                price: Number(savedDish.price),
                description: savedDish.description || '',
                short_description: savedDish.shortDescription || savedDish.description || '',
                image_url: savedDish.image,
                tags: Array.isArray(savedDish.tags) ? savedDish.tags : [],
                dietary: Array.isArray(savedDish.dietary) ? savedDish.dietary : [savedDish.dietary],
                badge: savedDish.badge || null,
                popular: !!savedDish.popular,
                available: savedDish.available !== false,
                aliases: Array.isArray(savedDish.aliases) ? savedDish.aliases : [],
                sort_order: Number(savedDish.sort_order || 0),
                visible: savedDish.visible !== false,
                updated_at: new Date().toISOString(),
              };

              const { error } = await supabase.from('menu_items').upsert([payload]);
              if (error) throw error;

              await logAuditEvent({
                action: editingDish.id ? 'UPDATE' : 'CREATE',
                entityType: 'menu_item',
                entityId: dishId,
                newValue: payload,
              });

              showToast(`Saved ${savedDish.name} successfully!`);
              refreshMenu();
            } catch (err) {
              showToast(err.message, true);
            }
          }}
        />
      )}

      {/* BULK EDIT MODAL */}
      {isBulkModalOpen && (
        <BulkEditModal
          selectedIds={selectedDishIds}
          categories={categories}
          onClose={() => setIsBulkModalOpen(false)}
          onApply={async ({ priceAction, priceVal, categoryAction, availabilityAction }) => {
            setIsBulkModalOpen(false);
            if (!isSupabaseConfigured() || !supabase) {
              showToast('Bulk update applied locally');
              return;
            }

            try {
              for (const dishId of selectedDishIds) {
                const target = allItems.find((d) => d.id === dishId);
                if (!target) continue;

                const updatePayload = { updated_at: new Date().toISOString() };

                if (priceAction === 'percent') {
                  const mult = 1 + Number(priceVal) / 100;
                  updatePayload.price = Math.round(target.price * mult);
                } else if (priceAction === 'fixed') {
                  updatePayload.price = Math.max(50, target.price + Number(priceVal));
                }

                if (categoryAction && categoryAction !== 'no_change') {
                  updatePayload.category_id = categoryAction;
                }

                if (availabilityAction === 'available') {
                  updatePayload.available = true;
                } else if (availabilityAction === 'soldout') {
                  updatePayload.available = false;
                }

                await supabase.from('menu_items').update(updatePayload).eq('id', dishId);
              }

              showToast(`Bulk updated ${selectedDishIds.length} dishes`);
              setSelectedDishIds([]);
              refreshMenu();
            } catch (err) {
              showToast(err.message, true);
            }
          }}
        />
      )}

      {/* CATEGORY MANAGER MODAL */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={refreshMenu}
          showToast={showToast}
        />
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirmDish && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFAF3] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-warm-elevated border border-error/30 text-center">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
              Delete "{deleteConfirmDish.name}"?
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This will remove this dish from the menu and website. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDish(null)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDish}
                className="flex-1 py-2.5 rounded-full bg-error text-white text-xs font-semibold shadow-sm hover:opacity-90"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------
// SUB-COMPONENT: DISH EDIT MODAL (WITH LIVE DISHCARD PREVIEW)
// ------------------------------------------------------------------------------
function DishEditModal({ dish, categories, uploadingImage, onImageUpload, onClose, onSave }) {
  const [form, setForm] = useState({
    ...dish,
    tagsString: Array.isArray(dish.tags) ? dish.tags.join(', ') : '',
    aliasesString: Array.isArray(dish.aliases) ? dish.aliases.join(', ') : '',
  });

  const previewDish = useMemo(() => {
    return {
      ...form,
      tags: form.tagsString.split(',').map((t) => t.trim()).filter(Boolean),
      aliases: form.aliasesString.split(',').map((a) => a.trim()).filter(Boolean),
    };
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(previewDish);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FDFAF3] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-warm-elevated border border-white/80 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">restaurant</span>
            <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-[#243022]">
              {dish.id ? `Edit: ${dish.name}` : 'Create New Dish'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body: Two columns (Form Left, Live Card Preview Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Form Fields (7 cols) */}
          <form id="dish-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">Dish Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-container-lowest text-xs sm:text-sm p-3 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-surface-container-lowest text-xs sm:text-sm p-3 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary capitalize"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Price (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-surface-container-lowest text-xs sm:text-sm p-3 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary font-bold text-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-surface-container-lowest text-xs sm:text-sm p-3 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary resize-none"
              />
            </div>

            {/* Image Selection / Upload */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface">Dish Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="flex-1 bg-surface-container-lowest text-xs p-2.5 rounded-2xl border border-surface-container focus:outline-none focus:border-secondary"
                  placeholder="/images/dish-classic-cheeseburger.jpg"
                />
                <label className="px-3.5 py-2.5 rounded-2xl bg-secondary text-on-secondary text-xs font-semibold cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  <span>{uploadingImage ? 'Compressing...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => onImageUpload(e, setForm)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Badges, Dietary, Popular */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Badge (e.g. Chef's Pick)</label>
                <input
                  type="text"
                  value={form.badge || ''}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="Organic, Chef's Pick, etc."
                  className="w-full bg-surface-container-lowest text-xs p-2.5 rounded-2xl border border-surface-container"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface">Dietary Label</label>
                <input
                  type="text"
                  value={form.dietary || ''}
                  onChange={(e) => setForm({ ...form, dietary: e.target.value })}
                  placeholder="Vegetarian, Gluten-Free, Vegan"
                  className="w-full bg-surface-container-lowest text-xs p-2.5 rounded-2xl border border-surface-container"
                />
              </div>
            </div>

            {/* Chatbot Aliases */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                <span>Chatbot Synonyms / Aliases</span>
                <span className="text-[10px] text-secondary font-normal">Comma-separated</span>
              </label>
              <input
                type="text"
                value={form.aliasesString}
                onChange={(e) => setForm({ ...form, aliasesString: e.target.value })}
                placeholder="burger, cheeseburger, classic burger, burgar"
                className="w-full bg-surface-container-lowest text-xs p-2.5 rounded-2xl border border-surface-container font-mono text-[11px]"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={form.available !== false}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  className="w-4 h-4 rounded accent-secondary"
                />
                <span>Available to Order</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={!!form.popular}
                  onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>Show on Homepage (Popular)</span>
              </label>
            </div>
          </form>

          {/* Right: Live Card Preview (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-3xl bg-surface-container-low/70 border border-surface-container space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">visibility</span>
                <span>Live Public Preview</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-on-surface-variant font-mono">
                DishCard
              </span>
            </div>
            <div className="pointer-events-none">
              <DishCard dish={previewDish} variant="menu" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-container bg-surface-container-lowest flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="dish-form"
            className="px-6 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Save Dish
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------
// SUB-COMPONENT: BULK EDIT MODAL
// ------------------------------------------------------------------------------
function BulkEditModal({ selectedIds, categories, onClose, onApply }) {
  const [priceAction, setPriceAction] = useState('none');
  const [priceVal, setPriceVal] = useState(10);
  const [categoryAction, setCategoryAction] = useState('no_change');
  const [availabilityAction, setAvailabilityAction] = useState('no_change');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFAF3] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-warm-elevated border border-white/80">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
            Bulk Edit ({selectedIds.length} Dishes)
          </h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Price Modifier */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-low">
            <label className="font-bold text-on-surface">Adjust Price</label>
            <div className="flex gap-2">
              <select
                value={priceAction}
                onChange={(e) => setPriceAction(e.target.value)}
                className="bg-surface-container-lowest p-2 rounded-xl text-xs flex-1"
              >
                <option value="none">No Price Change</option>
                <option value="percent">Adjust by % (e.g. +10% or -10%)</option>
                <option value="fixed">Adjust by Fixed Rs. (e.g. +50 or -50)</option>
              </select>
              {priceAction !== 'none' && (
                <input
                  type="number"
                  value={priceVal}
                  onChange={(e) => setPriceVal(e.target.value)}
                  className="w-20 bg-surface-container-lowest p-2 rounded-xl text-xs font-bold"
                />
              )}
            </div>
          </div>

          {/* Move Category */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-low">
            <label className="font-bold text-on-surface">Move Category</label>
            <select
              value={categoryAction}
              onChange={(e) => setCategoryAction(e.target.value)}
              className="w-full bg-surface-container-lowest p-2 rounded-xl text-xs"
            >
              <option value="no_change">Keep Current Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  Move to: {c.label || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-low">
            <label className="font-bold text-on-surface">Availability</label>
            <select
              value={availabilityAction}
              onChange={(e) => setAvailabilityAction(e.target.value)}
              className="w-full bg-surface-container-lowest p-2 rounded-xl text-xs"
            >
              <option value="no_change">Keep Current Status</option>
              <option value="available">Mark All as Available</option>
              <option value="soldout">Mark All as Sold Out</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-surface-container text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply({ priceAction, priceVal, categoryAction, availabilityAction })}
            className="flex-1 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------
// SUB-COMPONENT: CATEGORY MANAGER MODAL
// ------------------------------------------------------------------------------
function CategoryManagerModal({ categories, onClose, onSave, showToast }) {
  const [catList, setCatList] = useState(categories);
  const [newCatName, setNewCatName] = useState('');

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (!isSupabaseConfigured() || !supabase) {
      setCatList([...catList, { id: slug, label: newCatName.trim(), visible: true }]);
      setNewCatName('');
      showToast('Category added locally');
      return;
    }

    try {
      const { error } = await supabase.from('categories').insert([
        {
          id: slug,
          name: newCatName.trim(),
          slug,
          sort_order: catList.length + 1,
          visible: true,
        },
      ]);
      if (error) throw error;
      setNewCatName('');
      showToast(`Category "${newCatName}" added!`);
      onSave();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleToggleHide = async (cat) => {
    const nextVis = cat.visible === false ? true : false;
    if (!isSupabaseConfigured() || !supabase) {
      setCatList(catList.map((c) => (c.id === cat.id ? { ...c, visible: nextVis } : c)));
      return;
    }

    try {
      await supabase.from('categories').update({ visible: nextVis }).eq('id', cat.id);
      showToast(`Category visibility updated`);
      onSave();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFAF3] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-warm-elevated border border-white/80">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
            Category Manager
          </h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Add Category Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New Category Name (e.g. Specials)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-surface-container-lowest text-xs p-2.5 rounded-xl border border-surface-container"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-semibold"
          >
            Add
          </button>
        </div>

        {/* Existing List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {catList.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-on-surface">{cat.label || cat.name}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">({cat.id})</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleHide(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  cat.visible === false
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {cat.visible === false ? 'Hidden' : 'Visible'}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default MenuManager;
