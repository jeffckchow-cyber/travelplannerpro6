
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Trip, AppState, Activity, Stay, TransportDetail } from './types';
import { saveLocalState, getLocalState } from './services/dbService';
import { syncAppState, fetchAppState } from './services/supabaseClient';

interface TripContextType {
  state: AppState;
  isSyncing: boolean;
  syncError: boolean;
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
  refreshFromCloud: () => Promise<void>;
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const skipSyncRef = useRef(false);

  // Aggressive Fetch Logic: Open -> Local -> Remote
  useEffect(() => {
    const init = async () => {
      console.log("[AppInit] Initializing data...");
      
      const local = await getLocalState();
      if (local) {
        console.log("[AppInit] Local state restored.");
        setState(local);
      }

      if (navigator.onLine) {
        try {
          const remote = await fetchAppState();
          if (remote) {
            console.log("[AppInit] Cloud data found. Synchronizing...");
            skipSyncRef.current = true; 
            setState(remote);
            await saveLocalState(remote);
          }
        } catch (err) {
          console.error("[AppInit] Cloud sync interrupted during init.");
          setSyncError(true);
        }
      }
    };
    init();
  }, []);

  // Sync state to cloud on changes
  useEffect(() => {
    const performSync = async () => {
      if (skipSyncRef.current) {
        skipSyncRef.current = false;
        return;
      }

      // Important: Save locally first
      saveLocalState(state);

      if (navigator.onLine && state.trips.length > 0) {
        setIsSyncing(true);
        try {
          await syncAppState(state);
          setSyncError(false);
        } catch (e) {
          console.error("[Sync] Background update failed. Changes saved locally only.");
          setSyncError(true);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    const timer = setTimeout(performSync, 1000); // Debounce sync
    return () => clearTimeout(timer);
  }, [state]);

  const refreshFromCloud = async () => {
    if (!navigator.onLine) {
      alert("No internet connection.");
      return;
    }
    setIsSyncing(true);
    setSyncError(false);
    try {
      const remote = await fetchAppState();
      if (remote) {
        skipSyncRef.current = true;
        setState(remote);
        await saveLocalState(remote);
        console.log("[ManualSync] Successfully updated with cloud data.");
      } else {
        console.log("[ManualSync] No remote data available.");
      }
    } catch (err) {
      console.error("[ManualSync] Sync operation failed.");
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  };

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
      const newTrips = [...prev.trips];
      newTrips[index] = { ...newTrips[index], ...updates };
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
      state, isSyncing, syncError, addTrip, updateTrip, deleteTrip, setActiveTrip, addActivity, updateActivity, deleteActivity, 
      addStay, updateStay, deleteStay, addTransport, updateTransport, deleteTransport, updateNotes, updateChecklist, addChecklistItem,
      importFullState, importSingleTrip, refreshFromCloud
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
