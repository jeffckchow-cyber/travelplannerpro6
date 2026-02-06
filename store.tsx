
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trip, AppState, Activity, Stay, TransportDetail } from './types';
import { saveLocalState, getLocalState } from './services/dbService';
import { syncAppState, fetchAppState } from './services/supabaseClient';

interface TripContextType {
  state: AppState;
  addTrip: (trip: Omit<Trip, 'id' | 'dailyItinerary' | 'budget' | 'checklist' | 'status' | 'stays' | 'transports' | 'notes'>) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setActiveTrip: (id: string | null) => void;
  addActivity: (tripId: string, dayIndex: number, activity: Omit<Activity, 'id'>) => void;
  updateActivity: (tripId: string, dayIndex: number, activity: Activity) => void;
  deleteActivity: (tripId: string, dayIndex: number, activityId: string) => void;
  addStay: (tripId: string, stay: Omit<Stay, 'id'>) => void;
  updateStay: (tripId: string, stay: Stay) => void;
  deleteStay: (tripId: string, stayId: string) => void;
  addTransport: (tripId: string, transport: Omit<TransportDetail, 'id'>) => void;
  updateTransport: (tripId: string, transport: TransportDetail) => void;
  deleteTransport: (tripId: string, transportId: string) => void;
  updateNotes: (tripId: string, notes: string) => void;
  updateChecklist: (tripId: string, itemId: string, completed: boolean) => void;
  addChecklistItem: (tripId: string, item: string) => void;
  importFullState: (newState: AppState) => void;
  importSingleTrip: (newTrip: Trip) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const INITIAL_TRIPS: Trip[] = [
  {
    id: 'preview-trip',
    title: 'US Trip 2026',
    startDate: '2026-05-19',
    endDate: '2026-05-26',
    status: 'planning',
    coverImage: 'https://images.unsplash.com/photo-1508433957232-31d15fe4a3ba?auto=format&fit=crop&w=1200&q=80',
    bannerPosition: 50,
    budget: { total: 5000 },
    notes: 'Exciting US road trip!',
    stays: [],
    transports: [],
    checklist: [],
    dailyItinerary: Array.from({ length: 8 }, (_, i) => {
      const date = new Date('2026-05-19');
      date.setDate(date.getDate() + i);
      return {
        day: i + 1,
        date: date.toISOString().split('T')[0],
        activities: [],
      };
    })
  }
];

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({ trips: INITIAL_TRIPS, activeTripId: null });

  // 1. Initial Load: IndexedDB (Fast) -> Supabase (Sync)
  useEffect(() => {
    const init = async () => {
      // Try local IndexedDB first
      const local = await getLocalState();
      if (local) {
        setState(local);
      }

      // Sync from Supabase in background
      const remote = await fetchAppState();
      if (remote) {
        setState(remote);
        await saveLocalState(remote);
      }
    };
    init();
  }, []);

  // 2. Persistence Side Effect
  useEffect(() => {
    if (state.trips.length > 0) {
      saveLocalState(state);
      // Background sync to Supabase (debounced ideally, but here direct for trial)
      if (navigator.onLine) {
        syncAppState(state);
      }
    }
  }, [state]);

  const addTrip = useCallback((data: any) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const dailyItinerary = Array.from({ length: diffDays }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { day: i + 1, date: date.toISOString().split('T')[0], activities: [] };
    });

