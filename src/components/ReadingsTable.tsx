"use client";

import { useState } from "react";
import { Reading, UNIT_LABELS, UTILITY_LABELS, UTILITY_UNITS } from "@/lib/types";

const COLLAPSED_COUNT = 9;

interface Props {
  readings: Reading[];
  filterUnit: string;
  filterUtility: string;
  onEdit: (reading: Reading) => void;
  onDelete: (id: number) => void;
}

export default function ReadingsTable({
  readings,
  filterUnit,
  filterUtility,
  onEdit,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const filtered = readings.filter((r) => {
    if (filterUnit && r.unit !== Number(filterUnit)) return false;
    if (filterUtility && r.utility !== filterUtility) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const canExpand = sorted.length > COLLAPSED_COUNT;
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hiddenCount = sorted.length - COLLAPSED_COUNT;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h2 className="text-lg font-semibold p-6 pb-0">
        Alle Ablesungen
        <span className="text-sm font-normal text-gray-500 ml-2">({sorted.length} gesamt)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left mt-4">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Datum</th>
              <th className="px-6 py-3">Wohnung</th>
              <th className="px-6 py-3">Versorger</th>
              <th className="px-6 py-3 text-right">Zählerstand</th>
              <th className="px-6 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Noch keine Ablesungen vorhanden. Erste Ablesung oben hinzufügen.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{r.date}</td>
                  <td className="px-6 py-3">{UNIT_LABELS[r.unit]}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        r.utility === "gas"
                          ? "bg-orange-100 text-orange-700"
                          : r.utility === "water"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {UTILITY_LABELS[r.utility]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    {r.value.toLocaleString("de-DE", { minimumFractionDigits: 2 })}{" "}
                    <span className="text-gray-400">{UTILITY_UNITS[r.utility]}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => onEdit(r)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Diese Ablesung wirklich löschen?")) onDelete(r.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {canExpand && (
        <div className="px-6 py-3 border-t bg-gray-50 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expanded ? "Weniger anzeigen" : `${hiddenCount} weitere Ablesungen anzeigen`}
          </button>
        </div>
      )}
    </div>
  );
}
