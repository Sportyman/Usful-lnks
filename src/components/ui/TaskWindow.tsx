import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TaskWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function TaskWindow({ 
  isOpen, 
  isMinimized, 
  onMinimize, 
  onMaximize, 
  onClose, 
  title, 
  children 
}: TaskWindowProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - Only visible when NOT minimized */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMinimize} // Clicking backdrop minimizes instead of closes for better UX? Or maybe nothing.
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            />
          )}

          {/* Window Container */}
          <div className={cn(
            "fixed z-[100] transition-all duration-500 ease-in-out",
            isMinimized 
              ? "bottom-4 right-4 left-4 sm:left-auto sm:w-80 h-auto" 
              : "inset-0 grid place-items-center p-2 sm:p-4 overflow-y-auto"
          )}>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                borderRadius: isMinimized ? "1rem" : "1.5rem sm:2rem"
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-500",
                isMinimized ? "rounded-2xl border border-slate-200" : "w-full max-w-lg rounded-[1.5rem] sm:rounded-[2rem] max-h-[90vh] sm:max-h-[85vh]"
              )}
            >
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between border-b border-slate-100 transition-all",
                isMinimized ? "px-4 py-3 bg-slate-50" : "px-4 sm:px-8 py-4 sm:py-6"
              )}>
                <h3 className={cn(
                  "font-serif italic text-ink-900 truncate pr-2 transition-all",
                  isMinimized ? "text-sm font-bold" : "text-xl"
                )}>
                  {title}
                </h3>
                <div className="flex items-center gap-1">
                  {isMinimized ? (
                    <button
                      onClick={onMaximize}
                      className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                      title="Maximize"
                    >
                      <Maximize2 className="w-4 h-4 text-ink-500" />
                    </button>
                  ) : (
                    <button
                      onClick={onMinimize}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      title="Minimize"
                    >
                      <Minimize2 className="w-5 h-5 text-ink-500" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className={cn(
                      "hover:bg-red-50 hover:text-red-500 rounded-full transition-colors",
                      isMinimized ? "p-1.5" : "p-2"
                    )}
                    title="Close"
                  >
                    <X className={cn("text-ink-500", isMinimized ? "w-4 h-4" : "w-5 h-5")} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className={cn(
                "overflow-y-auto transition-all bg-white",
                isMinimized ? "h-0 p-0" : "p-4 sm:p-8 flex-1"
              )}>
                {children}
              </div>

              {/* Minimized Status Bar (Optional) */}
              {isMinimized && (
                <div className="px-4 py-2 bg-white text-[10px] text-ink-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Running in background...
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
