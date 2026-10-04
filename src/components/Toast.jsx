import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export function Toast() {
  const { toast, hideToast } = useCart();

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!toast.visible) return;

    const timer = setTimeout(() => {
      hideToast();
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast.visible, toast.message, hideToast]);

  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, x: '-50%', scale: 0.94 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 16, x: '-50%', scale: 0.94 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-20 sm:bottom-24 left-1/2 z-50 pointer-events-auto w-[92vw] max-w-[430px] sm:w-auto sm:max-w-md flex justify-center"
        >
          <div className="w-full sm:w-auto bg-[#243022]/95 backdrop-blur-md text-white pl-3.5 sm:pl-4 pr-2 py-2 sm:py-2.5 rounded-full shadow-[0_16px_36px_rgba(36,48,34,0.4)] flex items-center justify-between sm:justify-start gap-2 sm:gap-3 border border-white/15">
            {/* Checkmark Icon */}
            <span className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[15px]">check</span>
            </span>

            {/* Message Text with truncation for small screens */}
            <span className="font-label-lg font-medium text-xs sm:text-sm text-left truncate flex-1 min-w-0 pr-1 select-none">
              {toast.message}
            </span>

            {/* Actions: Undo + Close Cross */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Undo Action Button */}
              {toast.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.undoAction();
                    hideToast();
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white font-semibold text-xs transition-all whitespace-nowrap"
                >
                  Undo
                </button>
              )}

              {/* Close / Cross Button to instantly remove */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hideToast();
                }}
                aria-label="Dismiss notification"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white/80 hover:text-white flex items-center justify-center transition-all shrink-0"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
