import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LogType = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

interface DebugState {
  logs: LogEntry[];
  isVisible: boolean;
  showDebugButton: boolean;
  addLog: (type: LogType, message: string, data?: any) => void;
  clearLogs: () => void;
  toggleVisibility: () => void;
  setShowDebugButton: (show: boolean) => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      logs: [],
      isVisible: false,
      showDebugButton: false, // Hidden by default as requested
      addLog: (type, message, data) => {
        const entry: LogEntry = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          type,
          message,
          data,
        };
        set((state) => ({
          logs: [entry, ...state.logs].slice(0, 100), // Keep last 100 logs
        }));
        
        // Also log to console for standard debugging
        const consoleMethod = type === 'debug' ? 'log' : type;
        console[consoleMethod](`[DEBUG] ${message}`, data || '');
      },
      clearLogs: () => set({ logs: [] }),
      toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
      setShowDebugButton: (show) => set({ showDebugButton: show }),
    }),
    {
      name: 'debug-storage',
      partialize: (state) => ({ showDebugButton: state.showDebugButton }),
    }
  )
);
