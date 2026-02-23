import { NextRequest, NextResponse } from "next/server";
import { updateReading, deleteReading } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { date, unit, utility, value } = body;

  if (!date || !unit || !utility || value == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const reading = updateReading(Number(id), { date, unit, utility, value: Number(value) });
  if (!reading) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  return NextResponse.json(reading);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteReading(Number(id));

  if (!deleted) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
