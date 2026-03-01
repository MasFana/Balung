"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const formattedMonth = new Date(month + "-01").toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monthly overview of expenses and volume.</p>
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
        <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Expense</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.totalExpense)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Ingredient Types Bought</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.totalIngredientTypes}</p>
            </div>
          </div>
          <AnalyticsCharts chartData={data.chartData} />
        </>
      ) : null}
    </div>
  );
}
