import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TerminalLogsProps {
  logs: string[];
  color: string;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs, color }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="bg-black/80 border border-white/10 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs mb-6 scrollbar-thin scrollbar-thumb-white/20"
    >
      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => (
          <motion.div
            key={`${log}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="mb-1 flex"
            style={{ color }}
          >
            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className="mr-2">{">"}</span>
            <span>{log}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {logs.length === 0 && (
        <div className="text-white/30 italic">System idle. Awaiting input...</div>
      )}
    </div>
  );
};
