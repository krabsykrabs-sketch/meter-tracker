"use client";

import { Reading, UNIT_LABELS, UTILITY_LABELS, UTILITY_UNITS } from "@/lib/types";

interface Props {
  readings: Reading[];
  filterUnit: string;
  filterUtility: string;
}

interface YearlyRow {
  year: number;
  values: Record<string, number | null>;
}

function computeYearlyConsumption(readings: Reading[], filterUnit: string, filterUtility: string) {
  const groups: Record<string, Reading[]> = {};
  for (const r of readings) {
    if (filterUnit && r.unit !== Number(filterUnit)) continue;
    if (filterUtility && r.utility !== filterUtility) continue;
    const key = `${r.unit}-${r.utility}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  const groupKeys = Object.keys(groups).sort();
  if (groupKeys.length === 0) return { years: [], groupKeys: [] };

  for (const key of groupKeys) {
    groups[key].sort((a, b) => a.date.localeCompare(b.date));
  }

  let minYear = Infinity;
  let maxYear = -Infinity;
  for (const key of groupKeys) {
    const dates = groups[key];
    const first = new Date(dates[0].date).getFullYear();
    const last = new Date(dates[dates.length - 1].date).getFullYear();
    minYear = Math.min(minYear, first);
    maxYear = Math.max(maxYear, last);
  }

  function interpolateAt(sorted: Reading[], targetDate: string): number | null {
    if (sorted.length === 0) return null;
    if (targetDate <= sorted[0].date) return null;
    if (targetDate >= sorted[sorted.length - 1].date) return null;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].date <= targetDate && sorted[i + 1].date >= targetDate) {
        const d1 = new Date(sorted[i].date).getTime();
        const d2 = new Date(sorted[i + 1].date).getTime();
        const dt = new Date(targetDate).getTime();
        const ratio = (dt - d1) / (d2 - d1);
        return sorted[i].value + ratio * (sorted[i + 1].value - sorted[i].value);
      }
    }
    return null;
  }

  const years: YearlyRow[] = [];

  for (let y = minYear; y <= maxYear; y++) {
    const startDate = `${y}-01-01`;
    const endDate = `${y}-12-31`;
    const row: YearlyRow = { year: y, values: {} };

    for (const key of groupKeys) {
      const sorted = groups[key];
      const startVal = interpolateAt(sorted, startDate);
      const endVal = interpolateAt(sorted, endDate);

      if (startVal !== null && endVal !== null) {
        row.values[key] = Math.round((endVal - startVal) * 100) / 100;
      } else {
        row.values[key] = null;
      }
    }

    years.push(row);
  }

  return { years, groupKeys };
}

function formatGroupLabel(key: string): { unit: string; utility: string } {
  const [unitStr, utility] = key.split("-");
  return {
    unit: UNIT_LABELS[Number(unitStr)],
    utility: UTILITY_LABELS[utility],
  };
}

export default function YearlyConsumption({ readings, filterUnit, filterUtility }: Props) {
  const { years, groupKeys } = computeYearlyConsumption(readings, filterUnit, filterUtility);

  if (years.length === 0) return null;

  const displayYears = years.filter((y) =>
    groupKeys.some((k) => y.values[k] !== null)
  );

  if (displayYears.length === 0) return null;

  const showUtilityCol = !filterUtility;
  const multipleUnits = new Set(groupKeys.map((k) => k.split("-")[0])).size > 1;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h2 className="text-lg font-semibold p-6 pb-0">Jahresverbrauch</h2>
      <p className="text-xs text-gray-500 px-6 mt-1">
        Geschätzter Gesamtverbrauch pro Kalenderjahr (interpoliert auf 01.01. – 31.12.).
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Jahr</th>
              {groupKeys.map((k) => {
                const { unit, utility } = formatGroupLabel(k);
                return (
                  <th key={k} className="px-6 py-3 text-right">
                    {multipleUnits ? `${unit} ` : ""}
                    {showUtilityCol ? utility : ""}
                    {!multipleUnits && !showUtilityCol ? unit : ""}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayYears.map((row) => (
              <tr key={row.year} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{row.year}</td>
                {groupKeys.map((k) => {
                  const utility = k.split("-")[1];
                  const unitStr = UTILITY_UNITS[utility] ?? "";
                  const val = row.values[k];
                  return (
                    <td key={k} className="px-6 py-3 text-right font-mono">
                      {val !== null ? (
                        <>
                          {val.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          <span className="text-gray-400 ml-1">{unitStr}</span>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
