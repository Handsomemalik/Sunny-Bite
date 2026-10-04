import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { SITE } from '../config/site';
import { getReply } from '../chat/engine';
import { useCart } from '../context/CartContext';
import { useChatbotKnowledge } from '../context/ContentContext';
import { submitOrder } from '../lib/supabase';
import { SunnyBiteLogoMark } from './SunnyBiteLogo';

const CHAT_STORAGE_KEY = 'sunnybite_chat_v2';

export function ChatWidget() {
  const navigate = useNavigate();
  const {
    cartItems,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartCount,
    setIsDrawerOpen: setCartDrawerOpen,
    cartButtonRef
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState({});
  const [inputVal, setInputVal] = useState('');

  const defaultWelcomeMessage = {
    id: 1,
    sender: 'bot',
    text: `Hi there! I'm the ${SITE.name} assistant 🍽️ Tell me what you'd like to eat (e.g. "2 pizza", "mujhe burger chahiye"), or ask about our hours, location, and bookings!`,
    timestamp: 'Just now',
    chips: ["Show menu", "Popular dishes", "Opening hours", "Where are you?", "Gluten-free options?"],
    actions: []
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [defaultWelcomeMessage];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Persist messages in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save chat to sessionStorage", e);
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, scrollToBottom]);

  // Handle Esc key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputVal.trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: formatTime()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    try {
      // Call engine with live cart items and current context
      const response = await getReply(query, context, cartItems);

      // Update session context
      if (response.context) {
        setContext(response.context);
      }

      // Execute Cart Actions if requested
      if (response.cartAction) {
        const ca = response.cartAction;
        if (ca.type === 'add' && ca.dish) {
          addToCart(ca.dish, ca.qty || 1, chatContainerRef.current);
        } else if (ca.type === 'add_multiple' && Array.isArray(ca.items)) {
          ca.items.forEach(item => {
            addToCart(item.dish, item.qty || 1, chatContainerRef.current);
          });
        } else if (ca.type === 'update_qty') {
          updateQty(ca.dishId, ca.qty);
        } else if (ca.type === 'remove') {
          removeFromCart(ca.dishId);
        } else if (ca.type === 'clear') {
          clearCart();
        } else if (ca.type === 'set_items' && Array.isArray(ca.items)) {
          clearCart();
          ca.items.forEach(item => addToCart(item, item.qty || 1));
        }
      }

      // Simulate human-like warm typing delay (500–750ms)
      setTimeout(() => {
        setIsTyping(false);
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: response.text,
          chips: response.chips || [],
          actions: response.actions || [],
          dishes: response.dishes || [],
          orderSummary: response.orderSummary || null,
          timestamp: formatTime()
        };
        setMessages(prev => [...prev, botMsg]);
      }, 650);
    } catch (err) {
      console.error("Chat engine error:", err);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I'm right here with you! Feel free to name a dish you'd like to order, or ask about our hours and location. 🌿",
          chips: ["Show menu", "Opening hours", "Popular dishes"],
          timestamp: formatTime()
        }
      ]);
    }
  };

  const handleConfirmOrder = (orderSummary) => {
    if (!orderSummary || !orderSummary.waUrl) return;

    // 1. Open WhatsApp
    window.open(orderSummary.waUrl, '_blank', 'noopener,noreferrer');

    // 2. Fire celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E6809A', '#9FD3AE', '#F6E3A6', '#2F5D3E']
    });

    // 3. Save order to Supabase for Admin Inbox
    try {
      submitOrder({
        customerName: orderSummary.customer?.name || 'Chat Customer',
        customerPhone: orderSummary.customer?.phone || 'Not provided',
        orderType: orderSummary.orderType || 'Pickup',
        items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        subtotal: cartSubtotal,
        deliveryFee: 0,
        total: cartSubtotal,
        paymentMethod: 'Cash on Pickup / Table',
        instructions: '',
        source: 'website_chat'
      });
    } catch (e) {
      console.warn('[ChatWidget] Could not submit order to database:', e);
    }

    // 4. Save as last order in localStorage
    try {
      localStorage.setItem('sunnybite_last_order', JSON.stringify({
        items: cartItems,
        customer: orderSummary.customer,
        date: new Date().toISOString()
      }));
    } catch (e) {
      console.warn("Could not save last order", e);
    }

    // 5. Clear cart
    clearCart();

    // 5. Append confirmation message
    const botMsg = {
      id: Date.now() + 2,
      sender: 'bot',
      text: "Your order has been sent to our team on WhatsApp. It's confirmed once we reply. 🌸 Thank you for choosing SunnyBite!",
      chips: ["Show menu", "Opening hours", "Our location"],
      actions: [
        { type: 'link', label: 'Chat on WhatsApp', href: SITE.whatsappLink, icon: 'chat' }
      ],
      timestamp: formatTime()
    };

    setMessages(prev => [...prev, botMsg]);
    setContext(prev => ({
      ...prev,
      checkoutState: { step: 'sent', data: {} }
    }));
  };

  const clearChat = () => {
    const fresh = [{ ...defaultWelcomeMessage, id: Date.now(), timestamp: formatTime() }];
    setMessages(fresh);
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    setContext({});
  };

  const handleActionClick = (action) => {
    if (action.type === 'link') {
      window.open(action.href, '_blank', 'noopener,noreferrer');
    } else if (action.type === 'route') {
      navigate(action.path);
      setIsOpen(false);
    } else if (action.type === 'cart_toggle') {
      setCartDrawerOpen(true);
      setIsOpen(false);
    } else if (action.type === 'whatsapp_order') {
      setCartDrawerOpen(true);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Draggable Pink Chat Trigger Button */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.08}
        whileDrag={{ scale: 1.15 }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 150);
        }}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] md:bottom-6 md:right-6 z-40 touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          aria-label={`Open ${SITE.name} Assistant`}
          onClick={() => {
            if (isDraggingRef.current) return;
            setIsOpen(prev => !prev);
          }}
          className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#E6809A] hover:bg-[#d9708b] text-on-primary shadow-[0_8px_20px_rgba(230,128,154,0.4)] md:shadow-[0_12px_28px_rgba(230,128,154,0.45)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border-2 border-white/80 select-none group"
        >
          <span className="material-symbols-outlined text-[22px] md:text-[26px] pointer-events-none">
            {isOpen ? 'close' : 'chat'}
          </span>
        </button>
      </motion.div>

      {/* Floating Chat Assistant Modal Shell */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatContainerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${SITE.name} Assistant`}
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-2 sm:bottom-24 right-2 left-2 sm:left-auto sm:right-6 md:right-8 z-50 w-auto sm:w-[420px] max-w-full h-[84vh] sm:h-[580px] max-h-[90vh] bg-[#FDFAF3] rounded-3xl shadow-[0_24px_60px_-10px_rgba(60,45,30,0.24)] flex flex-col overflow-hidden border border-white/80"
          >

            {/* Mint Header */}
            <div className="bg-secondary-fixed px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between text-on-secondary-fixed shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center p-0.5 shadow-sm shrink-0 overflow-hidden">
                  <SunnyBiteLogoMark className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <h4 className="font-title-md text-sm sm:text-base font-bold text-on-secondary-fixed leading-tight">
                    {SITE.name} Assistant
                  </h4>
                  <p className="font-caption text-xs text-on-secondary-fixed-variant flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse" />
                    Takes orders &amp; answers questions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setCartDrawerOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-[#98415a] font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors mr-1"
                    title="View Cart Drawer"
                  >
                    <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                    <span>{cartCount}</span>
                  </button>
                )}
                <button
                  type="button"
                  title="Clear conversation"
                  onClick={clearChat}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-lowest/50 flex items-center justify-center text-on-secondary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                </button>
                <button
                  type="button"
                  aria-label="Close assistant"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-lowest/50 flex items-center justify-center text-on-secondary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Body with aria-live */}
            <div
              className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-[#FDFAF3]"
              aria-live="polite"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[92%] sm:max-w-[88%] ${
                      msg.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 mt-0.5 shadow-2xs overflow-hidden">
                        <SunnyBiteLogoMark className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    <div
                      className={`p-3 sm:p-3.5 rounded-2xl font-body-md text-sm leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-primary-container text-on-primary rounded-tr-xs'
                          : 'bg-surface-container text-on-surface rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>

                  {/* Rich Dish Cards inside Chat */}
                  {msg.dishes && msg.dishes.length > 0 && (
                    <div className="w-full pl-8 pr-1 pt-2 space-y-2">
                      {msg.dishes.map((dish) => {
                        const inCart = cartItems.find(i => i.id === dish.id);
                        return (
                          <div
                            key={dish.id}
                            className="p-2.5 bg-surface-container-lowest rounded-2xl flex items-center gap-3 border border-white/80 shadow-xs hover:border-primary-container transition-colors"
                          >
                            <img
                              src={dish.image}
                              alt={dish.name}
                              width="48"
                              height="48"
                              className="w-12 h-12 rounded-xl object-cover shrink-0 bg-surface-container"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-label-sm text-sm font-semibold text-[#243022] truncate">
                                {dish.name}
                              </p>
                              <p className="font-caption text-xs font-bold text-primary">
                                Rs. {dish.price}
                              </p>
                            </div>

                            {/* Stepper if already in cart, else Add button */}
                            {inCart ? (
                              <div className="flex items-center gap-1.5 bg-[#f9e4ea] px-2 py-1 rounded-full border border-primary-container/40">
                                <button
                                  type="button"
                                  onClick={() => updateQty(dish.id, inCart.qty - 1)}
                                  className="w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95"
                                  aria-label="Decrease quantity"
                                >
                                  -
                                </button>
                                <span className="font-bold text-xs text-[#98415a] min-w-[14px] text-center">
                                  {inCart.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(dish, 1)}
                                  className="w-6 h-6 rounded-full bg-[#e6809a] text-white flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(dish, 1)}
                                className="px-3.5 py-1.5 rounded-full bg-primary-container hover:bg-[#d9708b] text-on-primary font-semibold text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-transform shrink-0"
                              >
                                <span className="material-symbols-outlined text-[14px]">add</span>
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rich Order Review Summary Card inside Chat */}
                  {msg.orderSummary && (
                    <div className="w-full pl-8 pr-1 pt-2">
                      <div className="bg-[#fbf5eb] p-4 rounded-2xl border border-[#e4f2dd] shadow-sm space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-secondary/15">
                          <span className="font-title-md text-sm font-bold text-[#243022] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-secondary">receipt_long</span>
                            Order Summary
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">
                            {msg.orderSummary.customer?.orderType || 'Pickup'}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="text-xs text-on-surface-variant space-y-0.5">
                          <p><span className="font-semibold text-[#243022]">Name:</span> {msg.orderSummary.customer?.name}</p>
                          <p><span className="font-semibold text-[#243022]">Phone:</span> {msg.orderSummary.customer?.phone}</p>
                          {msg.orderSummary.customer?.notes && msg.orderSummary.customer?.notes !== 'No notes' && (
                            <p className="italic"><span className="font-semibold text-[#243022] not-italic">Notes:</span> {msg.orderSummary.customer?.notes}</p>
                          )}
                        </div>

                        {/* Itemized Rows */}
                        <div className="space-y-1.5 pt-1 text-xs">
                          {msg.orderSummary.items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-on-surface">
                              <span className="truncate pr-2">{item.qty} × {item.name}</span>
                              <span className="font-medium shrink-0">Rs. {(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Dashed divider above total */}
                        <div className="border-t border-dashed border-[#867275]/30 pt-2 flex justify-between items-center">
                          <span className="font-semibold text-xs text-[#243022]">Total Amount</span>
                          <span className="font-bold text-base text-[#98415a]">
                            Rs. {msg.orderSummary.total?.toLocaleString()}
                          </span>
                        </div>

                        {/* Order Confirmation Action Buttons */}
                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(msg.orderSummary)}
                            className="w-full py-2.5 px-4 rounded-full bg-[#2F5D3E] hover:bg-[#215032] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            <span>Confirm &amp; send on WhatsApp</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCartDrawerOpen(true);
                                setIsOpen(false);
                              }}
                              className="flex-1 py-1.5 px-3 rounded-full bg-white text-secondary border border-secondary/30 hover:bg-surface-container font-medium text-xs flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span>Edit in Cart</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendMessage('clear order')}
                              className="py-1.5 px-3 rounded-full bg-white text-on-surface-variant hover:text-error border border-outline-variant/40 font-medium text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rich Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="pl-8 pt-2 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          className="px-3.5 py-1.5 rounded-full bg-surface-container-lowest text-secondary border border-secondary/30 hover:bg-secondary hover:text-white font-label-sm text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">{act.icon}</span>
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Chips */}
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="pl-8 pt-2 flex flex-wrap gap-1.5">
                      {msg.chips.map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-primary-fixed/40 text-on-surface-variant hover:text-primary font-caption text-xs border border-outline-variant/30 hover:border-primary-container transition-all text-left shadow-2xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-outline mt-1 pl-8 pr-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <SunnyBiteLogoMark className="w-6 h-6 object-contain" />
                  </div>
                  <div className="bg-surface-container px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-3.5 bg-surface-container-lowest border-t border-surface-variant/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-[#FDFAF3] rounded-full px-3.5 sm:px-4 py-1.5 border border-outline-variant/40 focus-within:border-primary-container shadow-inner"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Order a dish (e.g. 2 pizza), hours, info..."
                  className="flex-1 bg-transparent py-1 font-body-md text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none min-w-0"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-container hover:bg-[#d9708b] text-on-primary flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">send</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
