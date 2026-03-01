import { db } from '@/db';
import { purchaseOrders, patientCensus } from '@/db/schema';
import { desc } from 'drizzle-orm';
import CalendarLedger from './CalendarLedger';

export default async function Home() {
  const pos = await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.poDate));
  const allCensus = await db.select().from(patientCensus);

  const dailyPatientCounts = allCensus.reduce((acc, curr) => {
    acc[curr.date] = (acc[curr.date] || 0) + curr.patientCount;
    return acc;
  }, {} as Record<string, number>);

  const posEvents = pos.map(po => ({
    id: `po-${po.id.toString()}`,
    title: `PO: ${po.status}`,
    date: po.targetDate, // Map to target date so user knows which day the PO is for
    extendedProps: {
      isPo: true,
      realId: po.id.toString(),
      status: po.status,
      targetDate: po.targetDate,
      totalCost: po.totalCost,
    },
    backgroundColor: po.status === 'LOCKED' ? '#10b981' : '#f59e0b',
    borderColor: po.status === 'LOCKED' ? '#059669' : '#d97706',
  }));

  const censusEvents = Object.entries(dailyPatientCounts).map(([date, count]) => ({
    id: `census-${date}`,
    title: `👥 ${count} Patients`,
    date: date,
    extendedProps: {
      isCensus: true,
      date,
      count
    },
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 md:p-6 border border-slate-200 dark:border-slate-800">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Procurement Calendar</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage Purchase Orders and Patient Census.</p>
      </div>
      
      <CalendarLedger initialEvents={[...posEvents, ...censusEvents]} />
    </div>
  );
}