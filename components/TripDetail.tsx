
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  ChevronLeft,
  Calendar,
  Bed,
  Plane,
  TrainFront,
  Bus,
  Car,
  MapPin,
  ArrowRight,
  Paperclip,
  Download,
  X,
  ExternalLink,
  Settings,
  Clock,
  Camera,
  Eye,
  Maximize2,
  Navigation,
  Share2,
  Loader2,
  AlertCircle,
  Edit2,
  Save
} from 'lucide-react';
import { useTrips } from '../store';
import { ACTIVITY_CONFIG, COLORS } from '../constants';
import { ActivityType, Attachment, Activity, Stay, TransportDetail, Trip } from '../types';
import { Budget } from './Budget';
import { uploadAttachment } from '../services/supabaseClient';

type SubTab = 'itinerary' | 'stay' | 'transport' | 'budget' | 'notes';

interface TripDetailProps {
  onBack: () => void;
}

export const TripDetail: React.FC<TripDetailProps> = ({ onBack }) => {
  const { state, addActivity, updateActivity, deleteActivity, setActiveTrip, addStay, updateStay, deleteStay, addTransport, updateTransport, deleteTransport, updateNotes, updateTrip, deleteTrip } = useTrips();
  const trip = state.trips.find(t => t.id === state.activeTripId);
  
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('itinerary');
  const [selectedDay, setSelectedDay] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState<'activity' | 'stay' | 'transport' | 'settings' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<Attachment | null>(null);
  const lastBlobUrlRef = useRef<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({ time: '09:00', type: ActivityType.SIGHTSEEING, location: '', mapLink: '', note: '', cost: 0 });
  const [newStay, setNewStay] = useState<Partial<Stay>>({ name: '', location: '', mapLink: '', checkIn: '', checkOut: '', cost: 0, note: '' });
  const [newTransport, setNewTransport] = useState<Partial<TransportDetail>>({ 
    type: 'Flight', provider: '', flightNo: '', from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', cost: 0, note: '' 
  });
  const [editTripData, setEditTripData] = useState({ title: '', coverImage: '', bannerPosition: 50, startDate: '', endDate: '' });

  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Handle browser/system back button for modal
  useEffect(() => {
    const handlePopState = () => {
      if (previewItem) {
        setPreviewItem(null);
      }
    };
    if (previewItem) {
      window.history.pushState({ modal: 'preview' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewItem]);

  if (!trip) return null;

  const currentDay = trip.dailyItinerary[selectedDay] || trip.dailyItinerary[0];

  const getDateInfo = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.getDate(),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    };
  };

  const handleBack = () => {
    setActiveTrip(null);
    onBack();
  };

  const getMapPointName = (location: string, link?: string) => {
    if (!link) return location;
    try {
      const decodedUrl = decodeURIComponent(link);
      const placeMatch = decodedUrl.match(/\/place\/([^/@]+)/);
      if (placeMatch && placeMatch[1]) {
        return placeMatch[1].replace(/\+/g, ' ');
      }
      const qMatch = decodedUrl.match(/[?&]q=([^&]+)/);
      if (qMatch && qMatch[1]) {
        return qMatch[1].replace(/\+/g, ' ');
      }
    } catch (e) {
      console.warn("Failed to parse map link for name extraction", e);
    }
    return location;
  };

  const getTransportIcon = (type: TransportDetail['type'], size = 16) => {
    switch (type) {
      case 'Train': return <TrainFront size={size} />;
      case 'Bus': return <Bus size={size} />;
      case 'Rental Car': return <Car size={size} />;
      default: return <Plane size={size} />;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        console.log(`[Attachment] Starting upload for: ${file.name} (${file.size} bytes)`);
        let result = await uploadAttachment(file);
        
        // Fallback to Base64 if Supabase fails or returns RLS error
        if (!result || result === 'RLS_ERROR') {
          console.warn("[Attachment] Supabase upload failed or RLS error. Falling back to Base64.");
          result = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (re) => resolve(re.target?.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        }

        if (result) {
          console.log("[Attachment] Success! Adding to list.");
          setAttachments(prev => [...prev, { 
            id: crypto.randomUUID(), 
            name: file.name, 
            type: file.type, 
            data: result as string
          }]);
        } else {
          alert("Failed to process file. Please try again.");
        }
      } catch (error) {
        console.error("[Attachment] Critical failure", error);
        alert("An unexpected error occurred during upload.");
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = ''; 
      }
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const data = re.target?.result as string;
        updateTrip(trip.id, { coverImage: data });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportTrip = () => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.title.replace(/\s+/g, '_')}_itinerary.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const viewAttachment = (att: Attachment) => {
    // Cleanup previous blob URL if exists
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = null;
    }

    // If it's base64, convert to blob URL for better performance and PDF compatibility
    if (att.data.startsWith('data:')) {
      try {
        const parts = att.data.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        lastBlobUrlRef.current = blobUrl;
        setPreviewItem({ ...att, data: blobUrl });
      } catch (e) {
        console.error("Failed to create blob URL", e);
        setPreviewItem(att);
      }
    } else {
      setPreviewItem(att);
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
      }
    };
  }, []);

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

  const openActivityModal = (item?: Activity) => {
    if (item) {
      setEditingItem(item);
      setNewActivity(item);
      setAttachments(item.attachments || []);
    } else {
      setEditingItem(null);
      setNewActivity({ time: '09:00', type: ActivityType.SIGHTSEEING, location: '', mapLink: '', note: '', cost: 0 });
      setAttachments([]);
    }
    setIsModalOpen('activity');
  };

  const openStayModal = (item?: Stay) => {
    if (item) {
      setEditingItem(item);
      setNewStay(item);
      setAttachments(item.attachments || []);
    } else {
      setEditingItem(null);
      setNewStay({ name: '', location: '', mapLink: '', checkIn: '', checkOut: '', cost: 0, note: '' });
      setAttachments([]);
    }
    setIsModalOpen('stay');
  };

  const openTransportModal = (item?: TransportDetail) => {
    if (item) {
      setEditingItem(item);
      setNewTransport(item);
      setAttachments(item.attachments || []);
    } else {
      setEditingItem(null);
      setNewTransport({ type: 'Flight', provider: '', flightNo: '', from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', cost: 0, note: '' });
      setAttachments([]);
    }
    setIsModalOpen('transport');
  };

  const renderSubTabs = () => (
    <div className="flex justify-around bg-[#1C1C1E] border-b border-white/10 px-1 overflow-x-auto no-scrollbar">
      {(['itinerary', 'stay', 'transport', 'budget', 'notes'] as SubTab[]).map((tab) => (
        <button key={tab} onClick={() => setActiveSubTab(tab)} className={`flex flex-col items-center py-3 px-2 relative min-w-[60px] transition-all`}>
          <span className={`text-[9px] font-black uppercase tracking-wider ${activeSubTab === tab ? 'text-[#A68B5B]' : 'text-white/30'}`}>{tab}</span>
          {activeSubTab === tab && <motion.div layoutId="subTabUnderline" className="absolute bottom-0 w-6 h-[2px] bg-[#594D31]" />}
        </button>
      ))}
    </div>
  );

  const isDateInRange = (dateStr: string, start: string, end: string) => {
    const d = new Date(dateStr).setHours(0,0,0,0);
    const s = new Date(start).setHours(0,0,0,0);
    const e = new Date(end).setHours(0,0,0,0);
    return d >= s && d <= e;
  };

  const getModalTitle = () => {
    const action = editingItem ? 'Edit' : 'Add';
    switch (isModalOpen) {
      case 'activity': return `${action} Itinerary`;
      case 'stay': return `${action} Stay`;
      case 'transport': return `${action} Transport`;
      case 'settings': return 'Trip Settings';
      default: return '';
    }
  };

  const renderNotes = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-2 last:mb-0">
        {line.split(urlRegex).map((part, j) => {
          if (part.match(urlRegex)) {
            return <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-[#A68B5B] hover:underline break-all">{part}</a>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1E] text-white overflow-y-auto custom-scrollbar scroll-smooth">
      {/* BANNER SECTION */}
      <div className="shrink-0 relative group h-48 md:h-72 overflow-hidden bg-black">
        <img 
          src={trip.coverImage} 
          style={{ objectPosition: `50% ${trip.bannerPosition ?? 50}%` }}
          className="w-full h-full object-cover transition-all duration-300" 
          alt="Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-transparent to-black/30" />
        
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <button onClick={handleBack} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all">
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-1.5">
                <button onClick={() => bannerInputRef.current?.click()} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-[#A68B5B] hover:bg-[#594D31] hover:text-white transition-all" title="Upload Photo">
                    <Camera size={18} />
                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                </button>
                <button onClick={handleExportTrip} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-[#A68B5B] hover:bg-[#594D31] hover:text-white transition-all">
                    <Share2 size={18} />
                </button>
                <button onClick={() => { setEditTripData({ title: trip.title, coverImage: trip.coverImage, bannerPosition: trip.bannerPosition ?? 50, startDate: trip.startDate, endDate: trip.endDate }); setIsModalOpen('settings'); }} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-[#594D31] hover:text-white transition-all">
                    <Settings size={18} />
                </button>
            </div>
          </div>
          <div className="pointer-events-auto">
            <h1 className="text-3xl font-black uppercase tracking-tighter drop-shadow-2xl md:text-4xl">{trip.title}</h1>
            <p className="text-[#A68B5B] text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-lg md:text-xs">
              {new Date(trip.startDate).toLocaleDateString('en-GB')} - {new Date(trip.endDate).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>

      {/* STICKY HEADER SECTION */}
      <div className="sticky top-0 z-50 bg-[#1C1C1E] shadow-2xl">
        {renderSubTabs()}

        {activeSubTab === 'itinerary' && (
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth border-b border-white/5 bg-[#1C1C1E]">
            {trip.dailyItinerary.map((day, idx) => {
              const info = getDateInfo(day.date);
              const isActive = selectedDay === idx;
              return (
                <button key={idx} onClick={() => setSelectedDay(idx)} className={`flex flex-col items-center justify-center min-w-[42px] h-[50px] rounded-[14px] transition-all shrink-0 border ${isActive ? 'bg-white border-white text-black shadow-lg scale-105' : 'bg-[#2C2C2E] border-white/5 text-white/30'}`}>
                  <span className={`text-[8px] font-black uppercase mb-0.5 ${isActive ? 'text-black/50' : ''}`}>{info.day}</span>
                  <span className="text-base font-black leading-none">{info.date}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1">
        <div className="p-4 max-w-2xl mx-auto pb-24">
          
          {activeSubTab === 'itinerary' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Day {currentDay?.day}</h3>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">{currentDay?.date}</p>
                </div>
                <button onClick={() => openActivityModal()} className="w-10 h-10 bg-[#594D31] rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                  <Plus size={20} className="text-white" />
                </button>
              </div>

              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[8px] top-4 bottom-4 w-[1px] bg-white/5" />
                
                {/* TRANSPORT LIST */}
                {[...trip.transports]
                  .filter(t => t.departureDate === currentDay.date || t.arrivalDate === currentDay.date)
                  .sort((a, b) => {
                    const dateA = new Date(`${a.departureDate}T${a.departureTime || '00:00'}`).getTime();
                    const dateB = new Date(`${b.departureDate}T${b.departureTime || '00:00'}`).getTime();
                    return dateA - dateB;
                  })
                  .map(t => (
                   <div key={t.id} onClick={() => openTransportModal(t)} className="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 group relative transition-all cursor-pointer hover:border-[#594D31]/30">
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 text-[#A68B5B]">
                              <div className="w-8 h-8 bg-[#594D31]/10 rounded-lg flex items-center justify-center">
                                {getTransportIcon(t.type, 16)}
                              </div>
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">{t.type}</span>
                                <h4 className="font-black text-lg leading-none mt-0.5 flex items-center gap-2">{t.flightNo || t.provider} {t.attachments?.length > 0 && <Paperclip size={12} className="opacity-50" />}</h4>
                              </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteTransport(trip.id, t.id); }} className="p-1.5 text-white/10 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex items-center justify-between py-3 border-y border-white/5">
                          <div className="text-center flex-1">
                              <div className="text-xl font-black mb-0.5">{t.from}</div>
                              <div className="flex flex-col items-center">
                                  <p className="text-[8px] font-black text-[#A68B5B] mb-0.5 uppercase">{t.departureDate}</p>
                                  <p className="text-[9px] font-bold opacity-40 uppercase">{t.departureTime}</p>
                              </div>
                          </div>
                          <ArrowRight size={16} className="opacity-10 mx-1" />
                          <div className="text-center flex-1">
                              <div className="text-xl font-black mb-0.5">{t.to}</div>
                              <div className="flex flex-col items-center">
                                  <p className="text-[8px] font-black text-[#A68B5B] mb-0.5 uppercase">{t.arrivalDate}</p>
                                  <p className="text-[9px] font-bold opacity-40 uppercase">{t.arrivalTime}</p>
                              </div>
                          </div>
                      </div>
                   </div>
                ))}

                {/* STAY LIST */}
                {[...trip.stays]
                  .filter(s => isDateInRange(currentDay.date, s.checkIn, s.checkOut))
                  .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
                  .map(stay => (
                  <div key={stay.id} onClick={() => openStayModal(stay)} className="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 group relative transition-all cursor-pointer hover:border-[#594D31]/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#594D31]/10 text-[#A68B5B] rounded-lg flex items-center justify-center"><Bed size={20} /></div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg leading-tight flex items-center gap-2">{stay.name} {stay.attachments?.length > 0 && <Paperclip size={12} className="opacity-50 text-[#A68B5B]" />}</h4>
                        <div className="flex items-center gap-1 opacity-40 text-[10px] font-bold mt-0.5">
                          <MapPin size={10} /> {stay.location}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {stay.mapLink && (
                          <a href={stay.mapLink} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="p-1.5 text-[#A68B5B] hover:scale-110 transition-all"><MapPin size={14} /></a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteStay(trip.id, stay.id); }} className="p-1.5 bg-red-500/5 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* ITINERARY ENTRIES */}
                {currentDay?.activities.length === 0 && trip.stays.filter(s => isDateInRange(currentDay.date, s.checkIn, s.checkOut)).length === 0 && trip.transports.filter(t => t.departureDate === currentDay.date || t.arrivalDate === currentDay.date).length === 0 ? (
                  <div className="text-center py-16 opacity-10 font-black text-2xl italic tracking-tighter uppercase">No Plans Logged</div>
                ) : (
                  currentDay?.activities.map((act, idx) => {
                    const config = ACTIVITY_CONFIG[act.type];
                    const nextAct = currentDay.activities[idx + 1];
                    return (
                      <React.Fragment key={act.id}>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full border-[3px] border-[#1C1C1E] z-10" style={{ backgroundColor: config.color }} />
                          <div onClick={() => openActivityModal(act)} className="bg-[#2C2C2E] p-4 rounded-[24px] border border-white/5 group hover:border-[#594D31]/40 transition-all shadow-sm cursor-pointer">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color: config.color }}><Clock size={10} /> {act.time} • {config.label} {act.attachments?.length > 0 && <Paperclip size={10} className="opacity-50 ml-1 text-white" />}</span>
                              <div className="flex gap-2">
                                {act.mapLink && (<a href={act.mapLink} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="text-[#A68B5B] hover:scale-110 transition-all"><MapPin size={14} /></a>)}
                                <button onClick={(e) => { e.stopPropagation(); deleteActivity(trip.id, selectedDay, act.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-white/20 transition-all"><Trash2 size={14} /></button>
                              </div>
                            </div>
                            <h4 className="text-lg font-black mb-0.5">{act.location}</h4>
                            <p className="text-xs opacity-40 font-medium leading-relaxed line-clamp-2">{act.note}</p>
                          </div>
                        </div>

                        {/* DIRECTIONS BUBBLE */}
                        {nextAct && (
                          <div className="relative py-2 -my-2 flex items-center -ml-[21px] group/dir">
                            {/* Visual connector */}
                            <div className="absolute left-[5.5px] top-0 bottom-0 w-[1px] bg-white/10" />
                            <div className="absolute left-0 w-3 h-3 rounded-full border-[3px] border-[#1C1C1E] bg-[#594D31] z-10 scale-75 group-hover/dir:scale-100 transition-transform" />
                            
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(getMapPointName(act.location, act.mapLink))}&destination=${encodeURIComponent(getMapPointName(nextAct.location, nextAct.mapLink))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-6 flex items-center gap-2 bg-[#594D31]/10 hover:bg-[#594D31]/20 border border-[#594D31]/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#A68B5B] transition-all shadow-sm"
                            >
                              <Navigation size={10} className="rotate-45" /> Directions
                            </a>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'stay' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-2xl font-black">Stay</h3>
                 <button onClick={() => openStayModal()} className="bg-[#594D31] px-4 py-2 rounded-xl font-black text-[10px] text-white tracking-widest flex items-center gap-1.5 transition-all"><Plus size={14} /> ADD STAY</button>
               </div>
               {[...trip.stays]
                 .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
                 .map(stay => (
                 <div key={stay.id} onClick={() => openStayModal(stay)} className="bg-[#2C2C2E] p-4 rounded-[28px] border border-white/5 group relative transition-all cursor-pointer hover:border-[#594D31]/30">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-12 h-12 bg-[#594D31]/10 text-[#A68B5B] rounded-xl flex items-center justify-center"><Bed size={24} /></div>
                     <div className="flex-1">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-black text-xl leading-tight flex items-center gap-2">{stay.name} {stay.attachments?.length > 0 && <Paperclip size={14} className="opacity-50 text-[#A68B5B]" />}</h4>
                           <div className="flex items-center gap-1 opacity-40 text-[10px] font-bold"><MapPin size={10} /> {stay.location}</div>
                         </div>
                         <div className="flex gap-2">
                            {stay.mapLink && (
                              <a href={stay.mapLink} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="p-2 bg-black/20 rounded-full text-[#A68B5B] hover:bg-[#594D31] hover:text-white transition-all"><MapPin size={16} /></a>
                            )}
                         </div>
                       </div>
                       <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
                          <div className="flex items-center gap-1.5"><Calendar size={10} /> {stay.checkIn} — {stay.checkOut}</div>
                          {stay.cost > 0 && <div className="text-[#A68B5B]">${stay.cost}</div>}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          )}

          {activeSubTab === 'transport' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Transport</h3>
                 <button onClick={() => openTransportModal()} className="bg-[#594D31] px-4 py-2 rounded-xl font-black text-[10px] text-white tracking-widest flex items-center gap-1.5"><Plus size={14} /> ADD TRANSPORT</button>
               </div>
               {[...trip.transports]
                 .sort((a, b) => {
                   const dateA = new Date(`${a.departureDate}T${a.departureTime || '00:00'}`).getTime();
                   const dateB = new Date(`${b.departureDate}T${b.departureTime || '00:00'}`).getTime();
                   return dateA - dateB;
                 })
                 .map(t => (
                 <div key={t.id} onClick={() => openTransportModal(t)} className="bg-[#2C2C2E] p-4 rounded-[28px] border border-white/5 group cursor-pointer hover:border-[#594D31]/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-[#A68B5B]">
                          {getTransportIcon(t.type, 16)}
                          <h4 className="font-black text-lg leading-none flex items-center gap-2">{t.flightNo || t.provider} {t.attachments?.length > 0 && <Paperclip size={12} className="opacity-50" />}</h4>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteTransport(trip.id, t.id); }} className="p-1.5 text-white/10 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex items-center justify-between py-3 border-y border-white/5">
                        <div className="text-center flex-1">
                            <div className="text-xl font-black mb-0.5">{t.from}</div>
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black text-[#A68B5B] mb-1 uppercase">{t.departureDate}</p>
                                <p className="text-[10px] opacity-40 font-bold uppercase">{t.departureTime}</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="opacity-10" />
                        <div className="text-center flex-1">
                            <div className="text-xl font-black mb-0.5">{t.to}</div>
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black text-[#A68B5B] mb-1 uppercase">{t.arrivalDate}</p>
                                <p className="text-[10px] opacity-40 font-bold uppercase">{t.arrivalTime}</p>
                            </div>
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeSubTab === 'budget' && <Budget />}
          
          {activeSubTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase tracking-tight">Trip Notes</h3>
                <button 
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="p-2 bg-white/5 rounded-xl text-[#A68B5B] hover:bg-[#594D31]/10 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                >
                  {isEditingNotes ? <><Save size={14} /> Finish</> : <><Edit2 size={14} /> Edit</>}
                </button>
              </div>
              
              {isEditingNotes ? (
                <textarea 
                  className="w-full h-[400px] bg-[#2C2C2E] border border-white/10 rounded-[24px] p-6 outline-none focus:border-[#594D31] transition-all resize-none text-white/80 text-sm font-medium leading-relaxed shadow-inner" 
                  placeholder="Paste links, addresses, packing lists, or random thoughts..." 
                  value={trip.notes} 
                  onChange={(e) => updateNotes(trip.id, e.target.value)} 
                  autoFocus
                />
              ) : (
                <div className="w-full min-h-[400px] bg-[#2C2C2E] border border-white/5 rounded-[24px] p-6 text-white/70 text-sm font-medium leading-relaxed overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {trip.notes ? renderNotes(trip.notes) : <span className="opacity-20 italic">No notes added yet...</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-[#2C2C2E] w-full max-w-md rounded-[40px] p-6 max-h-[85vh] overflow-y-auto no-scrollbar border border-white/10 shadow-3xl">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-[#A68B5B]">{getModalTitle()}</h3>
                <button onClick={() => setIsModalOpen(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                {isModalOpen === 'activity' && (
                  <>
                    <div className="flex gap-1.5 p-1 bg-[#1C1C1E] rounded-xl mb-1 overflow-x-auto no-scrollbar">
                       {([ActivityType.FOOD, ActivityType.SIGHTSEEING, ActivityType.SHOPPING, ActivityType.OTHER] as ActivityType[]).map(type => (
                         <button key={type} onClick={() => setNewActivity({...newActivity, type})} className={`flex-1 min-w-[70px] py-2 text-[10px] font-black rounded-lg transition-all ${newActivity.type === type ? 'bg-[#594D31] text-white shadow-md' : 'text-white/20 hover:text-white/40'}`}>{type.toUpperCase()}</button>
                       ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Time</label>
                        <input type="time" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" value={newActivity.time} onChange={e => setNewActivity({...newActivity, time: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Cost ($)</label>
                        <input type="number" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="0" value={newActivity.cost || ''} onChange={e => setNewActivity({...newActivity, cost: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Destination Name</label>
                      <input type="text" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="e.g. Times Square" value={newActivity.location} onChange={e => setNewActivity({...newActivity, location: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Google Maps Link</label>
                      <input type="url" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="https://goo.gl/maps/..." value={newActivity.mapLink} onChange={e => setNewActivity({...newActivity, mapLink: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Additional Notes</label>
                      <textarea className="w-full bg-[#1C1C1E] rounded-xl p-4 h-24 text-sm font-medium resize-none border border-white/5 outline-none focus:border-[#594D31]" placeholder="Important details, tips, etc..." value={newActivity.note} onChange={e => setNewActivity({...newActivity, note: e.target.value})} />
                    </div>
                    
                    {/* Attachments Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Attachments</label>
                        <label className="cursor-pointer flex items-center gap-1 text-[9px] font-black text-[#A68B5B] uppercase hover:text-white transition-colors">
                          <Paperclip size={10} /> Add
                          <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                      </div>
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-[#1C1C1E] px-3 py-1.5 rounded-lg border border-white/5 text-xs">
                              <span className="truncate max-w-[100px] cursor-pointer hover:text-[#A68B5B]" onClick={() => viewAttachment(att)}>{att.name}</span>
                              <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {isUploading && <div className="text-[10px] text-[#A68B5B] animate-pulse">Uploading...</div>}
                    </div>

                    <button onClick={() => { editingItem ? updateActivity(trip.id, selectedDay, {...newActivity as Activity, attachments}) : addActivity(trip.id, selectedDay, {...newActivity as any, attachments}); setIsModalOpen(null); }} className="w-full py-4 bg-[#594D31] text-white rounded-[20px] font-black shadow-xl text-sm uppercase transition-all disabled:opacity-50" disabled={isUploading}>SAVE</button>
                  </>
                )}

                {isModalOpen === 'stay' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Hotel Name</label>
                      <input type="text" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="e.g. Grand Central Hotel" value={newStay.name} onChange={e => setNewStay({...newStay, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Full Address</label>
                      <input type="text" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="Street, City, State" value={newStay.location} onChange={e => setNewStay({...newStay, location: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Google Maps Link</label>
                      <input type="url" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="https://goo.gl/maps/..." value={newStay.mapLink} onChange={e => setNewStay({...newStay, mapLink: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="text-[8px] font-black opacity-30 uppercase ml-2 mb-0.5 block">Check-in</label><input type="date" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" value={newStay.checkIn} onChange={e => setNewStay({...newStay, checkIn: e.target.value})} /></div>
                      <div><label className="text-[8px] font-black opacity-30 uppercase ml-2 mb-0.5 block">Check-out</label><input type="date" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" value={newStay.checkOut} onChange={e => setNewStay({...newStay, checkOut: e.target.value})} /></div>
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Attachments</label>
                        <label className="cursor-pointer flex items-center gap-1 text-[9px] font-black text-[#A68B5B] uppercase hover:text-white transition-colors">
                          <Paperclip size={10} /> Add
                          <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                      </div>
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-[#1C1C1E] px-3 py-1.5 rounded-lg border border-white/5 text-xs">
                              <span className="truncate max-w-[100px] cursor-pointer hover:text-[#A68B5B]" onClick={() => viewAttachment(att)}>{att.name}</span>
                              <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {isUploading && <div className="text-[10px] text-[#A68B5B] animate-pulse">Uploading...</div>}
                    </div>

                    <button onClick={() => { editingItem ? updateStay(trip.id, {...newStay as Stay, attachments}) : addStay(trip.id, {...newStay as any, attachments}); setIsModalOpen(null); }} className="w-full py-4 bg-[#594D31] text-white rounded-[20px] font-black shadow-xl uppercase transition-all disabled:opacity-50" disabled={isUploading}>SAVE</button>
                  </>
                )}

                {isModalOpen === 'transport' && (
                  <>
                    <div className="flex gap-1.5 p-1 bg-[#1C1C1E] rounded-xl mb-1 overflow-x-auto no-scrollbar">
                       {(['Flight', 'Train', 'Bus', 'Rental Car'] as TransportDetail['type'][]).map(type => (
                         <button key={type} onClick={() => setNewTransport({...newTransport, type})} className={`flex-1 min-w-[80px] py-2 text-[10px] font-black rounded-lg transition-all ${newTransport.type === type ? 'bg-[#594D31] text-white shadow-md' : 'text-white/20 hover:text-white/40'}`}>{type.toUpperCase()}</button>
                       ))}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-2">Flight / Transit ID</label>
                      <input type="text" className="w-full bg-[#1C1C1E] rounded-xl px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="e.g. DL123" value={newTransport.flightNo} onChange={e => setNewTransport({...newTransport, flightNo: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Departure Point</label>
                        <input type="text" className="bg-[#1C1C1E] rounded-xl px-4 py-3 w-full text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="From (e.g. SFO)" value={newTransport.from} onChange={e => setNewTransport({...newTransport, from: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Arrival Point</label>
                        <input type="text" className="bg-[#1C1C1E] rounded-xl px-4 py-3 w-full text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" placeholder="To (e.g. JFK)" value={newTransport.to} onChange={e => setNewTransport({...newTransport, to: e.target.value})} />
                      </div>
                    </div>
                    <div className="p-4 bg-[#1C1C1E] rounded-[24px] space-y-4 border border-white/5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="text-[8px] font-black opacity-30 uppercase ml-2 block">Departure</label>
                          <input type="date" className="bg-[#2C2C2E] rounded-lg p-3 text-sm font-bold w-full border-none mb-1 outline-none" value={newTransport.departureDate} onChange={e => setNewTransport({...newTransport, departureDate: e.target.value})} />
                          <input type="time" className="bg-[#2C2C2E] rounded-lg p-3 text-sm font-bold w-full border-none outline-none" value={newTransport.departureTime} onChange={e => setNewTransport({...newTransport, departureTime: e.target.value})} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[8px] font-black opacity-30 uppercase ml-2 block">Arrival</label>
                          <input type="date" className="bg-[#2C2C2E] rounded-lg p-3 text-sm font-bold w-full border-none mb-1 outline-none" value={newTransport.arrivalDate} onChange={e => setNewTransport({...newTransport, arrivalDate: e.target.value})} />
                          <input type="time" className="bg-[#2C2C2E] rounded-lg p-3 text-sm font-bold w-full border-none outline-none" value={newTransport.arrivalTime} onChange={e => setNewTransport({...newTransport, arrivalTime: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black opacity-30 uppercase ml-2">Attachments</label>
                        <label className="cursor-pointer flex items-center gap-1 text-[9px] font-black text-[#A68B5B] uppercase hover:text-white transition-colors">
                          <Paperclip size={10} /> Add
                          <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                      </div>
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-[#1C1C1E] px-3 py-1.5 rounded-lg border border-white/5 text-xs">
                              <span className="truncate max-w-[100px] cursor-pointer hover:text-[#A68B5B]" onClick={() => viewAttachment(att)}>{att.name}</span>
                              <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {isUploading && <div className="text-[10px] text-[#A68B5B] animate-pulse">Uploading...</div>}
                    </div>

                    <button onClick={() => { editingItem ? updateTransport(trip.id, {...newTransport as TransportDetail, attachments}) : addTransport(trip.id, {...newTransport as any, attachments}); setIsModalOpen(null); }} className="w-full py-4 bg-[#594D31] text-white rounded-[20px] font-black shadow-xl uppercase transition-all disabled:opacity-50" disabled={isUploading}>SAVE</button>
                  </>
                )}

                {isModalOpen === 'settings' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black opacity-30 uppercase ml-3 tracking-[0.2em]">Journey Name</label>
                      <input type="text" className="w-full bg-[#1C1C1E] rounded-[18px] px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" value={editTripData.title} onChange={e => setEditTripData({...editTripData, title: e.target.value})} />
                    </div>
                    <div className="space-y-2 bg-[#1C1C1E] p-4 rounded-[24px] border border-white/5">
                      <div className="flex justify-between items-center mb-1"><label className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Banner Focus (Crop)</label><span className="text-[9px] font-black text-[#A68B5B]">{editTripData.bannerPosition}%</span></div>
                      <input type="range" min="0" max="100" className="w-full h-1 bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-[#594D31]" value={editTripData.bannerPosition} onChange={e => setEditTripData({...editTripData, bannerPosition: Number(e.target.value)})} />
                      <p className="text-[8px] text-white/20 text-center mt-1">Slide to adjust vertical framing</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black opacity-30 uppercase ml-3 tracking-[0.2em]">Start Date</label>
                            <input type="date" className="w-full bg-[#1C1C1E] rounded-[16px] px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" value={editTripData.startDate} onChange={e => setEditTripData({...editTripData, startDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black opacity-30 uppercase ml-3 tracking-[0.2em]">End Date</label>
                            <input type="date" className="w-full bg-[#1C1C1E] rounded-[16px] px-4 py-3 text-sm font-bold border border-white/5 outline-none focus:border-[#594D31]" value={editTripData.endDate} onChange={e => setEditTripData({...editTripData, endDate: e.target.value})} />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <button onClick={() => { updateTrip(trip.id, editTripData); setIsModalOpen(null); }} className="w-full py-4 bg-[#594D31] text-white rounded-[20px] font-black shadow-xl tracking-widest text-xs uppercase transition-all">SAVE</button>
                      <button onClick={() => { if(confirm('Erase this entire adventure?')) { setActiveTrip(null); deleteTrip(trip.id); }}} className="w-full py-2 text-red-500 font-bold text-[9px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity">Delete Journey</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewItem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
              <button onClick={() => setPreviewItem(null)} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"><X size={24} /></button>
              {previewItem.type.startsWith('image/') ? (
                <img src={previewItem.data} alt={previewItem.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              ) : previewItem.type.includes('pdf') ? (
                <div className="w-full h-[70vh] md:h-[80vh] flex flex-col gap-4">
                  <div className="flex-1 bg-white rounded-3xl overflow-hidden relative shadow-2xl border border-white/10">
                    <iframe 
                      src={previewItem.data} 
                      className="w-full h-full border-none" 
                      title={previewItem.name} 
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <a 
                      href={previewItem.data} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full flex items-center justify-center gap-3 bg-[#594D31] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#A68B5B] transition-all shadow-xl"
                    >
                      <ExternalLink size={18} /> Open Full Document
                    </a>
                    <p className="text-[9px] text-center text-white/30 font-black uppercase tracking-widest px-4">
                      On mobile devices, please open the full document to scroll through all pages.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#2C2C2E] p-8 rounded-2xl text-center">
                  <Paperclip size={48} className="mx-auto mb-4 text-[#A68B5B]" />
                  <h4 className="text-xl font-bold mb-2">{previewItem.name}</h4>
                  <a href={previewItem.data} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#594D31] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#A68B5B] transition-colors">
                    <Download size={16} /> Download File
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
