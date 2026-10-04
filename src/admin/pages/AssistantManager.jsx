import React, { useState, useEffect } from 'react';
import { useSettings, useMenu, ContentContext } from '../../context/ContentContext';
import { useContext } from 'react';
import { getReply } from '../../chat/engine';
import { supabase, isSupabaseConfigured, logAuditEvent } from '../../lib/supabase';

export function AssistantManager() {
  const context = useContext(ContentContext);
  const { chatSettings, refreshSettings } = useSettings();
  const { allItems } = useMenu();

  const [welcomeMessage, setWelcomeMessage] = useState(chatSettings.welcomeMessage || '');
  const [chipsString, setChipsString] = useState(
    Array.isArray(chatSettings.chips) ? chatSettings.chips.join(', ') : ''
  );

  const [faqList, setFaqList] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Test Sandbox Chat State
  const [testMessages, setTestMessages] = useState([
    {
      sender: 'bot',
      text: "Salam! This is the live sandbox test assistant. Try asking about dishes (e.g. '2 burgers', 'kitna time lagay ga') or FAQs.",
      timestamp: 'Now',
    },
  ]);
  const [testInput, setTestInput] = useState('');
  const [testContext, setTestContext] = useState({});

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Load FAQ list
  const loadFaq = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setFaqList([
        { id: '1', question: 'Do you offer home delivery?', answer: 'We do not offer direct home delivery at this time; our current order options are Pickup and Dine-in.', keywords: ['delivery', 'deliver', 'ghar'] },
        { id: '2', question: 'Is all the food certified Halal?', answer: 'Yes, 100%! All our chicken, beef, and ingredients are strictly certified Halal.', keywords: ['halal', 'zabiha'] },
        { id: '3', question: 'What payment methods do you accept?', answer: 'We accept Cash, all major Credit/Debit cards, Raast, Nayapay, and Easypaisa.', keywords: ['payment', 'cash', 'card'] },
        { id: '4', question: 'Is parking available nearby?', answer: 'Ample, step-free parking is conveniently located right outside in I-8 Markaz.', keywords: ['parking', 'car'] },
        { id: '5', question: 'Do you offer discounts or student deals?', answer: 'All our menu prices are fixed and artisanal. Foodie Club members receive seasonal perks.', keywords: ['discount', 'deal'] },
      ]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chatbot_faq')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setFaqList(data || []);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  useEffect(() => {
    loadFaq();
  }, []);

  // Save Welcome Message & Chips
  const handleSaveGreeting = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    const chipsArray = chipsString.split(',').map((c) => c.trim()).filter(Boolean);
    const updated = {
      welcomeMessage: welcomeMessage.trim(),
      chips: chipsArray,
    };

    if (!isSupabaseConfigured() || !supabase) {
      showToast('Saved greeting locally (offline)');
      setSavingSettings(false);
      return;
    }

    try {
      const { error } = await supabase.from('site_settings').upsert([
        {
          key: 'chat_settings',
          value: updated,
          is_public: true,
          updated_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;

      await logAuditEvent({
        action: 'UPDATE_CHAT_SETTINGS',
        entityType: 'chat_settings',
        newValue: updated,
      });

      showToast('Assistant welcome message & chips saved!');
      if (refreshSettings) refreshSettings();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSavingSettings(false);
    }
  };

  // Save / Update FAQ
  const handleSaveFaq = async (faq) => {
    setIsFaqModalOpen(false);
    if (!isSupabaseConfigured() || !supabase) {
      showToast('FAQ saved locally (offline)');
      return;
    }

    try {
      const payload = {
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        keywords: Array.isArray(faq.keywords)
          ? faq.keywords
          : String(faq.keywords || '')
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean),
        sort_order: Number(faq.sort_order || 0),
        visible: faq.visible !== false,
      };

      if (faq.id && faq.id.length > 5) {
        await supabase.from('chatbot_faq').update(payload).eq('id', faq.id);
      } else {
        await supabase.from('chatbot_faq').insert([payload]);
      }

      showToast('FAQ knowledge updated!');
      loadFaq();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (id) => {
    if (!isSupabaseConfigured() || !supabase) {
      setFaqList(faqList.filter((f) => f.id !== id));
      showToast('FAQ deleted locally');
      return;
    }

    try {
      await supabase.from('chatbot_faq').delete().eq('id', id);
      showToast('FAQ removed');
      loadFaq();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Send message in sandbox test chat
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const userText = testInput.trim();
    setTestInput('');

    // Append user message
    const nextMsgs = [
      ...testMessages,
      { sender: 'user', text: userText, timestamp: 'Now' },
    ];
    setTestMessages(nextMsgs);

    try {
      const reply = await getReply(userText, [], testContext);
      if (reply.context) setTestContext(reply.context);

      setTestMessages([
        ...nextMsgs,
        {
          sender: 'bot',
          text: reply.text,
          chips: reply.chips || [],
          timestamp: 'Now',
        },
      ]);
    } catch (err) {
      setTestMessages([
        ...nextMsgs,
        { sender: 'bot', text: `Error: ${err.message}`, timestamp: 'Now' },
      ]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
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
            AI Assistant Manager
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Tune greeting messages, suggested chips, operational FAQs, and test responses in a live sandbox.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingFaq({
              id: '',
              question: '',
              answer: '',
              keywords: '',
              sort_order: faqList.length + 1,
              visible: true,
            });
            setIsFaqModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-full bg-secondary text-on-secondary font-label-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add FAQ Answer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Greeting & FAQ Management (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Greeting Form */}
          <form
            onSubmit={handleSaveGreeting}
            className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">waving_hand</span>
                <h2 className="font-headline-sm text-base font-bold text-[#243022]">
                  Welcome Greeting &amp; Quick Chips
                </h2>
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Greeting'}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Bot Opening Message</label>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-surface-container-lowest p-3 rounded-2xl border border-surface-container resize-none"
                  placeholder="Salam & Welcome to SunnyBite!..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-on-surface flex items-center justify-between">
                  <span>Quick-Reply Chips</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">Comma-separated</span>
                </label>
                <input
                  type="text"
                  value={chipsString}
                  onChange={(e) => setChipsString(e.target.value)}
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                  placeholder="View Full Menu, I want to order, What are your timings?"
                />
              </div>
            </div>
          </form>

          {/* FAQ Knowledge List */}
          <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">quiz</span>
                <h2 className="font-headline-sm text-base font-bold text-[#243022]">
                  Operational FAQs ({faqList.length})
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {faqList.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-container/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm">{faq.question}</p>
                    <p className="text-on-surface-variant leading-relaxed">{faq.answer}</p>
                    {faq.keywords && (
                      <p className="text-[10px] text-secondary font-mono pt-1">
                        Keywords: {Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq({
                          ...faq,
                          keywords: Array.isArray(faq.keywords)
                            ? faq.keywords.join(', ')
                            : faq.keywords,
                        });
                        setIsFaqModalOpen(true);
                      }}
                      className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
                      title="Edit FAQ"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="w-8 h-8 rounded-full bg-error-container/60 hover:bg-error-container text-error flex items-center justify-center"
                      title="Delete FAQ"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Test Sandbox Chat (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">terminal</span>
              <h2 className="font-headline-sm text-base font-bold text-[#243022]">
                Interactive Test Sandbox
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestMessages([
                  {
                    sender: 'bot',
                    text: 'Sandbox reset. Try asking anything!',
                    timestamp: 'Now',
                  },
                ]);
                setTestContext({});
              }}
              className="text-[11px] text-on-surface-variant hover:text-on-surface underline font-medium"
            >
              Reset Chat
            </button>
          </div>

          {/* Chat Window */}
          <div className="h-80 bg-surface-container-lowest rounded-2xl p-3 overflow-y-auto space-y-3 border border-surface-container/60 text-xs">
            {testMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-secondary text-on-secondary rounded-br-none shadow-xs'
                      : 'bg-surface-container-low text-on-surface rounded-bl-none border border-surface-container/40'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 max-w-[85%]">
                    {msg.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTestInput(chip);
                        }}
                        className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface hover:bg-surface-container-high"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Test Input */}
          <form onSubmit={handleSendTestMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask bot something (e.g. 2 pizzas)..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="flex-1 bg-surface-container-lowest text-xs p-2.5 rounded-xl border border-surface-container focus:outline-none focus:border-secondary"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-secondary text-on-secondary text-xs font-semibold rounded-xl"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* EDIT / ADD FAQ MODAL */}
      {isFaqModalOpen && editingFaq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFAF3] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-warm-elevated border border-white/80">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
                {editingFaq.id ? 'Edit FAQ' : 'New FAQ Answer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Question</label>
                <input
                  type="text"
                  required
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. Is parking available?"
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-on-surface">Answer</label>
                <textarea
                  rows={3}
                  required
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Ample parking is available..."
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-on-surface flex items-center justify-between">
                  <span>Match Keywords</span>
                  <span className="text-[10px] text-secondary">Comma-separated</span>
                </label>
                <input
                  type="text"
                  value={editingFaq.keywords}
                  onChange={(e) => setEditingFaq({ ...editingFaq, keywords: e.target.value })}
                  placeholder="parking, car, park, gari"
                  className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveFaq(editingFaq)}
                className="flex-1 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90"
              >
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssistantManager;
