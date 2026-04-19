import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-2 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg sm:text-xl font-serif italic text-ink-900 truncate pr-2">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>
            <div className="p-5 sm:p-8 overflow-y-auto min-h-0 flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
