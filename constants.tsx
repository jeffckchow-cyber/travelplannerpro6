import React from 'react';
import { 
  Utensils, 
  Camera, 
  TrainFront, 
  Hotel, 
  ShoppingBag, 
  MoreHorizontal,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow
} from 'lucide-react';
import { ActivityType } from './types';

export const COLORS = {
  bgPrimary: '#1C1C1E',
  bgSecondary: '#2C2C2E',
  bgTertiary: '#3A3A3C',
  brandGold: '#D4AF37',
  brandBlack: '#050505',
  brandNavy: '#1A1A2E',
  accentSakura: '#A28D91',
  accentMatcha: '#4F5D4C',
  accentRed: '#9B2C2C',
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  separator: '#38383A',
  border: '#48484A',
};

export const ACTIVITY_CONFIG = {
  [ActivityType.FOOD]: { icon: <Utensils size={18} />, color: '#F97316', label: 'Food' },
  [ActivityType.SIGHTSEEING]: { icon: <Camera size={18} />, color: '#3B82F6', label: 'Sightseeing' },
  [ActivityType.TRANSPORT]: { icon: <TrainFront size={18} />, color: '#22C55E', label: 'Transport' },
  [ActivityType.HOTEL]: { icon: <Hotel size={18} />, color: '#A855F7', label: 'Hotel' },
  [ActivityType.SHOPPING]: { icon: <ShoppingBag size={18} />, color: '#EC4899', label: 'Shopping' },
  [ActivityType.OTHER]: { icon: <MoreHorizontal size={18} />, color: '#94A3B8', label: 'Other' },
};

export const WEATHER_ICONS = {
  Sun: <Sun className="text-yellow-400" size={20} />,
  CloudSun: <CloudSun className="text-yellow-200" size={20} />,
  Cloud: <Cloud className="text-gray-400" size={20} />,
  CloudRain: <CloudRain className="text-blue-400" size={20} />,
  CloudSnow: <CloudSnow className="text-white" size={20} />,
};