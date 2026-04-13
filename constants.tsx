
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
import React from 'react';
import { ActivityType } from './types';

export const COLORS = {
  bgPrimary: '#1C1C1E',
  bgSecondary: '#2C2C2E',
  bgTertiary: '#3A3A3C',
  // Coloro 091-37-14 (Deep Muted Bronze)
  brandGold: '#594D31', 
  // A lifted, luminous version of the same hue for high-contrast text/labels
  brandGoldLight: '#A68B5B',
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
  [ActivityType.FOOD]: { icon: <utensils size="{18}"/>, color: '#F97316', label: 'Food' },
  [ActivityType.SIGHTSEEING]: { icon: <camera size="{18}"/>, color: '#3B82F6', label: 'Sightseeing' },
  [ActivityType.TRANSPORT]: { icon: <trainfront size="{18}"/>, color: '#22C55E', label: 'Transport' },
  [ActivityType.HOTEL]: { icon: <hotel size="{18}"/>, color: '#A855F7', label: 'Hotel' },
  [ActivityType.SHOPPING]: { icon: <shoppingbag size="{18}"/>, color: '#EC4899', label: 'Shopping' },
  [ActivityType.OTHER]: { icon: <morehorizontal size="{18}"/>, color: '#94A3B8', label: 'Other' },
};

export const WEATHER_ICONS = {
  Sun: <sun classname="text-yellow-400" size="{20}"/>,
  CloudSun: <cloudsun classname="text-yellow-200" size="{20}"/>,
  Cloud: <cloud classname="text-gray-400" size="{20}"/>,
  CloudRain: <cloudrain classname="text-blue-400" size="{20}"/>,
  CloudSnow: <cloudsnow classname="text-white" size="{20}"/>,
};
