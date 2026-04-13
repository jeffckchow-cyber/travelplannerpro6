import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  RefreshCw,
  ArrowRightLeft,
  Plane,
  CreditCard,
  Smartphone,
  Briefcase,
  Map,
  Ticket,
  Pill,
  Camera,
  Umbrella,
  Plug,
  Sparkles
} from 'lucide-react';
import { useTrips } from '../store';
import { motion } from 'framer-motion';

const PRESET_CHECKLIST = [
  { icon: <plane size="{18}"/>, item: 'Passport & Visa' },
  { icon: <creditcard size="{18}"/>, item: 'Credit Cards & Cash' },
  { icon: <smartphone size="{18}"/>, item: 'Phone & Charger' },
  { icon: <briefcase size="{18}"/>, item: 'Packing Luggage' },
  { icon: <map size="{18}"/>, item: 'Hotel Confirmation' },
  { icon: <ticket size="{18}"/>, item: 'Flight Tickets' },
  { icon: <pill size="{18}"/>, item: 'Essential Medicine' },
  { icon: <camera size="{18}"/>, item: 'Camera & Memory' },
  { icon: <umbrella size="{18}"/>, item: 'Rain Gear' },
  { icon: <plug size="{18}"/>, item: 'Power Adapter' },
];

export const Toolbox: React.FC = () => {
  const { state, updateChecklist, addChecklistItem } = useTrips();
  const trip = state.trips.find(t => t.id === state.activeTripId);

  const [usd, setUsd] = useState('100');
  const [eur, setEur] = useState('');
  const [rate] = useState(0.92); // Hardcoded rate USD -> EUR
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (usd) setEur((parseFloat(usd) * rate).toFixed(2));
  }, [usd, rate]);

  const handleEurChange = (val: string) => {
    setEur(val);
    if (val) setUsd((parseFloat(val) / rate).toFixed(0));
  };

  if (!trip) return null;

  const completedCount = trip.checklist.filter(i => i.completed).length;
  const progress = trip.checklist.length > 0 ? (completedCount / trip.checklist.length) * 100 : 0;

  return (
    <div classname="p-8 max-w-6xl mx-auto pb-32">
      <h2 classname="text-3xl font-black uppercase tracking-tight mb-8">Travel Toolbox</h2>

      <div classname="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checklist Section */}
        <div classname="bg-[#2C2C2E] p-8 rounded-[40px] border border-white/5 shadow-2xl flex flex-col h-full">
          <div classname="flex justify-between items-end mb-6">
            <h3 classname="text-xl font-black uppercase tracking-tight">Preparation Checklist</h3>
            <span classname="text-sm text-[#D4AF37] font-black">{completedCount}/{trip.checklist.length}</span>
          </div>
          
          <div classname="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-8">
            <motion.div animate="{{" width:="" `${progress}%`="" }}="" classname="h-full bg-[#D4AF37]"/>
          </div>

          <div classname="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[400px] mb-6 pr-2">
            {trip.checklist.length === 0 && (
              <div classname="bg-white/5 rounded-[24px] p-8 text-center border border-white/5">
                <p classname="text-white/40 font-bold mb-6 text-sm">No items yet. Add our preset travel essentials?</p>
                <button onclick="{()" ==""> PRESET_CHECKLIST.forEach(p => addChecklistItem(trip.id, p.item))}
                  className="px-6 py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                >
                  LOAD ESSENTIALS
                </button>
              </div>
            )}
            {trip.checklist.map((item) => (
              <button key="{item.id}" onclick="{()" ==""> updateChecklist(trip.id, item.id, !item.completed)}
                className={`w-full flex items-center gap-4 p-5 rounded-[20px] border transition-all ${
                  item.completed 
                    ? 'bg-[#1C1C1E] border-white/5 text-white/20' 
                    : 'bg-[#3A3A3C] border-white/10 text-white hover:border-[#D4AF37]/40'
                }`}
              >
                {item.completed ? <checkcircle2 classname="text-[#D4AF37]" size="{20}"/> : <circle classname="text-white/10" size="{20}"/>}
                <span classname="{`font-bold" text-sm="" ${item.completed="" ?="" 'line-through'="" :="" ''}`}="">{item.item}</span>
              </button>
            ))}
          </div>

          <form onsubmit="{(e)" ==""> { e.preventDefault(); if(newItem) addChecklistItem(trip.id, newItem); setNewItem(''); }}
            className="flex gap-2"
          >
            <input type="text" value="{newItem}" onchange="{e" ==""> setNewItem(e.target.value)}
              placeholder="Add personal item..."
              className="flex-1 bg-[#1C1C1E] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#D4AF37] transition-colors"
            />
            <button type="submit" classname="w-12 h-12 bg-[#D4AF37] text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
              <plus size="{24}"/>
            </button>
          </form>
        </div>

        {/* Tools Section */}
        <div classname="space-y-8">
          <div classname="bg-[#2C2C2E] p-8 rounded-[40px] border border-white/5 shadow-2xl">
            <div classname="flex items-center gap-3 mb-8">
              <div classname="w-10 h-10 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl flex items-center justify-center"><arrowrightleft size="{20}"/></div>
              <h3 classname="text-xl font-black uppercase tracking-tight">Currency Converter</h3>
            </div>
            
            <div classname="space-y-4">
              <div classname="bg-[#1C1C1E] p-6 rounded-[24px] border border-white/5">
                <div classname="flex justify-between items-center mb-2">
                  <span classname="text-[10px] font-black text-white/40 uppercase tracking-widest">USD - US Dollar</span>
                  <span classname="text-[#D4AF37] font-black text-sm">$</span>
                </div>
                <input type="number" value="{usd}" onchange="{e" ==""> setUsd(e.target.value)}
                  className="w-full bg-transparent text-3xl font-black outline-none"
                />
              </div>

              <div classname="flex justify-center -my-3 relative z-10">
                <div classname="bg-[#D4AF37] p-2 rounded-full text-black shadow-lg">
                  <refreshcw size="{16}"/>
                </div>
              </div>

              <div classname="bg-[#1C1C1E] p-6 rounded-[24px] border border-white/5">
                <div classname="flex justify-between items-center mb-2">
                  <span classname="text-[10px] font-black text-white/40 uppercase tracking-widest">EUR - Euro</span>
                  <span classname="text-[#D4AF37] font-black text-sm">€</span>
                </div>
                <input type="number" value="{eur}" onchange="{e" ==""> handleEurChange(e.target.value)}
                  className="w-full bg-transparent text-3xl font-black outline-none"
                />
              </div>

              <p classname="text-center text-[10px] text-white/20 font-bold uppercase tracking-widest pt-2">
                Fixed Rate: 1 USD = 0.92 EUR
              </p>
            </div>
          </div>

          <div classname="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] p-8 rounded-[40px] text-black relative overflow-hidden group">
            <sparkles classname="absolute -right-4 -top-4 w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform duration-700"/>
            <div classname="relative z-10">
              <h4 classname="text-2xl font-black uppercase tracking-tighter mb-2">Bon Voyage!</h4>
              <p classname="font-bold text-sm opacity-80 leading-relaxed mb-6">
                Ready for your US adventure? All your tickets, hotels, and plans are synced and ready for offline use.
              </p>
              <div classname="bg-black/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
                <div classname="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center">
                  <smartphone size="{24}"/>
                </div>
                <div>
                  <p classname="text-xs font-black uppercase">Mobile Ready</p>
                  <p classname="text-[10px] font-bold opacity-60">Optimized for your phone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};