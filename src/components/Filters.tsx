"use client";

import { UNITS, UTILITIES, UTILITY_LABELS } from "@/lib/types";

interface Props {
  unit: string;
  utility: string;
  onUnitChange: (v: string) => void;
  onUtilityChange: (v: string) => void;
}

export default function Filters({ unit, utility, onUnitChange, onUtilityChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Wohnung</label>
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Alle Wohnungen</option>
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Versorger</label>
        <select
          value={utility}
          onChange={(e) => onUtilityChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {UTILITIES.map((u) => (
            <option key={u} value={u}>
              {UTILITY_LABELS[u]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
