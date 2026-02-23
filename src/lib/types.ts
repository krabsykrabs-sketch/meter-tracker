export interface Reading {
  id: number;
  date: string;
  unit: number;
  utility: "gas" | "water" | "electricity";
  value: number;
  created_at: string;
}

export const UNITS = [
  { value: 1, label: "WG Oben" },
  { value: 2, label: "EG Wohnung" },
] as const;

export const UTILITIES = ["gas", "water", "electricity"] as const;

export const UTILITY_LABELS: Record<string, string> = {
  gas: "Gas",
  water: "Wasser",
  electricity: "Strom",
};

export const UNIT_LABELS: Record<number, string> = {
  1: "WG Oben",
  2: "EG Wohnung",
};

export const UTILITY_UNITS: Record<string, string> = {
  gas: "m³",
  water: "m³",
  electricity: "kWh",
};
