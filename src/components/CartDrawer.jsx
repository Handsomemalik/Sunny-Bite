import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { SITE } from '../config/site';
import { Link } from 'react-router-dom';
import { submitOrder } from '../lib/supabase';

export function CartDrawer() {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    cartItems,
    cartCount,
    cartSubtotal,
    updateQty,
    removeFromCart,
    clearCart
  } = useCart();

  const [orderType, setOrderType] = useState('Pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // Fire festive confetti
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E6809A', '#9FD3AE', '#F6E3A6', '#2F5D3E']
    });

    // Build formatted WhatsApp message
    let itemsText = cartItems
      .map(i => `• ${i.qty} × ${i.name} (Rs. ${i.price * i.qty})`)
      .join('\n');

    let message = `*New SunnyBite Order* 🍽️\n-------------------------\n`;
    if (customerName.trim()) message += `*Customer:* ${customerName.trim()}\n`;
    if (customerPhone.trim()) message += `*Phone:* ${customerPhone.trim()}\n`;
    message += `*Order Type:* ${orderType}\n\n`;
    message += `*Items:*\n${itemsText}\n\n`;
    // 1. Submit order to Supabase for the Admin Inbox
    try {
      submitOrder({
        customerName: customerName.trim() || 'Guest Customer',
        customerPhone: customerPhone.trim() || 'Not provided',
        orderType,
        items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        subtotal: cartSubtotal,
        deliveryFee: 0,
        total: cartSubtotal,
        paymentMethod: 'Cash on Pickup / Table',
        instructions: specialNotes.trim(),
        source: 'website_cart'
      });
    } catch (err) {
      console.warn('[Cart Drawer] Order sync warning:', err.message);
    }

    // 2. Open WhatsApp for instant kitchen receipt
    const waUrl = `${SITE.whatsappLink}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setIsOrdered(true);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer Container */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] max-w-full bg-[#FDFAF3] z-50 shadow-2xl flex flex-col justify-between border-l border-white/60 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-[#243022]">Your Order</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {cartCount} {cartCount === 1 ? 'dish' : 'dishes'} selected
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close cart drawer"
                onClick={() => setIsDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-[40px]">lunch_dining</span>
                  </div>
                  <h4 className="font-headline-sm text-xl text-[#243022] font-semibold">Your basket is hungry</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mx-auto">
                    Explore our botanical appetizers, gourmet burgers, and artisan pastas to start building your order.
                  </p>
                  <Link
                    to="/menu"
                    onClick={() => setIsDrawerOpen(false)}
                    className="inline-flex items-center gap-2 bg-[#e6809a] hover:bg-[#d9708b] text-on-primary font-semibold px-6 py-3 rounded-full shadow-sm transition-transform active:scale-95"
                  >
                    <span>Browse Menu</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-surface-container-lowest rounded-2xl flex items-center gap-3 border border-white/80 shadow-xs"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          width="64"
                          height="64"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-surface-container"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-label-lg text-label-lg font-semibold text-[#243022] truncate">
                            {item.name}
                          </h5>
                          <p className="font-caption text-caption text-primary font-bold">
                            Rs. {item.price * item.qty}
                          </p>
                          <span className="font-caption text-[11px] text-outline">
                            (Rs. {item.price} each)
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-full border border-surface-container">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.name}`}
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-6 h-6 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center text-sm font-bold shadow-2xs hover:bg-surface-container"
                          >
                            –
                          </button>
                          <span className="w-5 text-center font-label-sm text-label-sm font-semibold text-on-surface">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.name}`}
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="w-6 h-6 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center text-sm font-bold shadow-2xs hover:bg-surface-container"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove item */}
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-full hover:bg-error-container/50 text-error flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Order Options */}
                  <div className="p-4 bg-surface-container-lowest rounded-2xl border border-white/60 space-y-3">
                    <span className="font-label-sm text-label-sm uppercase font-semibold tracking-wider text-secondary">
                      Order Details
                    </span>

                    {/* Order Type Toggle */}
                    <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-xl">
                      {['Pickup', 'Dine-in'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOrderType(type)}
                          className={`py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            orderType === type
                              ? 'bg-secondary text-on-secondary shadow-xs'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder="Your Name (optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#fdfaf3] text-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary-container focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number (optional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#fdfaf3] text-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary-container focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="Special notes or dietary instructions..."
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        className="w-full bg-[#fdfaf3] text-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary-container focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {isOrdered && (
                    <div className="p-4 rounded-2xl bg-secondary-container text-on-secondary-container text-sm flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[24px]">check_circle</span>
                      <p>WhatsApp opened! Your order has been prefilled ready to send to our kitchen desk.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-surface-container bg-surface-container-lowest/80 backdrop-blur-md space-y-4">
                <div className="space-y-1.5 font-body-md text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>Rs. {cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Packaging &amp; Service</span>
                    <span className="text-secondary font-semibold">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#243022] pt-2 border-t border-surface-container">
                    <span>Total</span>
                    <span className="text-primary text-lg">Rs. {cartSubtotal}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="px-4 py-3 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex-1 py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>Checkout via WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
