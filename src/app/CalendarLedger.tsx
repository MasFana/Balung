'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, CheckCircle, Clock } from 'lucide-react';
import LedgerDrawer from './LedgerDrawer';

export default function CalendarLedger({ initialEvents }: { initialEvents: any[] }) {
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleEventClick = (clickInfo: any) => {
    const props = clickInfo.event.extendedProps;
    if (props.isPo) {
      setSelectedPoId(props.realId);
      setSelectedDate(props.targetDate);
    } else if (props.isCensus) {
      setSelectedPoId(null);
      setSelectedDate(props.date);
    }
    setIsDrawerOpen(true);
  };

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setSelectedPoId(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex w-full relative">
      <div className={`w-full transition-all duration-300 ${isDrawerOpen ? 'lg:pr-[32rem]' : ''}`}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={initialEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          height="auto"
          eventContent={(arg) => {
            const props = arg.event.extendedProps;
            if (props.isCensus) {
              return (
                <div className="p-1 px-2 text-xs flex flex-col justify-center items-start text-white overflow-hidden text-ellipsis whitespace-nowrap w-full font-bold bg-blue-500 rounded-sm">
                  {arg.event.title}
                </div>
              );
            }
            
            const isLocked = props.status === 'LOCKED';
            const costFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(props.totalCost);
            return (
              <div className="p-1 px-2 text-xs flex flex-col justify-center items-start text-white overflow-hidden text-ellipsis whitespace-nowrap w-full">
                <div className="flex items-center gap-1 font-semibold">
                  {isLocked ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {arg.event.title}
                </div>
                <div className="opacity-90">{costFormatted}</div>
              </div>
            );
          }}
        />
      </div>

      {/* Side Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 lg:w-[32rem] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 mt-14 md:mt-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ledger Details</h2>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {selectedDate ? (
            <LedgerDrawer date={selectedDate} poId={selectedPoId} />
          ) : (
            <div className="flex justify-center items-center h-full text-slate-500 dark:text-slate-400">Select a day or PO to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}