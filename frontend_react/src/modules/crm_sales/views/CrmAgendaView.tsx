import { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { RefreshCw, User } from 'lucide-react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../context/LanguageContext';
import AgendaEventForm, { type AgendaEventFormData, type SellerOption } from '../components/AgendaEventForm';
import MobileAgenda from '../../../components/MobileAgenda';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

const FETCH_DEBOUNCE_MS = 400;

const CRM_AGENDA_EVENTS = '/admin/core/crm/agenda/events';
const CRM_SELLERS = '/admin/core/crm/sellers';

export interface CrmAgendaEvent {
  id: string;
  tenant_id: number;
  seller_id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  lead_id?: string;
  client_id?: number;
  notes?: string;
  source?: string;
  status: string;
  seller_name?: string;
  appointment_datetime?: string;
}

export default function CrmAgendaView() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [events, setEvents] = useState<CrmAgendaEvent[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CrmAgendaEvent | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [formData, setFormData] = useState<Partial<AgendaEventFormData>>({});
  const calendarRef = useRef<FullCalendar>(null);
  const lastRangeRef = useRef<{ start: string; end: string; seller: string } | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(CRM_SELLERS);
        if (cancelled) return;
        const list = (res.data || []).filter((s: SellerOption) => s.is_active);
        setSellers(list);
      } catch (e) {
        console.error('Error fetching sellers:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchData = useCallback(async (startDate: Date, endDate: Date, isBackground = false) => {
    const rangeKey = `${startDate.getTime()}-${endDate.getTime()}-${selectedSellerId}`;
    if (lastRangeRef.current?.start === startDate.toISOString() && lastRangeRef.current?.end === endDate.toISOString() && lastRangeRef.current?.seller === selectedSellerId) {
      return;
    }
    lastRangeRef.current = { start: startDate.toISOString(), end: endDate.toISOString(), seller: selectedSellerId };

    try {
      if (!isBackground) setLoading(true);
      else setIsBackgroundSyncing(true);

      const params: Record<string, string> = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };
      if (selectedSellerId && selectedSellerId !== 'all') {
        params.seller_id = selectedSellerId;
      }

      const eventsRes = await api.get(CRM_AGENDA_EVENTS, { params });
      const list = eventsRes.data || [];
      setEvents(list);
      initialLoadDoneRef.current = true;
    } catch (err) {
      console.error('Error fetching agenda:', err);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsBackgroundSyncing(false);
    }
  }, [selectedSellerId]);

  const fetchDataForRange = useCallback((start: Date, end: Date, isBackground = false) => {
    fetchData(start, end, isBackground);
  }, [fetchData]);

  useEffect(() => {
    const base = selectedDate || new Date();
    const start = startOfDay(subDays(base, 7));
    const end = endOfDay(addDays(base, 7));
    lastRangeRef.current = null;
    fetchData(start, end, false);
  }, [selectedSellerId, fetchData]);

  useEffect(() => {
    if (isMobile && selectedDate) {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      fetchData(start, end, true);
    }
  }, [selectedDate, isMobile, fetchData]);

  const handleDatesSet = useCallback((info: { start: Date; end: Date }) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      fetchDataForRange(info.start, info.end, true);
    }, FETCH_DEBOUNCE_MS);
  }, [fetchDataForRange]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const filteredEvents = selectedSellerId && selectedSellerId !== 'all'
    ? events.filter((e) => e.seller_id.toString() === selectedSellerId)
    : events;

  const calendarEvents = filteredEvents.map((evt) => ({
    id: evt.id,
    title: evt.title,
    start: evt.start_datetime,
    end: evt.end_datetime,
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    extendedProps: { ...evt, eventType: 'agenda_event' },
  }));

  const handleDateClick = (info: { date: Date }) => {
    const now = new Date();
    if (info.date < now) {
      alert('⚠️ ' + t('agenda_crm.alert_past_date'));
      return;
    }
    const localDate = new Date(info.date.getTime() - info.date.getTimezoneOffset() * 60000);
    const localIso = localDate.toISOString().slice(0, 16);
    const endIso = new Date(localDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    setSelectedDate(info.date);
    setSelectedEvent(null);
    setFormData({
      seller_id: selectedSellerId && selectedSellerId !== 'all' ? parseInt(selectedSellerId, 10) : (sellers[0]?.id ?? 0),
      title: '',
      start_datetime: localIso,
      end_datetime: endIso,
      notes: '',
    });
    setShowModal(true);
  };

  const handleEventClick = (info: any) => {
    const evt = info.event.extendedProps as CrmAgendaEvent;
    setSelectedEvent(evt);
    setSelectedDate(info.event.start);
    setFormData({
      seller_id: evt.seller_id,
      title: evt.title,
      start_datetime: evt.start_datetime,
      end_datetime: evt.end_datetime,
      notes: evt.notes || '',
    });
    setShowModal(true);
  };

  const refetchCurrentRange = useCallback(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      lastRangeRef.current = null;
      fetchData(api.view.activeStart, api.view.activeEnd, true);
    } else {
      const base = selectedDate || new Date();
      lastRangeRef.current = null;
      fetchData(startOfDay(subDays(base, 7)), endOfDay(addDays(base, 7)), true);
    }
  }, [fetchData, selectedDate]);

  const handleSave = async (data: AgendaEventFormData) => {
    if (selectedEvent) {
      await api.put(`${CRM_AGENDA_EVENTS}/${selectedEvent.id}`, {
        title: data.title,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        notes: data.notes || null,
      });
    } else {
      await api.post(CRM_AGENDA_EVENTS, {
        seller_id: data.seller_id,
        title: data.title,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        notes: data.notes || null,
        source: 'manual',
      });
    }
    await refetchCurrentRange();
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`${CRM_AGENDA_EVENTS}/${id}`);
    await refetchCurrentRange();
    setShowModal(false);
  };

  const mobileAppointments = filteredEvents.map((evt) => ({
    ...evt,
    appointment_datetime: evt.start_datetime,
    end_datetime: evt.end_datetime,
    patient_name: evt.title,
    professional_id: evt.seller_id,
    status: evt.status,
    source: evt.source || 'manual',
  }));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-white">
      <div className="flex-shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 bg-[#050505]/50 backdrop-blur-md border-b border-white/10 pb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full lg:w-auto gap-6">
            <div className="border-l-4 border-blue-500 pl-4 min-w-0">
              <h1 className="text-2xl font-bold text-white tracking-tight">{t('agenda_crm.title')}</h1>
              <p className="text-sm text-gray-400 font-medium mt-0.5">{t('agenda_crm.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.02] px-4 py-2.5 rounded-xl shadow-lg border border-white/10 w-full sm:w-auto backdrop-blur-sm group hover:border-white/20 transition-all">
              <User size={18} className="text-blue-400 shrink-0" />
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none text-white cursor-pointer w-full appearance-none"
              >
                <option value="all" className="bg-[#151515]">{t('agenda_crm.all_sellers')}</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id.toString()} className="bg-[#151515]">
                    {s.first_name} {s.last_name || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isBackgroundSyncing && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <RefreshCw size={14} className="text-blue-400 animate-spin" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sincronizando</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 relative">
        {isMobile ? (
          <div className="flex flex-col h-full min-h-0 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden">
            <MobileAgenda
              appointments={mobileAppointments}
              googleBlocks={[]}
              selectedDate={selectedDate || new Date()}
              onDateChange={(d) => setSelectedDate(d)}
              onEventClick={(evt: any) => {
                const full = filteredEvents.find((e) => e.id === evt.id);
                if (full) {
                  setSelectedEvent(full);
                  setFormData({ seller_id: full.seller_id, title: full.title, start_datetime: full.start_datetime, end_datetime: full.end_datetime, notes: full.notes || '' });
                  setShowModal(true);
                }
              }}
              professionals={sellers.map((s) => ({ id: s.id, first_name: s.first_name, last_name: s.last_name, email: s.email, is_active: s.is_active }))}
            />
          </div>
        ) : (
          <div className="h-full min-h-0 bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-4 sm:p-6 overflow-y-auto custom-calendar-glass">
            {loading && events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">{t('common.loading')}</p>
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                initialView="timeGridWeek"
                editable={false}
                selectable={true}
                dayMaxEvents={true}
                weekends={true}
                nowIndicator={true}
                slotDuration="00:15:00"
                slotLabelInterval="01:00"
                initialDate={new Date()}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridDay,timeGridWeek,dayGridMonth',
                }}
                height="100%"
                datesSet={handleDatesSet}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                locale={language}
                buttonText={{
                  today: t('agenda.today'),
                  month: t('agenda.month'),
                  week: t('agenda.week'),
                  day: t('agenda.day'),
                }}
                events={calendarEvents}
              />
            )}
          </div>
        )}
      </main>

      <AgendaEventForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={selectedEvent ? { id: selectedEvent.id, ...formData } : formData}
        sellers={sellers}
        onSubmit={handleSave}
        onDelete={selectedEvent ? handleDelete : undefined}
        isEditing={!!selectedEvent}
      />
    </div>
  );
}
