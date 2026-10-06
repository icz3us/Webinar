import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRegistration = {
  id: string; fullName: string; email: string; affiliation: string; category: string; createdAt: string;
  sessions: { id: string; title: string; slug: string }[]; attendance: { sessionId: string; status: string }[];
  certificates: { sessionId: string; number: string; status: string }[];
};

export async function getEventData() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("slug", "deepfakes-digital-trust-2026").single();
  if (eventError) throw new Error("Database setup is incomplete. Apply supabase/migrations/001_initial.sql and supabase/seed.sql.");
  const [{ data: sessions, error: sessionsError }, { data: registrations, error: registrationsError }] = await Promise.all([
    supabase.from("sessions").select("*").eq("event_id", event.id).order("start_time"),
    supabase.from("registrations").select("*, registration_sessions(session:sessions(id,title,slug)), attendance(session_id,status), certificates(session_id,certificate_number,status)").eq("event_id", event.id).is("cancelled_at", null).order("created_at", { ascending: false }),
  ]);
  if (sessionsError || registrationsError) throw new Error("Event records could not be loaded.");
  const people: AdminRegistration[] = (registrations ?? []).map((row) => ({
    id: row.id, fullName: row.full_name, email: row.email, affiliation: row.affiliation,
    category: row.participant_category, createdAt: row.created_at,
    sessions: (row.registration_sessions ?? []).flatMap((item: { session: { id:string;title:string;slug:string } | { id:string;title:string;slug:string }[] | null }) => item.session ? (Array.isArray(item.session) ? item.session : [item.session]) : []),
    attendance: (row.attendance ?? []).map((item: {session_id:string;status:string}) => ({ sessionId:item.session_id,status:item.status })),
    certificates: (row.certificates ?? []).map((item: {session_id:string;certificate_number:string;status:string}) => ({ sessionId:item.session_id,number:item.certificate_number,status:item.status })),
  }));
  return { event, sessions: sessions ?? [], registrations: people };
}

