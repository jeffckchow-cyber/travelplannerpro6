import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Trip, AppState, Activity, Stay, TransportDetail } from './types';
import { saveLocalState, getLocalState } from './services/dbService';
import { syncAppState, fetchAppState } from './services/supabaseClient';

// Global state context for the application
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
}

const INITIAL_TRIPS: Trip[] = [];

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({ trips: INITIAL_TRIPS, activeTripId: null });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  
  // Use a ref to track the latest state for the sync debounce
  const stateRef = useRef(state);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 1. Initial Load (Supabase -> IndexedDB -> State)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Try cloud first
        const cloudState = await fetchAppState();
        if (cloudState && cloudState.trips) {
          console.log('[Store] Loaded from Cloud');
          setState(cloudState);
          await saveLocalState(cloudState);
          setIsInitialized(true);
          return;
        }

        // Fallback to local
        const localState = await getLocalState();
        if (localState && localState.trips) {
          console.log('[Store] Loaded from Local');
          setState(localState);
        } else {
          console.log('[Store] No existing data, starting fresh');
        }
      } catch (error) {
        console.error('[Store] Initialization Error:', error);
        // Try local if cloud failed
        const localState = await getLocalState();
        if (localState && localState.trips) {
          setState(localState);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    loadInitialData();
  }, []);

  // 2. Sync to Cloud & Local when state changes
  const syncData = useCallback(async (currentState: AppState) => {
    if (!isInitialized) return;

    setIsSyncing(true);
    setSyncError(false);

    try {
      // Always save locally immediately
      await saveLocalState(currentState);
      
      // Push to Supabase
      await syncAppState(currentState);
      console.log('[Store] Cloud Sync Complete');
    } catch (error) {
      console.error('[Store] Sync Failed:', error);
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  }, [isInitialized]);

  // Debounce state changes to prevent spamming the database
  useEffect(() => {
    if (!isInitialized) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncData(stateRef.current);
    }, 2000); // Wait 2 seconds after last change before syncing

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state, isInitialized, syncData]);

  const addTrip = (tripData: Omit<Trip, 'id' | 'dailyItinerary' | 'budget' | 'checklist' | 'status' | 'stays' | 'transports' | 'notes'>) => {
    const newTrip: Trip = {
      ...tripData,
      id: crypto.randomUUID(),
      status: 'planning',
      dailyItinerary: [],
      budget: { totalBudget: 0, expenses: [] },
      checklist: [],
      stays: [],
      transports: [],
      notes: ''
    };

    // Generate daily itinerary based on dates
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      newTrip.dailyItinerary.push({
        date: d.toISOString().split('T')[0],
        activities: []
      });
    }

    setState(prev => ({
      ...prev,
      trips: [...prev.trips, newTrip],
      activeTripId: newTrip.id
    }));
  };

  const updateTrip = (tripId: string, updates: Partial<Trip>) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => t.id === tripId ? { ...t, ...updates } : t)
    }));
  };

  const deleteTrip = (id: string) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.filter(t => t.id !== id),
      activeTripId: prev.activeTripId === id ? null : prev.activeTripId
    }));
  };

  const setActiveTrip = (id: string | null) => {
    setState(prev => ({ ...prev, activeTripId: id }));
  };

  const addActivity = (tripId: string, dayIndex: number, activity: Omit<Activity, 'id'>) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        const newItinerary = [...t.dailyItinerary];
        newItinerary[dayIndex] = {
          ...newItinerary[dayIndex],
          activities: [...newItinerary[dayIndex].activities, { ...activity, id: crypto.randomUUID() }]
        };
        return { ...t, dailyItinerary: newItinerary };
      })
    }));
  };

  const updateActivity = (tripId: string, dayIndex: number, activity: Activity) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        const newItinerary = [...t.dailyItinerary];
        newItinerary[dayIndex] = {
          ...newItinerary[dayIndex],
          activities: newItinerary[dayIndex].activities.map(a => a.id === activity.id ? activity : a)
        };
        return { ...t, dailyItinerary: newItinerary };
      })
    }));
  };

  const deleteActivity = (tripId: string, dayIndex: number, activityId: string) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        const newItinerary = [...t.dailyItinerary];
        newItinerary[dayIndex] = {
          ...newItinerary[dayIndex],
          activities: newItinerary[dayIndex].activities.filter(a => a.id !== activityId)
        };
        return { ...t, dailyItinerary: newItinerary };
      })
    }));
  };

  const addStay = (tripId: string, stay: Omit<Stay, 'id'>) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, stays: [...(t.stays || []), { ...stay, id: crypto.randomUUID() }] };
      })
    }));
  };

  const updateStay = (tripId: string, stay: Stay) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, stays: (t.stays || []).map(s => s.id === stay.id ? stay : s) };
      })
    }));
  };

  const deleteStay = (tripId: string, stayId: string) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, stays: (t.stays || []).filter(s => s.id !== stayId) };
      })
    }));
  };

  const addTransport = (tripId: string, transport: Omit<TransportDetail, 'id'>) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, transports: [...(t.transports || []), { ...transport, id: crypto.randomUUID() }] };
      })
    }));
  };

  const updateTransport = (tripId: string, transport: TransportDetail) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, transports: (t.transports || []).map(tr => tr.id === transport.id ? transport : tr) };
      })
    }));
  };

  const deleteTransport = (tripId: string, transportId: string) => {
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
        if (t.id !== tripId) return t;
        return { ...t, transports: (t.transports || []).filter(tr => tr.id !== transportId) };
      })
    }));
  };

  return (
    <TripContext.Provider value={{
      state,
      isSyncing,
      syncError,
      addTrip,
      updateTrip,
      deleteTrip,
      setActiveTrip,
      addActivity,
      updateActivity,
      deleteActivity,
      addStay,
      updateStay,
      deleteStay,
      addTransport,
      updateTransport,
      deleteTransport
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};