'use client';

import React, { useEffect, useState } from 'react';
import { Save, Lock, AlertTriangle, Users, FileText, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LedgerDrawer({ date, poId }: { date: string, poId: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null); // PO data
  
  const [diets, setDiets] = useState<any[]>([]);
  const [census, setCensus] = useState<Record<string, number>>({});
  const [isSavingCensus, setIsSavingCensus] = useState(false);
  const [isGeneratingPo, setIsGeneratingPo] = useState(false);
  const [censusSaved, setCensusSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dietsRes = await fetch('/api/diets');
        const dietsData = await dietsRes.json();
        setDiets(dietsData);

        const censusRes = await fetch(`/api/census?date=${date}`);
        const censusData = await censusRes.json();
        const censusMap: Record<string, number> = {};
        dietsData.forEach((d: any) => {
          censusMap[d.id] = 0;
        });
        censusData.forEach((c: any) => {
          censusMap[c.dietId] = c.patientCount;
        });
        setCensus(censusMap);
        setCensusSaved(censusData.length > 0);

        if (poId) {
          const poRes = await fetch(`/api/po/${poId}`);
          const poData = await poRes.json();
          setData(poData);
        } else {
          // Fallback check
          const posRes = await fetch(`/api/po?targetDate=${date}`);
          const posData = await posRes.json();
          if (posData && posData.length > 0) {
             const singlePoRes = await fetch(`/api/po/${posData[0].id}`);
             const singlePoData = await singlePoRes.json();
             setData(singlePoData);
          } else {
             setData(null);
          }
        }
      } catch (e) {
        console.error("Failed to load drawer data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [date, poId]);

  const handleCensusChange = (dietId: string, value: string) => {
    setCensus(prev => ({ ...prev, [dietId]: parseInt(value) || 0 }));
    setCensusSaved(false);
  };

  const saveCensus = async () => {
    setIsSavingCensus(true);
    try {
      await fetch('/api/census', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, counts: census })
      });
      setCensusSaved(true);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingCensus(false);
    }
  };

  const generatePo = async () => {
    setIsGeneratingPo(true);
    try {
      const res = await fetch('/api/po/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: date })
      });
      const result = await res.json();
      if (result.success && result.poId) {
        const poRes = await fetch(`/api/po/${result.poId}`);
        const poData = await poRes.json();
        setData(poData);
        router.refresh();
      } else {
        alert(result.error || 'Failed to generate PO');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate PO');
    } finally {
      setIsGeneratingPo(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded w-full mt-8"></div>
    </div>
  );

  const totalPatients = Object.values(census).reduce((acc, val) => acc + val, 0);

  return (
    <div className="space-y-8 pb-10">
      
      {/* SECTION 1: Patient Census Input */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Patient Census</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">{date}</span>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {diets.map(diet => (
              <div key={diet.id} className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{diet.name} Diet</label>
                <input 
                  type="number" 
                  min="0"
                  value={census[diet.id] || ''}
                  onChange={(e) => handleCensusChange(diet.id, e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-slate-50 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  disabled={data?.po?.status === 'LOCKED'}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Total Patients: <span className="text-indigo-600 dark:text-indigo-400 text-lg">{totalPatients}</span>
            </div>
            
            {(!data || !data.po || data.po.status !== 'LOCKED') && (
              <button 
                onClick={saveCensus}
                disabled={isSavingCensus}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isSavingCensus ? 'Saving...' : 'Save Census'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Ledger / PO View */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Purchase Order</h3>
        </div>
        
        <div className="p-4">
          {!data || !data.po ? (
            <div className="text-center py-6">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No Purchase Order generated for this date.</p>
              
              <button 
                onClick={generatePo}
                disabled={!censusSaved || totalPatients === 0 || isGeneratingPo}
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  !censusSaved || totalPatients === 0 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {isGeneratingPo ? 'Generating...' : 'Generate PO from Census'}
              </button>
              
              {!censusSaved && totalPatients > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex justify-center items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Save census first to generate PO
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">PO #{data.po.id}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Target Date: <span className="font-medium text-slate-700 dark:text-slate-300">{data.po.targetDate}</span></p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.po.status === 'LOCKED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400'}`}>
                  {data.po.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                {data.po.status === 'LOCKED' ? (
                  <><Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Immutable Record (Locked)</>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Draft - Editable quantities</>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Item</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {data.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{item.ingredientName}</td>
                        <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{item.actualQty.toFixed(2)} kg</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-100">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.actualQty * item.snapshotPricePerKg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-right text-slate-900 dark:text-slate-100">Total Cost</td>
                      <td className="px-3 py-3 text-right text-indigo-600 dark:text-indigo-400">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.po.totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
