"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  HiOutlineChartBarSquare,
  HiOutlineChartPie,
  HiOutlinePresentationChartLine,
} from "react-icons/hi2";
import type { MerchantChartsData } from "@/lib/merchant-analytics";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
);

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const FALLBACK = {
  primary: "oklch(0.55 0.22 290)",
  secondary: "oklch(0.58 0.2 330)",
  accent: "oklch(0.62 0.18 200)",
  success: "oklch(0.62 0.17 155)",
  warning: "oklch(0.75 0.15 85)",
  error: "oklch(0.58 0.2 25)",
};

function useChartPalette() {
  const [palette, setPalette] = useState({
    dark: false,
    primary: FALLBACK.primary,
    secondary: FALLBACK.secondary,
    accent: FALLBACK.accent,
    success: FALLBACK.success,
    warning: FALLBACK.warning,
    error: FALLBACK.error,
    lineFill: "rgba(139, 92, 246, 0.12)",
    barFill: "rgba(99, 102, 241, 0.55)",
    grid: "rgba(0,0,0,0.07)",
    tick: "#71717a",
    tooltipBg: "rgba(255,255,255,0.98)",
    tooltipBody: "#3f3f46",
    surface: "#fafafa",
  });

  useEffect(() => {
    const read = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const t = root.getAttribute("data-theme");
      const dark = t === "night";

      const primary = style.getPropertyValue("--p").trim() || FALLBACK.primary;
      const secondary = style.getPropertyValue("--s").trim() || FALLBACK.secondary;
      const accent = style.getPropertyValue("--a").trim() || FALLBACK.accent;
      const success = style.getPropertyValue("--su").trim() || FALLBACK.success;
      const warning = style.getPropertyValue("--wa").trim() || FALLBACK.warning;
      const error = style.getPropertyValue("--er").trim() || FALLBACK.error;

      setPalette({
        dark,
        primary,
        secondary,
        accent,
        success,
        warning,
        error,
        lineFill: dark ? "rgba(129, 140, 248, 0.2)" : "rgba(99, 102, 241, .12)",
        barFill: dark ? "rgba(129, 140, 248, 0.45)" : "rgba(99, 102, 241, 0.52)",
        grid: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
        tick: dark ? "#a1a1aa" : "#71717a",
        tooltipBg: dark ? "rgba(24,24,27,0.96)" : "rgba(255,255,255,0.98)",
        tooltipBody: dark ? "#e4e4e7" : "#3f3f46",
        surface: dark ? "#18181b" : "#fafafa",
      });
    };

    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return palette;
}

export function MerchantDashboardCharts({ data }: { data: MerchantChartsData }) {
  const theme = useChartPalette();

  const statusColors = useMemo(
    () => [
      theme.primary,
      theme.secondary,
      theme.accent,
      theme.success,
      theme.warning,
      theme.error,
    ],
    [theme],
  );

  const lineData = useMemo(
    () => ({
      labels: data.spendingByMonth.map((m) => m.label),
      datasets: [
        {
          label: "Spend (ETB)",
          data: data.spendingByMonth.map((m) => m.spendEtb),
          borderColor: theme.secondary,
          backgroundColor: theme.lineFill,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: theme.secondary,
          pointBorderColor: theme.surface,
          pointBorderWidth: 2,
        },
      ],
    }),
    [data.spendingByMonth, theme],
  );

  const lineOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tick,
          bodyColor: theme.tooltipBody,
          borderColor: theme.grid,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label ?? ""}: ${Number(ctx.raw).toLocaleString()} ETB`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: theme.grid },
          ticks: { color: theme.tick, maxRotation: 45, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: theme.grid },
          ticks: {
            color: theme.tick,
            callback: (v) => Number(v).toLocaleString(),
          },
        },
      },
    }),
    [theme],
  );

  const doughnutData = useMemo(
    () => ({
      labels: data.ordersByStatus.map((s) => formatStatus(s.status)),
      datasets: [
        {
          data: data.ordersByStatus.map((s) => s.count),
          backgroundColor: data.ordersByStatus.map(
            (_, i) => statusColors[i % statusColors.length],
          ),
          borderWidth: theme.dark ? 2 : 3,
          borderColor: theme.surface,
          hoverOffset: 6,
        },
      ],
    }),
    [data.ordersByStatus, statusColors, theme.dark, theme.surface],
  );

  const doughnutOptions: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            color: theme.tick,
            boxWidth: 10,
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tick,
          bodyColor: theme.tooltipBody,
          borderColor: theme.grid,
          borderWidth: 1,
        },
      },
    }),
    [theme],
  );

  const barData = useMemo(() => {
    const labels = data.topLines.map((p) =>
      p.name.length > 22 ? `${p.name.slice(0, 20)}…` : p.name,
    );
    return {
      labels,
      datasets: [
        {
          label: "Spend (ETB)",
          data: data.topLines.map((p) => p.spendEtb),
          backgroundColor: theme.barFill,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [data.topLines, theme.barFill]);

  const barOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tick,
          bodyColor: theme.tooltipBody,
          borderColor: theme.grid,
          borderWidth: 1,
          callbacks: {
            afterLabel: (ctx) => {
              const i = ctx.dataIndex;
              const u = data.topLines[i]?.units;
              return u != null ? `${u} units ordered` : "";
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: theme.grid },
          ticks: {
            color: theme.tick,
            callback: (v) => Number(v).toLocaleString(),
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: theme.tick, font: { size: 11 } },
        },
      },
    }),
    [theme, data.topLines],
  );

  const card =
    "rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ring-1 ring-base-300/20";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={card}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <HiOutlinePresentationChartLine className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-base-content">
              Procurement trend
            </h3>
            <p className="text-xs text-base-content/60">
              Order totals by month (excludes rejected)
            </p>
          </div>
        </div>
        <div className="h-64">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      <div className={card}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineChartPie className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-base-content">
              Order status mix
            </h3>
            <p className="text-xs text-base-content/60">
              Where your purchases sit in the workflow
            </p>
          </div>
        </div>
        {data.ordersByStatus.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 text-center text-sm text-base-content/55">
            No orders yet — charts populate after your first checkout.
          </div>
        ) : (
          <div className="mx-auto h-64 max-w-xs sm:max-w-sm">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        )}
      </div>

      <div className={`${card} lg:col-span-2`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <HiOutlineChartBarSquare className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-base-content">
              Top SKUs by spend
            </h3>
            <p className="text-xs text-base-content/60">
              Lifetime line totals across your orders (non-rejected)
            </p>
          </div>
        </div>
        {data.topLines.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 text-sm text-base-content/55">
            Add items to your cart to see purchase concentration here.
          </div>
        ) : (
          <div className="h-72 max-w-3xl">
            <Bar data={barData} options={barOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
