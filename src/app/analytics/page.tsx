"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale } from "lucide-react";
import AnalyticsCharts from "./AnalyticsCharts";

export default function AnalyticsPage() {
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?month=${month}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handlePrevMonth = () => {
    const [y, m] = month.split("-").map(Number);
    if (m === 1) {
      setMonth(`${y - 1}-12`);
    } else {
      setMonth(`${y}-${String(m - 1).padStart(2, "0")}`);
    }
  };

  const handleNextMonth = () => {
    const [y, m] = month.split("-").map(Number);
    if (m === 12) {
      setMonth(`${y + 1}-01`);
    } else {
      setMonth(`${y}-${String(m + 1).padStart(2, "0")}`);
    }
  };

  const formattedMonth = new Date(month + "-01").toLocaleString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dasbor Analitik</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Ringkasan bulanan pengeluaran dan volume.</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <span className="font-medium text-slate-800 dark:text-slate-100 min-w-[120px] text-center">
            {formattedMonth}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Memuat...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Pengeluaran</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.totalExpense)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Jenis Bahan</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.totalIngredientTypes}</p>
            </div>
          </div>
          
          <AnalyticsCharts 
            chartData={data.chartData} 
            ingredientUsageChart={data.ingredientUsageChart} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top by Volume */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Paling Banyak Dibeli (Volume)</h3>
              </div>
              <div className="overflow-y-auto flex-1 pr-2">
                <table className="w-full text-left text-sm relative">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300">Nama</th>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300 text-right">Volume (Kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topByVolume?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="p-3 text-slate-900 dark:text-slate-100 font-medium">
                          {item.name}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 text-right">
                          {item.totalKg.toLocaleString("id-ID")} Kg
                        </td>
                      </tr>
                    ))}
                    {(!data.topByVolume || data.topByVolume.length === 0) && (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-slate-500">Tidak ada data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top by Cost */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pengeluaran Tertinggi (Biaya)</h3>
              </div>
              <div className="overflow-y-auto flex-1 pr-2">
                <table className="w-full text-left text-sm relative">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300">Nama</th>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300 text-right">Biaya (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topByCost?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="p-3 text-slate-900 dark:text-slate-100 font-medium">
                          {item.name}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 text-right">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                    {(!data.topByCost || data.topByCost.length === 0) && (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-slate-500">Tidak ada data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
