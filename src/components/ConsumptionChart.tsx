"use client";

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { Reading, UNIT_LABELS, UTILITY_LABELS, UTILITY_UNITS } from "@/lib/types";

interface Props {
  readings: Reading[];
  filterUnit: string;
  filterUtility: string;
}

const COLORS: Record<string, Record<number, string>> = {
  gas: { 1: "#dc2626", 2: "#2563eb" },
  water: { 1: "#dc2626", 2: "#2563eb" },
  electricity: { 1: "#dc2626", 2: "#2563eb" },
};

const MONATE_KURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

interface ConsumptionPoint {
  date: string;
  timestamp: number;
  [key: string]: number | string | undefined;
}

interface SeriesInfo {
  key: string;
  trendKey: string;
  color: string;
  unitNum: number;
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return (new Date(b).getTime() - new Date(a).getTime()) / msPerDay;
}

const DAYS_PER_MONTH = 30.4375;

function toTs(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function formatMonthYear(ts: number): string {
  const d = new Date(ts);
  return `${MONATE_KURZ[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(2)}`;
}

function formatTooltipDate(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MONATE_KURZ[d.getUTCMonth()];
  const year = String(d.getUTCFullYear()).slice(2);
  return `${day}-${mon}-${year}`;
}

function computeConsumption(readings: Reading[], filterUnit: string, filterUtility: string) {
  const groups: Record<string, Reading[]> = {};

  for (const r of readings) {
    if (filterUnit && r.unit !== Number(filterUnit)) continue;
    if (filterUtility && r.utility !== filterUtility) continue;
    const key = `${r.unit}-${r.utility}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  const allPoints: ConsumptionPoint[] = [];
  const seriesKeys: SeriesInfo[] = [];

  for (const [groupKey, rList] of Object.entries(groups)) {
    const sorted = [...rList].sort((a, b) => a.date.localeCompare(b.date));
    const [unitStr, utility] = groupKey.split("-");
    const unitNum = Number(unitStr);
    const seriesName = `${UNIT_LABELS[unitNum]} – ${UTILITY_LABELS[utility]}`;
    const trendName = `${seriesName} (Trend)`;

    seriesKeys.push({
      key: seriesName,
      trendKey: trendName,
      color: COLORS[utility]?.[unitNum] ?? "#888",
      unitNum,
    });

    const rawPoints: { date: string; timestamp: number; rate: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = daysBetween(sorted[i - 1].date, sorted[i].date);
      if (days <= 0) continue;
      const consumption = sorted[i].value - sorted[i - 1].value;
      const monthlyRate = (consumption / days) * DAYS_PER_MONTH;
      rawPoints.push({
        date: sorted[i].date,
        timestamp: new Date(sorted[i].date).getTime(),
        rate: Math.round(monthlyRate * 100) / 100,
      });
    }

    const trendValues: number[] = [];
    for (let i = 0; i < rawPoints.length; i++) {
      const window: { rate: number; weight: number }[] = [];
      for (let j = Math.max(0, i - 1); j <= Math.min(rawPoints.length - 1, i + 1); j++) {
        const timeDist = Math.abs(rawPoints[j].timestamp - rawPoints[i].timestamp);
        const maxDist =
          i > 0 && i < rawPoints.length - 1
            ? Math.max(
                Math.abs(rawPoints[i - 1].timestamp - rawPoints[i].timestamp),
                Math.abs(rawPoints[i + 1].timestamp - rawPoints[i].timestamp)
              )
            : timeDist || 1;
        const weight = maxDist > 0 ? 1 - timeDist / (maxDist * 2) : 1;
        window.push({ rate: rawPoints[j].rate, weight: Math.max(weight, 0.1) });
      }
      const totalWeight = window.reduce((s, w) => s + w.weight, 0);
      const avg = window.reduce((s, w) => s + w.rate * w.weight, 0) / totalWeight;
      trendValues.push(Math.round(avg * 100) / 100);
    }

    for (let i = 0; i < rawPoints.length; i++) {
      const { date, timestamp, rate } = rawPoints[i];
      const existing = allPoints.find((p) => p.timestamp === timestamp);
      if (existing) {
        existing[seriesName] = rate;
        existing[trendName] = trendValues[i];
      } else {
        allPoints.push({
          date,
          timestamp,
          [seriesName]: rate,
          [trendName]: trendValues[i],
        });
      }
    }
  }

  allPoints.sort((a, b) => a.timestamp - b.timestamp);
  return { points: allPoints, seriesKeys };
}

function buildSeasonBands(minTs: number, maxTs: number) {
  const bands: { x1: number; x2: number; color: string }[] = [];

  const startYear = new Date(minTs).getFullYear() - 1;
  const endYear = new Date(maxTs).getFullYear() + 1;

  for (let y = startYear; y <= endYear; y++) {
    bands.push({
      x1: toTs(`${y}-11-01`),
      x2: toTs(`${y + 1}-02-28`),
      color: "rgba(191, 219, 254, 0.35)",
    });
    bands.push({
      x1: toTs(`${y}-05-01`),
      x2: toTs(`${y}-08-31`),
      color: "rgba(253, 224, 171, 0.35)",
    });
  }

  return bands
    .filter((b) => b.x2 >= minTs && b.x1 <= maxTs)
    .map((b) => ({
      ...b,
      x1: Math.max(b.x1, minTs),
      x2: Math.min(b.x2, maxTs),
    }));
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  const dataItems = payload.filter(
    (p) => p.name !== "timestamp" && !p.name.includes("(Trend)") && typeof p.value === "number"
  );
  if (dataItems.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label ? formatTooltipDate(label) : ""}</p>
      {dataItems.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: {item.value.toFixed(1)} /Monat
        </p>
      ))}
    </div>
  );
}

function ChartLegend({ seriesKeys }: { seriesKeys: SeriesInfo[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center mt-2 text-sm">
      {seriesKeys.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <svg width="24" height="12">
            <line
              x1="0" y1="6" x2="24" y2="6"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.unitNum === 2 ? "4 3" : "none"}
            />
            <circle cx="12" cy="6" r="3" fill={s.color} />
          </svg>
          <span className="text-gray-700">{s.key}</span>
        </div>
      ))}
    </div>
  );
}

export default function ConsumptionChart({ readings, filterUnit, filterUtility }: Props) {
  const { points, seriesKeys } = computeConsumption(readings, filterUnit, filterUtility);

  if (points.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Nicht genug Daten. Mindestens 2 Ablesungen für die gleiche Wohnung und Versorger erforderlich.
      </div>
    );
  }

  const minTs = points[0].timestamp;
  const maxTs = points[points.length - 1].timestamp;
  const bands = buildSeasonBands(minTs, maxTs);
  const utilityUnit = filterUtility ? `${UTILITY_UNITS[filterUtility]}/Monat` : "/Monat";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-1">Monatlicher Verbrauch</h2>
      <p className="text-xs text-gray-500 mb-4">
        Normalisiert auf Monatsrate. Trend = zeitgewichteter 3-Punkt-Durchschnitt.
        <span className="inline-block ml-3 px-2 py-0.5 rounded" style={{ background: "rgba(191, 219, 254, 0.5)" }}>
          Winter
        </span>
        <span className="inline-block ml-1 px-2 py-0.5 rounded" style={{ background: "rgba(253, 224, 171, 0.5)" }}>
          Sommer
        </span>
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {bands.map((band, i) => (
            <ReferenceArea
              key={i}
              x1={band.x1}
              x2={band.x2}
              fill={band.color}
              fillOpacity={1}
              strokeOpacity={0}
            />
          ))}

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={[minTs, maxTs]}
            tickFormatter={formatMonthYear}
            tick={{ fontSize: 11 }}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: utilityUnit, angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />

          {seriesKeys.map((s) => (
            <Scatter
              key={s.key}
              name={s.key}
              dataKey={s.key}
              fill={s.color}
              r={4}
              legendType="none"
            />
          ))}

          {seriesKeys.map((s) => (
            <Line
              key={s.trendKey}
              name={s.trendKey}
              type="monotone"
              dataKey={s.trendKey}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.unitNum === 2 ? "6 4" : undefined}
              dot={false}
              connectNulls
              legendType="none"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      <ChartLegend seriesKeys={seriesKeys} />
    </div>
  );
}
