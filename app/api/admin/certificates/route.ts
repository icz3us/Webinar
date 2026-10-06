import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { sessionId } = await request.json().catch(() => ({}));
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ generated: 2, demo: true });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const trustedRole = user.app_metadata?.role;
  if (!["staff", "admin"].includes(trustedRole)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let attQuery = supabase.from("attendance").select("registration_id, session_id").eq("status", "present");
  let certQuery = supabase.from("certificates").select("registration_id, session_id").neq("status", "revoked");

  if (sessionId && sessionId !== "all") {
    attQuery = attQuery.eq("session_id", sessionId);
    certQuery = certQuery.eq("session_id", sessionId);
  }

  const [{ data: eligible, error }, { data: existing }] = await Promise.all([
    attQuery,
    certQuery,
  ]);

  if (error) return NextResponse.json({ error: "Certificate eligibility could not be checked." }, { status: 500 });

  const existingSet = new Set((existing ?? []).map((item) => `${item.registration_id}:${item.session_id}`));
  const rows = (eligible ?? [])
    .filter((row) => !existingSet.has(`${row.registration_id}:${row.session_id}`))
    .map((row) => ({
      registration_id: row.registration_id,
      session_id: row.session_id,
      generated_by: user.id,
      status: "issued",
      issued_at: new Date().toISOString(),
    }));

  if (rows.length) {
    const { error: insertError } = await supabase.from("certificates").insert(rows);
    if (insertError) return NextResponse.json({ error: "Certificates could not be generated." }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "certificates.bulk_generate",
    entity_type: "session",
    entity_id: sessionId ?? "all",
    metadata: { count: rows.length },
  });

  return NextResponse.json({ generated: rows.length });
}
