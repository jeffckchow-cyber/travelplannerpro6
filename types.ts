export enum ActivityType {
  FOOD = 'Food',
  SIGHTSEEING = 'Sightseeing',
  TRANSPORT = 'Transport',
  HOTEL = 'Hotel',
  SHOPPING = 'Shopping',
  OTHER = 'Other'
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 data
}

export interface Activity {
  id: string;
  time: string;
  type: ActivityType;
  location: string;
  mapLink?: string;
  note: string;
  cost: number;
  attachments?: Attachment[];
}

export interface DayItinerary {
  day: number;
  date: string;
  activities: Activity[];
  weather?: {
    condition: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudRain' | 'CloudSnow';
    minTemp: number;
    maxTemp: number;
  };
}

export interface Stay {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  location: string;
  mapLink?: string;
  cost: number;
  note: string;
  attachments: Attachment[];
}

export interface TransportDetail {
  id: string;
  type: 'Flight' | 'Train' | 'Bus' | 'Rental Car';
  provider: string;
  flightNo?: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  cost: number;
  note: string;
  attachments: Attachment[];
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'ongoing' | 'completed';
  coverImage: string;
  bannerPosition?: number; // 0 to 100 percentage for vertical alignment
  dailyItinerary: DayItinerary[];
  stays: Stay[];
  transports: TransportDetail[];
  notes: string;
  budget: { total: number };
  checklist: { id: string; item: string; completed: boolean }[];
}

export interface AppState {
  trips: Trip[];
  activeTripId: string | null;
}