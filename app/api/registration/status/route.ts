import { NextResponse } from "next/server";
import { getRegistrationStatus } from "@/lib/registration-status";

export async function GET() {
  const status = await getRegistrationStatus();
  return NextResponse.json(status);
}
