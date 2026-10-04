import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured, logAuditEvent } from '../../lib/supabase';

export function Inbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';

  const [activeTab, setActiveTab] = useState(initialTab); // 'orders' | 'reservations' | 'messages' | 'subscribers'
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadTabData = async (tab) => {
    setLoading(true);
    if (!isSupabaseConfigured() || !supabase) {
      // Local demo data
      if (tab === 'orders') {
        setDataList([
          {
            id: 'ord-1',
            customer_name: 'Zainab Ahmed',
            customer_phone: '+92 300 1234567',
            order_type: 'Pickup',
            items: [
              { name: 'Classic Cheeseburger', qty: 2, price: 650 },
              { name: 'Fresh Mint Lemonade', qty: 2, price: 300 },
            ],
            total: 1900,
            status: 'new',
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (tab === 'reservations') {
        setDataList([
          {
            id: 'res-1',
            name: 'Hamza Khan',
            phone: '+92 321 9876543',
            email: 'hamza@example.com',
            guests: 4,
            date: '2026-10-05',
            time: '20:00',
            seating_area: 'Indoor Dining',
            notes: 'Anniversary dinner by window',
            status: 'new',
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (tab === 'messages') {
        setDataList([
          {
            id: 'msg-1',
            name: 'Sara Malik',
            email: 'sara@example.com',
            phone: '+92 333 5556677',
            subject: 'Private Birthday Gathering',
            message: 'Inquiring about hosting 25 guests in conservatory on Sunday afternoon.',
            status: 'new',
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        setDataList([
          {
            id: 'sub-1',
            email: 'foodie.club@example.com',
            source: 'footer_foodie_club',
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setLoading(false);
      return;
    }

    try {
      const tableName =
        tab === 'orders'
          ? 'orders'
          : tab === 'reservations'
          ? 'reservations'
          : tab === 'messages'
          ? 'messages'
          : 'subscribers';

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDataList(data || []);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  // Update item status
  const handleUpdateStatus = async (item, newStatus) => {
    const tableName =
      activeTab === 'orders'
        ? 'orders'
        : activeTab === 'reservations'
        ? 'reservations'
        : activeTab === 'messages'
        ? 'messages'
        : 'subscribers';

    if (!isSupabaseConfigured() || !supabase) {
      setDataList(dataList.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d)));
      showToast(`Status updated to "${newStatus}" locally`);
      return;
    }

    try {
      const { error } = await supabase.from(tableName).update({ status: newStatus }).eq('id', item.id);
      if (error) throw error;

      await logAuditEvent({
        action: 'UPDATE_INBOX_STATUS',
        entityType: tableName,
        entityId: item.id,
        newValue: { status: newStatus },
      });

      showToast(`Marked as ${newStatus}`);
      loadTabData(activeTab);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Export subscribers to CSV
  const handleExportCsv = () => {
    if (dataList.length === 0) {
      showToast('No subscribers to export', true);
      return;
    }

    const headers = ['Email', 'Status', 'Subscribed Date'];
    const rows = dataList.map((sub) => [
      sub.email,
      sub.status || 'active',
      new Date(sub.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sunnybite-subscribers-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV downloaded!');
  };

  const filteredItems = dataList.filter((item) => {
    const matchesStatus =
      statusFilter === 'all' ? true : item.status === statusFilter;

    const term = search.toLowerCase();
    const matchesSearch =
      (item.customer_name && item.customer_name.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.email && item.email.toLowerCase().includes(term)) ||
      (item.customer_phone && item.customer_phone.includes(term)) ||
      (item.phone && item.phone.includes(term)) ||
      (item.message && item.message.toLowerCase().includes(term));

    return matchesStatus && (search ? matchesSearch : true);
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
            Inbound Submissions
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Review incoming customer orders, table reservations, contact requests, and Foodie Club newsletter members.
          </p>
        </div>

        {activeTab === 'subscribers' && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-5 py-2.5 rounded-full bg-secondary text-on-secondary font-label-lg text-xs font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Subscribers to CSV</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'orders', label: 'Orders', icon: 'shopping_bag' },
          { id: 'reservations', label: 'Reservations', icon: 'event_seat' },
          { id: 'messages', label: 'Contact Messages', icon: 'mail' },
          { id: 'subscribers', label: 'Foodie Club', icon: 'loyalty' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-2xs ${
                isActive
                  ? 'bg-secondary text-on-secondary shadow-sm font-bold scale-[1.02]'
                  : 'bg-[#FDFAF3] text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-white/80'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#FDFAF3] border border-white/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm pl-9 pr-3 focus:outline-none"
          />
        </div>

        {activeTab !== 'subscribers' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-lowest text-xs px-3 py-2 rounded-xl border border-surface-container"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="seen">Seen</option>
            <option value="confirmed">Confirmed</option>
            <option value="done">Done</option>
          </select>
        )}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#FDFAF3] border border-white/80 text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-[36px] text-outline">inbox</span>
            <p className="text-sm font-semibold">No submissions found in this category.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm transition-all space-y-3 ${
                item.status === 'new' ? 'ring-1 ring-primary/40' : ''
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {item.status === 'new' && (
                    <span className="px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px] uppercase">
                      New
                    </span>
                  )}
                  <h3 className="font-title-md text-base font-bold text-[#243022]">
                    {item.customer_name || item.name || item.email}
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    {new Date(item.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {/* Status Switcher */}
                {activeTab !== 'subscribers' && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {['new', 'seen', 'confirmed', 'done'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(item, st)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all ${
                          item.status === st
                            ? st === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 font-bold shadow-xs'
                              : st === 'new'
                              ? 'bg-rose-100 text-rose-800 font-bold shadow-xs'
                              : 'bg-surface-container-high text-on-surface font-bold shadow-xs'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specific Content by Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-on-surface">
                    <span>
                      Type: <strong>{item.order_type}</strong>
                    </span>
                    <span>
                      Total:{' '}
                      <strong className="text-primary text-sm font-bold">
                        Rs. {item.total}
                      </strong>
                    </span>
                    <span>
                      Phone:{' '}
                      <a href={`tel:${item.customer_phone}`} className="underline font-semibold">
                        {item.customer_phone}
                      </a>
                    </span>
                  </div>

                  {Array.isArray(item.items) && (
                    <div className="p-3 rounded-2xl bg-surface-container-low space-y-1">
                      <p className="font-bold text-[11px] text-on-surface uppercase">Dishes Ordered:</p>
                      {item.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-on-surface-variant">
                          <span>
                            {it.qty} × {it.name}
                          </span>
                          <span>Rs. {it.price * (it.qty || 1)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.special_instructions && (
                    <p className="italic text-on-surface-variant">
                      Notes: "{item.special_instructions}"
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'reservations' && (
                <div className="space-y-2 text-xs text-on-surface">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>
                      Date: <strong>{item.date}</strong> at <strong>{item.time}</strong>
                    </span>
                    <span>
                      Guests: <strong>{item.guests} people</strong>
                    </span>
                    <span>
                      Seating: <strong>{item.seating_area || 'Indoor Dining'}</strong>
                    </span>
                  </div>
                  {item.notes && (
                    <p className="italic text-on-surface-variant">Guest Notes: "{item.notes}"</p>
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-2 text-xs">
                  {item.subject && (
                    <p className="font-bold text-on-surface">Subject: {item.subject}</p>
                  )}
                  <p className="text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-2xl">
                    "{item.message}"
                  </p>
                </div>
              )}

              {activeTab === 'subscribers' && (
                <div className="text-xs text-on-surface flex items-center justify-between">
                  <span>Source: {item.source}</span>
                  <span className="font-semibold text-secondary">Active Foodie Club Member</span>
                </div>
              )}

              {/* Action Buttons: Reply on WhatsApp & Call */}
              {(item.customer_phone || item.phone) && (
                <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
                  <a
                    href={`https://wa.me/${(item.customer_phone || item.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Salam ${item.customer_name || item.name || 'there'}! This is SunnyBite restaurant confirming your request.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-semibold shadow-xs hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>Reply on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${item.customer_phone || item.phone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>Call Guest</span>
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Inbox;
