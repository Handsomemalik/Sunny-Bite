import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMenu, useSettings } from '../../context/ContentContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function Dashboard() {
  const { allItems, categories } = useMenu();
  const { brand } = useSettings();

  const [counts, setCounts] = useState({
    dishes: allItems.length || 18,
    categories: categories.length || 9,
    newOrders: 0,
    newMessages: 0,
    newReservations: 0,
    subscribers: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSupabaseConfigured() || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const [ordersRes, msgsRes, resRes, subsRes, auditRes] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('subscribers').select('*', { count: 'exact', head: true }),
          supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(6),
        ]);

        setCounts({
          dishes: allItems.length,
          categories: categories.length,
          newOrders: ordersRes.count || 0,
          newMessages: msgsRes.count || 0,
          newReservations: resRes.count || 0,
          subscribers: subsRes.count || 0,
        });

        if (auditRes.data && auditRes.data.length > 0) {
          setRecentActivities(auditRes.data);
        }
      } catch (err) {
        console.warn('[Dashboard] Data fetch warning:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [allItems.length, categories.length]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#EFFEE8] via-[#FDFAF3] to-[#F9E4EA] border border-white/80 shadow-warm-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>Live Restaurant Portal</span>
          </div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#243022] font-semibold">
            Welcome to {brand.name || 'SunnyBite'} Admin
          </h1>
          <p className="font-body-md text-on-surface-variant text-sm max-w-xl">
            Edit dishes, prices, images, page headlines, and inspect guest reservations directly from this dashboard.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/menu?new=true"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary text-on-secondary font-label-lg text-xs font-semibold shadow-xs hover:opacity-90 hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add New Dish</span>
          </Link>
          <Link
            to="/admin/pages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-container text-on-primary font-label-lg text-xs font-semibold shadow-xs hover:bg-primary transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>Edit Homepage</span>
          </Link>
          <Link
            to="/admin/inbox"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-on-surface font-label-lg text-xs font-semibold shadow-xs border border-surface-container hover:bg-surface-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">inbox</span>
            <span>View Inbox</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid (6 Badges) */}
      <div>
        <h2 className="font-headline-sm text-lg text-[#243022] font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">analytics</span>
          <span>Overview &amp; Inbound Submissions</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Dishes */}
          <Link
            to="/admin/menu"
            className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:scale-[1.02] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
            </div>
            <div className="font-display-lg text-2xl sm:text-3xl text-primary font-bold">
              {counts.dishes}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant font-medium mt-0.5">
              Menu Dishes
            </div>
          </Link>

          {/* Categories */}
          <Link
            to="/admin/menu"
            className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:scale-[1.02] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[20px]">category</span>
            </div>
            <div className="font-display-lg text-2xl sm:text-3xl text-secondary font-bold">
              {counts.categories}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant font-medium mt-0.5">
              Categories
            </div>
          </Link>

          {/* New Orders */}
          <Link
            to="/admin/inbox?tab=orders"
            className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:scale-[1.02] transition-all group relative overflow-hidden"
          >
            {counts.newOrders > 0 && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px] animate-pulse">
                NEW
              </span>
            )}
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            </div>
            <div className="font-display-lg text-2xl sm:text-3xl text-[#243022] font-bold">
              {counts.newOrders}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant font-medium mt-0.5">
              New Orders
            </div>
          </Link>

          {/* New Reservations */}
          <Link
            to="/admin/inbox?tab=reservations"
            className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:scale-[1.02] transition-all group relative overflow-hidden"
          >
            {counts.newReservations > 0 && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px] animate-pulse">
                NEW
              </span>
            )}
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[20px]">event_seat</span>
            </div>
            <div className="font-display-lg text-2xl sm:text-3xl text-[#243022] font-bold">
              {counts.newReservations}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant font-medium mt-0.5">
              Reservations
            </div>
          </Link>

          {/* New Messages */}
          <Link
            to="/admin/inbox?tab=messages"
            className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:scale-[1.02] transition-all group relative overflow-hidden"
          >
            {counts.newMessages > 0 && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px] animate-pulse">
                NEW
              </span>
            )}
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div className="font-display-lg text-2xl sm:text-3xl text-[#243022] font-bold">
              {counts.newMessages}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant font-medium mt-0.5">
              Messages
            </div>
          </Link>

          {/* Subscribers */}
          <Link
            to="/admin/inbox?tab=subscribers"
            className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:scale-[1.02] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[20px]">loyalty</span>
            </div>
            <div className="font-display-lg text-2xl sm:text-3xl text-[#243022] font-bold">
              {counts.subscribers}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant font-medium mt-0.5">
              Foodie Club
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Quick Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fast Navigation Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-headline-sm text-lg text-[#243022] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
            <span>Quick Workspaces</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/menu"
              className="p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:border-secondary transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-secondary text-[24px]">restaurant_menu</span>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </div>
              <h3 className="font-title-md text-base text-[#243022] font-bold">Manage Menu &amp; Dishes</h3>
              <p className="font-caption text-xs text-on-surface-variant leading-relaxed">
                Add photos, update prices, toggle "Sold out" on dishes, and reorder categories.
              </p>
            </Link>

            <Link
              to="/admin/pages"
              className="p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:border-primary transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-primary text-[24px]">edit_note</span>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </div>
              <h3 className="font-title-md text-base text-[#243022] font-bold">Page Content Editor</h3>
              <p className="font-caption text-xs text-on-surface-variant leading-relaxed">
                Edit headlines, paragraphs, story text, arrival tips, and button labels with live preview.
              </p>
            </Link>

            <Link
              to="/admin/assistant"
              className="p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:border-secondary transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-secondary text-[24px]">smart_toy</span>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </div>
              <h3 className="font-title-md text-base text-[#243022] font-bold">AI Assistant Knowledge</h3>
              <p className="font-caption text-xs text-on-surface-variant leading-relaxed">
                Configure greeting, quick-replies, dish aliases, and test replies in a sandbox chat.
              </p>
            </Link>

            <Link
              to="/admin/settings"
              className="p-5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm hover:shadow-warm-md hover:border-tertiary transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-tertiary text-[24px]">tune</span>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </div>
              <h3 className="font-title-md text-base text-[#243022] font-bold">Site Settings &amp; Timings</h3>
              <p className="font-caption text-xs text-on-surface-variant leading-relaxed">
                Update phone, WhatsApp, opening hours, stats (4.9 rating), and the announcement banner.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Audit Log & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-lg text-[#243022] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">history</span>
              <span>Recent Activity</span>
            </h2>
            <Link to="/admin/backup" className="text-xs text-secondary hover:underline font-semibold">
              View All Logs
            </Link>
          </div>

          <div className="p-5 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant space-y-2">
                <span className="material-symbols-outlined text-[32px] text-outline">verified</span>
                <p className="text-xs">Database ready. Changes you save will be logged here with timestamps.</p>
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container/50 flex items-start gap-3 text-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                    {act.action === 'CREATE' ? 'add_circle' : act.action === 'DELETE' ? 'delete' : 'edit'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">
                      {act.action} · {act.entity_type}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      By {act.user_email || 'admin'} · {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
