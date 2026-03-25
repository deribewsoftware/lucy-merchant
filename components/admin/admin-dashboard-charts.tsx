"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
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
import type {
  AdminCategoryGmv,
  AdminGmvMonthPoint,
  AdminOrderStatusCount,
} from "@/lib/db/admin-analytics";
import type { OrderStatus } from "@/lib/domain/types";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

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
    gmvFill: "rgba(99, 102, 241, 0.12)",
    comFill: "rgba(16, 185, 129, 0.12)",
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
      const scheme = getComputedStyle(root).colorScheme;
      const dark = scheme === "dark";

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
        gmvFill: dark ? "rgba(129, 140, 248, 0.2)" : "rgba(99, 102, 241, .12)",
        comFill: dark ? "rgba(52, 211, 153, 0.18)" : "rgba(16, 185, 129, 0.12)",
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

function formatStatus(status: OrderStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const card =
  "rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm ring-1 ring-base-300/20 sm:p-5";

type Props = {
  ordersByStatus: AdminOrderStatusCount[];
  gmvByMonth: AdminGmvMonthPoint[];
  topCategories: AdminCategoryGmv[];
};

export function AdminDashboardCharts({
  ordersByStatus,
  gmvByMonth,
  topCategories,
}: Props) {
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
      labels: gmvByMonth.map((m) => m.label),
      datasets: [
        {
          label: "GMV (ETB)",
          data: gmvByMonth.map((m) => m.gmvEtb),
          yAxisID: "y",
          borderColor: theme.secondary,
          backgroundColor: theme.gmvFill,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: theme.secondary,
          pointBorderColor: theme.surface,
          pointBorderWidth: 2,
        },
        {
          label: "Platform fees (ETB)",
          data: gmvByMonth.map((m) => m.commissionEtb),
          yAxisID: "y1",
          borderColor: theme.success,
          backgroundColor: theme.comFill,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: theme.success,
          pointBorderColor: theme.surface,
          pointBorderWidth: 2,
        },
      ],
    }),
    [gmvByMonth, theme],
  );

  const lineOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: {
          position: "bottom" as const,
          align: "center" as const,
          labels: {
            color: theme.tick,
            boxWidth: 10,
            padding: 10,
            font: { size: 10 },
          },
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tick,
          bodyColor: theme.tooltipBody,
          borderColor: theme.grid,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              const v = Number(ctx.raw);
              return `${ctx.dataset.label ?? ""}: ${v.toLocaleString()} ETB`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: theme.grid },
          ticks: {
            color: theme.tick,
            maxRotation: 50,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            font: { size: 10 },
          },
        },
        y: {
          type: "linear" as const,
          position: "left" as const,
          beginAtZero: true,
          grid: { color: theme.grid },
          ticks: {
            color: theme.tick,
            callback: (v) => Number(v).toLocaleString(),
            font: { size: 10 },
            maxTicksLimit: 6,
          },
        },
        y1: {
          type: "linear" as const,
          position: "right" as const,
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: {
            color: theme.tick,
            callback: (v) => Number(v).toLocaleString(),
            font: { size: 10 },
            maxTicksLimit: 6,
          },
        },
      },
    }),
    [theme],
  );

  const doughnutData = useMemo(
    () => ({
      labels: ordersByStatus.map((s) => formatStatus(s.status)),
      datasets: [
        {
          data: ordersByStatus.map((s) => s.count),
          backgroundColor: ordersByStatus.map(
            (_, i) => statusColors[i % statusColors.length],
          ),
          borderWidth: theme.dark ? 2 : 3,
          borderColor: theme.surface,
          hoverOffset: 6,
        },
      ],
    }),
    [ordersByStatus, statusColors, theme.dark, theme.surface],
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
    const labels = topCategories.map((c) =>
      c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name,
    );
    return {
      labels,
      datasets: [
        {
          label: "GMV (ETB)",
          data: topCategories.map((c) => c.gmvEtb),
          backgroundColor: theme.barFill,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [topCategories, theme.barFill]);

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
            label: (ctx) =>
              `${ctx.dataset.label ?? ""}: ${Number(ctx.raw).toLocaleString()} ETB`,
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
            font: { size: 10 },
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: theme.tick,
            font: { size: 10 },
            maxTicksLimit: 12,
          },
        },
      },
    }),
    [theme],
  );

  const hasMonthData = gmvByMonth.some((m) => m.gmvEtb > 0 || m.commissionEtb > 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
      <div className={card}>
        <div className="mb-3 flex flex-wrap items-start gap-3 sm:mb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <HiOutlinePresentationChartLine className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-base-content">
              Revenue & platform fees trend
            </h3>
            <p className="text-xs text-base-content/60">
              Completed orders by month (last 6 months)
            </p>
          </div>
        </div>
        {!hasMonthData ? (
          <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-base-300 px-3 text-center text-sm text-base-content/55 sm:min-h-[16rem]">
            No completed orders in this window — charts fill as sales close.
          </div>
        ) : (
          <div className="relative h-[220px] w-full min-w-0 sm:h-64 md:h-72">
            <Line data={lineData} options={lineOptions} />
          </div>
        )}
      </div>

      <div className={card}>
        <div className="mb-3 flex flex-wrap items-start gap-3 sm:mb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineChartPie className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-base-content">
              Order pipeline mix
            </h3>
            <p className="text-xs text-base-content/60">
              All orders by workflow status
            </p>
          </div>
        </div>
        {ordersByStatus.length === 0 ? (
          <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-base-300 px-3 text-center text-sm text-base-content/55 sm:min-h-[16rem]">
            No orders recorded yet.
          </div>
        ) : (
          <div className="relative mx-auto h-[220px] w-full max-w-[min(100%,280px)] min-w-0 sm:h-64 sm:max-w-sm">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        )}
      </div>

      <div className={`${card} md:col-span-2`}>
        <div className="mb-3 flex flex-wrap items-start gap-3 sm:mb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <HiOutlineChartBarSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-base-content">
              Top categories by GMV
            </h3>
            <p className="text-xs text-base-content/60">
              Completed order volume attributed to taxonomy
            </p>
          </div>
        </div>
        {topCategories.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-base-300 px-3 text-sm text-base-content/55 sm:min-h-[14rem]">
            Category GMV appears after completed checkouts with categorized
            products.
          </div>
        ) : (
          <div className="relative h-[240px] w-full min-w-0 sm:h-64 md:h-72">
            <Bar data={barData} options={barOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
