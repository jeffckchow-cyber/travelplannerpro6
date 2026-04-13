
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrips } from '../store';
import { ACTIVITY_CONFIG, COLORS } from '../constants';
import { ActivityType } from '../types';
import { Edit2, Save, X } from 'lucide-react';

export const Budget: React.FC = () => {
  const { state, updateTrip } = useTrips();
  const trip = state.trips.find(t => t.id === state.activeTripId);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(trip?.budget.total || 0);

  if (!trip) return null;

  const getExpensesByCategory = () => {
    const categories: Record<string, number=""> = {};
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
    <div classname="space-y-4">
      <div classname="flex justify-between items-center mb-1">
        <h3 classname="text-xl font-black uppercase tracking-tight">Budget Tracking</h3>
        <button onclick="{()" ==""> { setIsEditing(!isEditing); setTempBudget(trip.budget.total); }}
          className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-[#A68B5B] transition-colors"
        >
          {isEditing ? <x size="{16}"/> : <edit2 size="{16}"/>}
        </button>
      </div>

      <animatepresence>
        {isEditing && (
          <motion.div initial="{{" height:="" 0,="" opacity:="" 0="" }}="" animate="{{" height:="" 'auto',="" opacity:="" 1="" }}="" exit="{{" height:="" 0,="" opacity:="" 0="" }}="" classname="overflow-hidden bg-[#2C2C2E] p-4 rounded-[20px] border border-[#594D31]/30 mb-2">
            <label classname="text-[9px] font-black opacity-30 uppercase ml-2 mb-1 block tracking-wider">Total Trip Budget ($)</label>
            <div classname="flex gap-2">
              <input type="number" value="{tempBudget}" onchange="{e" ==""> setTempBudget(Number(e.target.value))}
                className="flex-1 bg-[#1C1C1E] rounded-xl px-4 py-2 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]"
              />
              <button onclick="{handleSaveBudget}" classname="bg-[#594D31] text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2">
                <save size="{14}"/> SAVE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div classname="grid grid-cols-2 gap-3 mb-4">
        <div classname="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 shadow-sm">
          <p classname="text-white/40 text-[8px] font-black uppercase tracking-wider mb-1">Budget</p>
          <p classname="text-lg font-black">${trip.budget.total.toLocaleString()}</p>
        </div>
        <div classname="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 shadow-sm">
          <p classname="text-white/40 text-[8px] font-black uppercase tracking-wider mb-1">Spent</p>
          <p classname="{`text-lg" font-black="" ${overbudget="" ?="" 'text-red-500'="" :="" 'text-[#a68b5b]'}`}="">
            ${totalSpent.toLocaleString()}
          </p>
        </div>
      </div>

      <div classname="bg-[#2C2C2E] p-4 rounded-[28px] border border-white/5 flex flex-col items-center">
        <div classname="w-full h-48 mb-2">
          <responsivecontainer width="100%" height="100%">
            <piechart>
              <pie data="{data}" cx="50%" cy="50%" innerradius="{50}" outerradius="{65}" paddingangle="{4}" datakey="value">
                {data.map((entry, index) => (
                  <cell key="{`cell-${index}`}" fill="{ACTIVITY_CONFIG[entry.name" as="" activitytype].color}=""/>
                ))}
              </Pie>
              <tooltip contentstyle="{{" backgroundcolor:="" '#1c1c1e',="" border:="" '1px="" solid="" #38383a',="" borderradius:="" '12px',="" fontsize:="" '10px'="" }}="" itemstyle="{{" color:="" '#ffffff'="" }}=""/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
