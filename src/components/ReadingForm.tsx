"use client";

import { useState } from "react";
import { Reading, UNITS, UTILITIES, UTILITY_LABELS } from "@/lib/types";

interface Props {
  onSaved: () => void;
  editingReading?: Reading | null;
  onCancelEdit?: () => void;
}

export default function ReadingForm({ onSaved, editingReading, onCancelEdit }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(editingReading?.date ?? today);
  const [unit, setUnit] = useState(editingReading?.unit ?? 1);
  const [utility, setUtility] = useState(editingReading?.utility ?? "gas");
  const [value, setValue] = useState(editingReading?.value?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = { date, unit, utility, value: parseFloat(value) };

    const url = editingReading
      ? `/api/readings/${editingReading.id}`
      : "/api/readings";
    const method = editingReading ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!editingReading) {
      setValue("");
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">
        {editingReading ? "Ablesung bearbeiten" : "Neue Ablesung"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
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
            onChange={(e) => setUtility(e.target.value as Reading["utility"])}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {UTILITIES.map((u) => (
              <option key={u} value={u}>
                {UTILITY_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zählerstand</label>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder="z.B. 12345,67"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Speichern..." : editingReading ? "Aktualisieren" : "Ablesung hinzufügen"}
        </button>
        {editingReading && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
