"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PALETTE = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#0ea5e9", "#84cc16",
  "#6366f1", "#d946ef", "#eab308", "#06b6d4", "#f43f5e"
];

export default function AnalyticsCharts({
  chartData,
  ingredientUsageChart
}: {
  chartData: any[];
  ingredientUsageChart?: any[];
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const textColor = isDark ? "#e2e8f0" : "#475569";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  // Chart 1: PO Cost vs Patient Count
  const labels1 = chartData.map((d) => {
    const parts = d.date.split("-");
    return `${parts[2]}`; // Just day
  });

  const data1 = {
    labels: labels1,
    datasets: [
      {
        type: "line" as const,
        label: "Jumlah Pasien",
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b",
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        data: chartData.map((d) => d.patientCount),
        yAxisID: "y1",
      },
      {
        type: "bar" as const,
        label: "Biaya PO (IDR)",
        backgroundColor: "#3b82f6",
        data: chartData.map((d) => d.poCost),
        yAxisID: "y",
      },
    ],
  };

  const options1 = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    color: textColor,
    scales: {
      x: {
        grid: {
          display: false,
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Biaya PO (IDR)",
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          callback: function (value: any) {
            if (value >= 1000000) return value / 1000000 + "M";
            if (value >= 1000) return value / 1000 + "k";
            return value;
          },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Jumlah Pasien",
          color: textColor,
        },
        grid: {
          drawOnChartArea: false,
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (context.dataset.yAxisID === "y") {
                label += new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(context.parsed.y);
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
  };

  // Chart 2: Ingredient Usage over Time
  const ingredientKeys = ingredientUsageChart && ingredientUsageChart.length > 0
    ? Object.keys(ingredientUsageChart[0]).filter(k => k !== "date")
    : [];

  const labels2 = (ingredientUsageChart || []).map((d) => {
    const parts = d.date.split("-");
    return `${parts[2]}`; // Just day
  });

  const datasets2 = ingredientKeys.map((ingredientName, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    return {
      type: "line" as const,
      label: ingredientName,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      data: (ingredientUsageChart || []).map((d) => d[ingredientName] || 0),
    };
  });

  const data2 = {
    labels: labels2,
    datasets: datasets2,
  };

  const options2 = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    color: textColor,
    scales: {
      x: {
        grid: {
          display: false,
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Penggunaan (Kg)",
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += `${context.parsed.y} Kg`;
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          Biaya PO vs Jumlah Pasien
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Korelasi harian antara pengeluaran pengadaan dan sensus pasien.
        </p>
        <div className="h-[400px] w-full overflow-x-auto min-w-[300px]">
          <Chart type="bar" options={options1} data={data1} />
        </div>
      </div>

      {ingredientUsageChart && ingredientUsageChart.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Penggunaan Bahan Seiring Waktu
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Penggunaan harian bahan (dalam Kg) sepanjang bulan.
          </p>
          <div className="h-[400px] w-full overflow-x-auto min-w-[300px]">
            <Chart type="line" options={options2} data={data2} />
          </div>
        </div>
      )}
    </div>
  );
}
