import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrips } from '../store';
import { ACTIVITY_CONFIG } from '../constants';
import { ActivityType } from '../types';
import { Edit2, Save, X } from 'lucide-react';

export const Budget: React.FC = () => {
  const { state, updateTrip } = useTrips();
  const trip = state.trips.find(t => t.id === state.activeTripId);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(trip?.budget.total || 0);

  if (!trip) return null;

  const getExpensesByCategory = () => {
    const categories: Record<string, number> = {};
    Object.values(ActivityType).forEach(type => categories[type] = 0);
    
    trip.dailyItinerary.forEach(day => {
      day.activities.forEach(act => {
        categories[act.type] += act.cost;
      });
    });
    
    return Object.entries(categories)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  };

  const data = getExpensesByCategory();
  const totalSpent = data.reduce((sum, item) => sum + item.value, 0);
  const remaining = trip.budget.total - totalSpent;
  const overBudget = remaining < 0;

  const handleSaveBudget = () => {
    updateTrip(trip.id, { budget: { total: tempBudget } });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xl font-black uppercase tracking-tight">Budget Tracking</h3>
        <button 
          onClick={() => { setIsEditing(!isEditing); setTempBudget(trip.budget.total); }}
          className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-[#D4AF37] transition-colors"
        >
          {isEditing ? <X size={16} /> : <Edit2 size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#2C2C2E] p-4 rounded-[20px] border border-[#D4AF37]/30 mb-2"
          >
            <label className="text-[9px] font-black opacity-30 uppercase ml-2 mb-1 block tracking-wider">Total Trip Budget ($)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={tempBudget}
                onChange={e => setTempBudget(Number(e.target.value))}
                className="flex-1 bg-[#1C1C1E] rounded-xl px-4 py-2 text-sm font-bold border border-white/5 outline-none focus:border-[#D4AF37]"
              />
              <button 
                onClick={handleSaveBudget}
                className="bg-[#D4AF37] text-black px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2"
              >
                <Save size={14} /> SAVE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 shadow-sm">
          <p className="text-white/40 text-[8px] font-black uppercase tracking-wider mb-1">Budget</p>
          <p className="text-lg font-black">${trip.budget.total.toLocaleString()}</p>
        </div>
        <div className="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 shadow-sm">
          <p className="text-white/40 text-[8px] font-black uppercase tracking-wider mb-1">Spent</p>
          <p className={`text-lg font-black ${overBudget ? 'text-red-500' : 'text-[#D4AF37]'}`}>
            ${totalSpent.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-[#2C2C2E] p-4 rounded-[28px] border border-white/5 flex flex-col items-center">
        <div className="w-full h-48 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ACTIVITY_CONFIG[entry.name as ActivityType].color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #38383A', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#FFFFFF' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full space-y-2">
          {Object.values(ActivityType).map((type) => {
            const amount = data.find(d => d.name === type)?.value || 0;
            const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
            if (amount === 0) return null;
            const config = ACTIVITY_CONFIG[type];
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-[10px] text-white/60 font-bold">{config.label}</span>
                </div>
                <span className="text-[10px] font-black">${amount.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};