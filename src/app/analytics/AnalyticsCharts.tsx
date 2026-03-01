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

export default function AnalyticsCharts({ chartData }: { chartData: any[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const textColor = isDark ? "#e2e8f0" : "#475569";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  const labels = chartData.map((d) => {
    const parts = d.date.split("-");
    return `${parts[2]}`; // Just day
  });

  const data = {
    labels,
    datasets: [
      {
        type: "line" as const,
        label: "Patient Count",
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
        label: "PO Cost (IDR)",
        backgroundColor: "#3b82f6",
        data: chartData.map((d) => d.poCost),
        yAxisID: "y",
      },
    ],
  };

  const options = {
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
          text: "PO Cost (IDR)",
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
          text: "Patient Count",
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
        PO Cost vs Patient Count
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Daily correlation between procurement expenses and patient census.
      </p>
      <div className="h-[400px] w-full overflow-x-auto min-w-[300px]">
        <Chart type="bar" options={options} data={data} />
      </div>
    </div>
  );
}
