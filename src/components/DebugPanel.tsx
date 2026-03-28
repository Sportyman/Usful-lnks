import { useDebugStore } from '../store/debugStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Terminal, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/cn';

export const DebugPanel = () => {
  const { logs, isVisible, toggleVisibility, clearLogs, showDebugButton } = useDebugStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const addLog = useDebugStore(state => state.addLog);

  const downloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `debug_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!isVisible && !showDebugButton) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 z-[9999] bg-black text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Open Debug Panel"
      >
        <Terminal className="w-5 h-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className={cn(
          "fixed bottom-4 right-4 z-[9999] bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col",
          isMinimized ? "w-64 h-14" : "w-96 h-[500px]"
        )}
      >
        {/* Header */}
        <div className="bg-black text-white p-3 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">Debug Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); downloadLogs(); }} className="hover:text-gray-400" title="Download Logs">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); clearLogs(); }} className="hover:text-gray-400" title="Clear Logs">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(); }} className="hover:text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log List */}
        {!isMinimized && (
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 bg-gray-50">
            {logs.length === 0 && (
              <div className="text-gray-400 text-center py-10 italic">No logs yet...</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className={cn(
                "p-1.5 rounded border-l-4",
                log.type === 'error' ? "bg-red-50 border-red-500 text-red-700" :
                log.type === 'warn' ? "bg-yellow-50 border-yellow-500 text-yellow-700" :
                log.type === 'debug' ? "bg-blue-50 border-blue-500 text-blue-700" :
                "bg-white border-gray-300 text-gray-700"
              )}>
                <div className="flex justify-between opacity-50 mb-0.5">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="uppercase font-bold">{log.type}</span>
                </div>
                <div className="font-bold break-words">{log.message}</div>
                {log.data && (
                  <pre className="mt-1 p-1 bg-black/5 rounded overflow-x-auto text-[8px]">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
