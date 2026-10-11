import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attendanceSchema } from "@/lib/validation";
import { hasUserSubmittedSurvey } from "@/lib/surveys";

export async function POST(request: Request) {
  const parsed = attendanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid attendance request." }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ updated: parsed.data.registrationIds.length, demo: true });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const trustedRole = user.app_metadata?.role;
  if (!["staff", "admin"].includes(trustedRole)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  const rows = parsed.data.registrationIds.map((registrationId) => ({
    registration_id: registrationId, session_id: parsed.data.sessionId, status: parsed.data.status,
    check_in_at: parsed.data.status === "present" ? new Date().toISOString() : null, marked_by: user.id,
  }));
  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "registration_id,session_id" });
  if (error) return NextResponse.json({ error: "Attendance could not be updated." }, { status: 500 });

  // When marked present, only automatically issue certificates to attendees who have ALSO completed the survey
  if (parsed.data.status === "present" && parsed.data.registrationIds.length > 0) {
    const { data: existing } = await supabase
      .from("certificates")
      .select("registration_id")
      .eq("session_id", parsed.data.sessionId)
      .neq("status", "revoked");
    const existingIds = new Set((existing ?? []).map((item) => item.registration_id));

    const checkCandidates = parsed.data.registrationIds.filter((id) => !existingIds.has(id));
    const surveyCheckResults = await Promise.all(
      checkCandidates.map(async (id) => ({
        id,
        completed: await hasUserSubmittedSurvey(id, parsed.data.sessionId),
      }))
    );
    const eligibleToGenerate = surveyCheckResults
      .filter((r) => r.completed)
      .map((r) => r.id);

    if (eligibleToGenerate.length > 0) {
      const newCertRows = eligibleToGenerate.map((id) => ({
        registration_id: id,
        session_id: parsed.data.sessionId,
        generated_by: user.id,
        status: "issued",
        issued_at: new Date().toISOString(),
      }));
      await supabase.from("certificates").insert(newCertRows);
    }
  }

  await supabase.from("audit_logs").insert({ user_id: user.id, action: "attendance.bulk_update", entity_type: "session", entity_id: parsed.data.sessionId, metadata: { status: parsed.data.status, count: rows.length } });
  
  const { invalidateAdminCache } = await import("@/lib/admin-data");
  invalidateAdminCache();

  return NextResponse.json({ updated: rows.length });
}
