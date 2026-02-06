
import React, { useState, useEffect } from 'react';
import { useTrips } from '../store';

export const Layout: React.FC<{ 
  children: React.ReactNode;
  activeView: 'dashboard' | 'itinerary' | 'budget' | 'toolbox';
  setView: (view: 'dashboard' | 'itinerary' | 'budget' | 'toolbox') => void;
}> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

        {/* Subtle Sync Status Badge */}
        <div className="fixed bottom-6 left-6 z-[200] flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/5 opacity-40 hover:opacity-100 transition-opacity pointer-events-none select-none">
          <div 
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              isOnline 
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
            }`} 
          />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </main>
    </div>
  );
};
