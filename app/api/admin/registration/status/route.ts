import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRegistrationStatus, setRegistrationStatus } from "@/lib/registration-status";

export async function GET() {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const trustedRole = user.app_metadata?.role;
    if (!["staff", "admin"].includes(trustedRole)) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }
  }

  const status = await getRegistrationStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const trustedRole = user.app_metadata?.role;
    if (!["staff", "admin"].includes(trustedRole)) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.isOpen !== "boolean") {
    return NextResponse.json({ error: "Invalid status value. Boolean expected." }, { status: 400 });
  }

  await setRegistrationStatus(body.isOpen);
  const updated = await getRegistrationStatus();
  return NextResponse.json(updated);
}
