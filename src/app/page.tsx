"use client";

import { useCallback, useEffect, useState } from "react";
import ReadingForm from "@/components/ReadingForm";
import ConsumptionChart from "@/components/ConsumptionChart";
import YearlyConsumption from "@/components/YearlyConsumption";
import ReadingsTable from "@/components/ReadingsTable";
import Filters from "@/components/Filters";
import { Reading } from "@/lib/types";

export default function Home() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [filterUnit, setFilterUnit] = useState("");
  const [filterUtility, setFilterUtility] = useState("gas");
  const [editingReading, setEditingReading] = useState<Reading | null>(null);

  const fetchReadings = useCallback(async () => {
    const res = await fetch("/api/readings");
    const data = await res.json();
    setReadings(data);
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  async function handleDelete(id: number) {
    await fetch(`/api/readings/${id}`, { method: "DELETE" });
    fetchReadings();
  }

  function handleEdit(reading: Reading) {
    setEditingReading(reading);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSaved() {
    setEditingReading(null);
    fetchReadings();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">LMS 290 – Verbrauch</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gas-, Wasser- und Stromverbrauch
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <ReadingForm
          key={editingReading?.id ?? "new"}
          onSaved={handleSaved}
          editingReading={editingReading}
          onCancelEdit={() => setEditingReading(null)}
        />

        <Filters
          unit={filterUnit}
          utility={filterUtility}
          onUnitChange={setFilterUnit}
          onUtilityChange={setFilterUtility}
        />

        <ConsumptionChart
          readings={readings}
          filterUnit={filterUnit}
          filterUtility={filterUtility}
        />

        <YearlyConsumption
          readings={readings}
          filterUnit={filterUnit}
          filterUtility={filterUtility}
        />

        <ReadingsTable
          readings={readings}
          filterUnit={filterUnit}
          filterUtility={filterUtility}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
