/**
 * Facility Residents API
 *
 * GET /api/facility/residents - Get all residents for the facility
 * POST /api/facility/residents - Add a new resident
 * DELETE /api/facility/residents?id={id} - Remove a resident
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFacilityResidents, addResident, removeResident } from "@/lib/actions/facility";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const residents = await getFacilityResidents();
  return NextResponse.json({ residents });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await addResident(body);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const residentId = searchParams.get("id");

  if (!residentId) {
    return NextResponse.json(
      { success: false, error: "Resident ID required" },
      { status: 400 }
    );
  }

  const result = await removeResident(residentId);

  if (result.success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }
}
