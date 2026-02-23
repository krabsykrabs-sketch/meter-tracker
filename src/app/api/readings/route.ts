import { NextRequest, NextResponse } from "next/server";
import { getAllReadings, getReadingsFiltered, createReading } from "@/lib/db";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const unit = searchParams.get("unit");
  const utility = searchParams.get("utility");

  const readings =
    unit || utility
      ? getReadingsFiltered(unit ? Number(unit) : undefined, utility ?? undefined)
      : getAllReadings();

  return NextResponse.json(readings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, unit, utility, value } = body;

  if (!date || !unit || !utility || value == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (![1, 2].includes(unit)) {
    return NextResponse.json({ error: "Unit must be 1 or 2" }, { status: 400 });
  }

  if (!["gas", "water", "electricity"].includes(utility)) {
    return NextResponse.json({ error: "Invalid utility type" }, { status: 400 });
  }

  const reading = createReading({ date, unit, utility, value: Number(value) });
  return NextResponse.json(reading, { status: 201 });
}