    const newTrip: Trip = { ...data, id: crypto.randomUUID(), status: 'planning', budget: { total: 2000 }, checklist: [], stays: [], transports: [], notes: '', dailyItinerary };
    setState(prev => ({ ...prev, trips: [...prev.trips, newTrip] }));
  }, []);

  const updateTrip = useCallback((tripId: string, updates: Partial<Trip>) => {
    setState(prev => {
      const index = prev.trips.findIndex(t => t.id === tripId);
      if (index === -1) return prev;

      const oldTrip = prev.trips[index];
      const newTrip = { ...oldTrip, ...updates };

      if (updates.startDate !== undefined || updates.endDate !== undefined) {
        const s = new Date(newTrip.startDate);
        const e = new Date(newTrip.endDate);
        
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
          const daysCount = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);
          const existingActivities = new Map();
          oldTrip.dailyItinerary.forEach(d => existingActivities.set(d.date, d.activities));
          
          newTrip.dailyItinerary = Array.from({ length: daysCount }, (_, i) => {
            const d = new Date(s);
            d.setDate(s.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            return {
              day: i + 1,
              date: dateStr,
              activities: existingActivities.get(dateStr) || []
            };
          });
        }
      }

      const newTrips = [...prev.trips];
      newTrips[index] = newTrip;
      return { ...prev, trips: newTrips };
    });
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setState(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== id), activeTripId: prev.activeTripId === id ? null : prev.activeTripId }));
  }, []);

  const setActiveTrip = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeTripId: id }));
  }, []);

  const addActivity = useCallback((tripId: string, dayIndex: number, activity: Omit<Activity, 'id'>) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        const newDaily = [...trip.dailyItinerary];
        newDaily[dayIndex].activities.push({ ...activity, id: crypto.randomUUID() });
        return { ...trip, dailyItinerary: newDaily };
      })
    }));
  }, []);

  const updateActivity = useCallback((tripId: string, dayIndex: number, activity: Activity) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        const newDaily = [...trip.dailyItinerary];
        newDaily[dayIndex].activities = newDaily[dayIndex].activities.map(a => a.id === activity.id ? activity : a);
        return { ...trip, dailyItinerary: newDaily };
      })
    }));
  }, []);

  const deleteActivity = useCallback((tripId: string, dayIndex: number, activityId: string) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        const newDaily = [...trip.dailyItinerary];
        newDaily[dayIndex].activities = newDaily[dayIndex].activities.filter(act => act.id !== activityId);
        return { ...trip, dailyItinerary: newDaily };
      })
    }));
  }, []);

  const addStay = useCallback((tripId: string, stay: Omit<Stay, 'id'>) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, stays: [...trip.stays, { ...stay, id: crypto.randomUUID() }] } : trip) }));
  }, []);

  const updateStay = useCallback((tripId: string, stay: Stay) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, stays: trip.stays.map(s => s.id === stay.id ? stay : s) } : trip) }));
  }, []);

  const deleteStay = useCallback((tripId: string, stayId: string) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, stays: trip.stays.filter(s => s.id !== stayId) } : trip) }));
  }, []);

  const addTransport = useCallback((tripId: string, transport: Omit<TransportDetail, 'id'>) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, transports: [...trip.transports, { ...transport, id: crypto.randomUUID() }] } : trip) }));
  }, []);

  const updateTransport = useCallback((tripId: string, transport: TransportDetail) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, transports: trip.transports.map(t => t.id === transport.id ? transport : t) } : trip) }));
  }, []);

  const deleteTransport = useCallback((tripId: string, transportId: string) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, transports: trip.transports.filter(t => t.id !== transportId) } : trip) }));
  }, []);

  const updateNotes = useCallback((tripId: string, notes: string) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, notes } : trip) }));
  }, []);

  const updateChecklist = useCallback((tripId: string, itemId: string, completed: boolean) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, checklist: trip.checklist.map(item => item.id === itemId ? { ...item, completed } : item) } : trip) }));
  }, []);

  const addChecklistItem = useCallback((tripId: string, item: string) => {
    setState(prev => ({ ...prev, trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, checklist: [...trip.checklist, { id: crypto.randomUUID(), item, completed: false }] } : trip) }));
  }, []);

  const importFullState = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  const importSingleTrip = useCallback((newTrip: Trip) => {
    setState(prev => {
      const exists = prev.trips.find(t => t.id === newTrip.id);
      if (exists) {
        return {
          ...prev,
          trips: prev.trips.map(t => t.id === newTrip.id ? newTrip : t)
        };
      }
      return {
        ...prev,
        trips: [...prev.trips, newTrip]
      };
    });
  }, []);

  return (
    <TripContext.Provider value={{
      state, addTrip, updateTrip, deleteTrip, setActiveTrip, addActivity, updateActivity, deleteActivity, 
      addStay, updateStay, deleteStay, addTransport, updateTransport, deleteTransport, updateNotes, updateChecklist, addChecklistItem,
      importFullState, importSingleTrip
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used within TripProvider');
  return context;
};
