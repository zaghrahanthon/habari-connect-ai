"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
  "#a78bfa",
  "#fb7185",
  "#2dd4bf",
];

type TrendChartProps = {
  labels: string[];
  values: number[];
  label: string;
};

export function AnalyticsTrendChart({ labels, values, label }: TrendChartProps) {
  if (labels.length === 0) {
    return <EmptyChart message="No trend data for this period." />;
  }

  return (
    <div className="relative h-64 w-full min-w-0">
      <Line
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              borderColor: "#818cf8",
              backgroundColor: "rgba(129, 140, 248, 0.15)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: {
              ticks: { color: "#a1a1aa", maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
              grid: { color: "rgba(39,39,42,0.8)" },
            },
            y: {
              ticks: { color: "#a1a1aa" },
              grid: { color: "rgba(39,39,42,0.8)" },
            },
          },
        }}
      />
    </div>
  );
}

type ChannelChartProps = {
  labels: string[];
  values: number[];
};

export function ChannelChart({ labels, values }: ChannelChartProps) {
  if (labels.length === 0) {
    return <EmptyChart message="No channel data for this period." />;
  }

  return (
    <div className="relative h-64 w-full min-w-0">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Sessions",
              data: values,
              backgroundColor: COLORS,
              borderRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: "#a1a1aa" },
              grid: { color: "rgba(39,39,42,0.8)" },
            },
            y: {
              ticks: { color: "#a1a1aa", autoSkip: false },
              grid: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

type DeviceChartProps = {
  labels: string[];
  values: number[];
};

export function DeviceChart({ labels, values }: DeviceChartProps) {
  if (labels.length === 0) {
    return <EmptyChart message="No device data for this period." />;
  }

  return (
    <div className="relative mx-auto h-64 w-full max-w-sm min-w-0">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: COLORS,
              borderWidth: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#a1a1aa", boxWidth: 12 },
            },
          },
        }}
      />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted">
      {message}
    </div>
  );
}
