
import React, { useState, useEffect } from 'react';
import { useTrips } from '../store';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout: React.FC<{ 
  children: React.ReactNode;
  activeView: 'dashboard' | 'itinerary' | 'budget' | 'toolbox';
  setView: (view: 'dashboard' | 'itinerary' | 'budget' | 'toolbox') => void;
}> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isSyncing, syncError, refreshFromCloud } = useTrips();

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#1C1C1E] font-['Inter']">
      <main className="flex-1 overflow-hidden relative">
        {children}

        {/* Status & Sync Bar */}
        <div className="fixed bottom-6 left-6 z-[200] flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                isOnline 
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                  : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
              }`} 
            />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
              {isOnline ? (isSyncing ? 'Syncing...' : 'Online') : 'Offline'}
            </span>
          </div>

          {/* Refresh Trigger */}
          <button 
            onClick={() => refreshFromCloud()}
            disabled={!isOnline || isSyncing}
            className={`p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/5 text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all ${isSyncing ? 'cursor-not-allowed' : ''}`}
            title="Refresh from cloud"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          </button>

          {/* Sync Error Alert */}
          {syncError && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 backdrop-blur-md rounded-full border border-red-500/20 text-red-500"
            >
              <AlertCircle size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Sync Failed</span>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
