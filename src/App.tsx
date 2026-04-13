import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Search, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Database, 
  Lock, 
  Unlock,
  RefreshCw,
  Info,
  Smartphone,
  X
} from 'lucide-react';
import { MatrixBackground } from './components/MatrixBackground';
import { TerminalLogs } from './components/TerminalLogs';
import { ResultCard } from './components/ResultCard';
import { ErrorBoundary } from './components/ErrorBoundary';

type ThemeColor = 'green' | 'blue';

interface ResultData {
  Name: string;
  Mobile: string;
  Country: string;
  CNIC: string;
  Address: string;
}

function AppContent() {
  const [theme, setTheme] = useState<ThemeColor>('green');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<ResultData[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  const color = theme === 'green' ? '#00ff41' : '#00f3ff';
  const glowClass = theme === 'green' ? 'glow-green' : 'glow-blue';
  const borderGlowClass = theme === 'green' ? 'border-glow-green' : 'border-glow-blue';

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, msg]);
  }, []);

  const handleRunDB = async () => {
    if (!phoneNumber || phoneNumber.length < 5) {
      addLog('ERROR: Invalid input format.');
      return;
    }

    setIsScanning(true);
    setResults([]);
    setScanProgress(0);
    setLogs([]);

    const steps = [
      { msg: 'Connecting to database...', delay: 300 },
      { msg: `Searching for: ${phoneNumber}`, delay: 400 },
      { msg: 'Fetching records...', delay: 500 },
    ];

    let currentProgress = 0;
    for (const step of steps) {
      addLog(step.msg);
      await new Promise(resolve => setTimeout(resolve, step.delay));
      currentProgress += 100 / steps.length;
      setScanProgress(currentProgress);
    }

    try {
      const response = await fetch(`/api/lookup?number=${phoneNumber}`);
      const data = await response.json();

      if (data.status === 'success' && data.data && data.data.length > 0) {
        setResults(data.data);
        addLog(`SUCCESS: Found ${data.data.length} record(s).`);
      } else {
        addLog(`NOTICE: ${data.message || 'No records found.'}`);
      }
    } catch (error) {
      addLog('ERROR: Connection failed.');
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8">
      <MatrixBackground color={color} />
      
      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`bg-cyber-card border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative ${borderGlowClass}`}
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>

              <h2 className={`text-3xl font-bold mb-4 ${glowClass}`} style={{ color }}>WELCOME TO HAMxDB</h2>
              <p className="text-white/60 mb-8 font-mono text-sm uppercase tracking-wider">
                Join our official communities to stay updated with the latest cyber tools and database leaks.
              </p>
              
              <div className="flex flex-col gap-4 mb-8">
                <a 
                  href="https://whatsapp.com/channel/0029VaxW9cPICVfsAVv5FW0i" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-black rounded-xl font-bold uppercase tracking-widest text-sm"
                >
                  <Smartphone size={18} />
                  WhatsApp Channel
                </a>
                <a 
                  href="https://t.me/traderxhammad" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#0088cc] text-white rounded-xl font-bold uppercase tracking-widest text-sm"
                >
                  <RefreshCw size={18} />
                  Telegram Group
                </a>
              </div>
              
              <button 
                onClick={() => setShowWelcome(false)}
                className="text-white/40 hover:text-white transition-colors font-mono text-xs uppercase tracking-[0.2em]"
              >
                [ ENTER SYSTEM ]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl z-10">
        {/* Top Disclaimer */}
        <div className="flex items-center justify-center gap-2 text-white/40 mb-6 bg-white/5 py-1.5 px-4 rounded-full border border-white/10 max-w-fit mx-auto">
          <Info size={10} />
          <p className="text-[9px] font-mono uppercase tracking-[0.2em]">
            Educational Purposes Only - Authorized Access Required
          </p>
        </div>

        {/* Header */}
        <header className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-2 w-full"
          >
            <div className="flex items-center justify-center gap-6 mb-1">
              {/* Left Toggle */}
              <button 
                onClick={() => setTheme('green')}
                className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center group ${theme === 'green' ? 'border-cyber-green scale-110 shadow-[0_0_10px_#00ff41]' : 'border-white/20 hover:border-white/40'}`}
                style={{ backgroundColor: '#00ff41' }}
              >
                <Zap size={10} className={theme === 'green' ? 'text-black' : 'text-black/50'} />
              </button>

              <h1 className={`text-5xl md:text-7xl font-bold tracking-tighter ${glowClass}`} style={{ color }}>
                HAMxDB
              </h1>

              {/* Right Toggle */}
              <button 
                onClick={() => setTheme('blue')}
                className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center group ${theme === 'blue' ? 'border-cyber-blue scale-110 shadow-[0_0_10px_#00f3ff]' : 'border-white/20 hover:border-white/40'}`}
                style={{ backgroundColor: '#00f3ff' }}
              >
                <Zap size={10} className={theme === 'blue' ? 'text-black' : 'text-black/50'} />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-white/20"></span>
              <h2 className="text-sm md:text-base font-mono uppercase tracking-[0.3em] text-white/60">
                HAMMAD Hacker
              </h2>
              <span className="h-[1px] w-8 bg-white/20"></span>
            </div>
          </motion.div>
          
          <div className="mt-2">
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Pakistani SIM Database - Real Cyber Lookup
            </p>
          </div>
        </header>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-cyber-card rounded-2xl p-6 md:p-8 mb-8 border border-white/10 ${borderGlowClass}`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Smartphone className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="ENTER PHONE NUMBER..."
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 font-mono text-lg focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                disabled={isScanning}
              />
            </div>
            <button
              onClick={handleRunDB}
              disabled={isScanning || !phoneNumber}
              className={`relative overflow-hidden px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group`}
              style={{ backgroundColor: color, color: '#000' }}
            >
              <div className="relative z-10 flex items-center gap-2">
                {isScanning ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                {isScanning ? 'SCANNING...' : 'RUN DB'}
              </div>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-mono mb-2 uppercase tracking-widest text-white/40">
                <span>System Scan Progress</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Terminal Logs */}
        <TerminalLogs logs={logs} color={color} />

        {/* Results Section */}
        <AnimatePresence>
          {results.length > 0 && (
            <div className="space-y-6">
              {results.map((res, idx) => (
                <ResultCard key={`${res.Mobile}-${idx}`} data={res} color={color} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Footer / Disclaimer */}
        <footer className="mt-12 text-center">
          <div className="flex flex-col gap-3 mb-8">
            <a 
              href="https://whatsapp.com/channel/0029VaxW9cPICVfsAVv5FW0i" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-black rounded-xl transition-all font-bold shadow-[0_0_15px_rgba(37,211,102,0.3)]"
            >
              <Smartphone size={20} />
              <span className="font-mono uppercase tracking-widest">Join WhatsApp Channel</span>
            </a>
            <a 
              href="https://t.me/traderxhammad" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl transition-all font-bold shadow-[0_0_15px_rgba(0,136,204,0.3)]"
            >
              <RefreshCw size={20} />
              <span className="font-mono uppercase tracking-widest">Join Telegram Group</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/20 mb-4">
            <Info size={14} />
            <p className="text-[10px] font-mono uppercase tracking-widest">
              This system is for educational purposes only. Unauthorized use is prohibited.
            </p>
          </div>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/10">
              <Database size={10} />
              <span>DB_VERSION: 4.2.0</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/10">
              <Lock size={10} />
              <span>SECURED_BY: HAMxPROTOCOL</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 p-4 opacity-10 pointer-events-none hidden md:block">
        <div className="font-mono text-[8px] leading-tight">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>{Math.random().toString(36).substring(2).repeat(5)}</div>
          ))}
        </div>
      </div>
      <div className="fixed top-0 right-0 p-4 opacity-10 pointer-events-none hidden md:block">
        <div className="font-mono text-[8px] leading-tight text-right">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>{Math.random().toString(36).substring(2).repeat(5)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
