import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registrationSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email";
import { checkRegistrationRateLimit } from "@/lib/rate-limit";

import { getPublishedSurveysSummary, getCompletedSurveySessionIds } from "@/lib/surveys";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ registration: null, demo: true });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const [regResult, publishedSurveys] = await Promise.all([
    supabase
      .from("registrations")
      .select("*, registration_sessions(session_id, sessions(*)), attendance(session_id, status), certificates(session_id, certificate_number, status, issued_at)")
      .eq("user_id", user.id)
      .maybeSingle(),
    getPublishedSurveysSummary(),
  ]);

  if (regResult.error) {
    return NextResponse.json({ error: "We could not load your registration." }, { status: 500 });
  }

  const completedSurveySessions = regResult.data?.id
    ? await getCompletedSurveySessionIds(regResult.data.id)
    : new Set<string>();

  return NextResponse.json({
    registration: regResult.data,
    surveys: publishedSurveys,
    completedSurveySessionIds: Array.from(completedSurveySessions),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Registration is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Your Google session expired. Please sign in again." }, { status: 401 });
  const rateLimit = await checkRegistrationRateLimit(request, user.id);
  if (!rateLimit.allowed) return NextResponse.json({ error: rateLimit.error }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please correct the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (user.email.toLowerCase() !== parsed.data.email.toLowerCase()) return NextResponse.json({ error: "The email must match your verified Google account." }, { status: 403 });

  const { data: event } = await supabase.from("events").select("id").eq("slug", "deepfakes-digital-trust-2026").single();
  if (!event) return NextResponse.json({ error: "Registration is not configured yet." }, { status: 503 });
  const { data: existing } = await supabase.from("registrations").select("id").eq("event_id", event.id).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "You are already registered for this event.", registrationId: existing.id }, { status: 409 });

  const { data: registration, error } = await supabase.from("registrations").insert({
    event_id: event.id, user_id: user.id, email: user.email, full_name: parsed.data.fullName,
    affiliation: parsed.data.affiliation, participant_category: parsed.data.participantCategory,
    other_category: parsed.data.participantCategory === "other" ? parsed.data.otherCategory : null,
    privacy_consent: true, privacy_consent_at: new Date().toISOString(),
  }).select("id").single();
  if (error || !registration) return NextResponse.json({ error: error?.code === "23505" ? "You are already registered for this event." : "We could not save your registration." }, { status: error?.code === "23505" ? 409 : 500 });

  const { data: sessions } = await supabase.from("sessions").select("id, slug").eq("event_id", event.id).in("slug", parsed.data.sessions);
  if (!sessions || sessions.length !== parsed.data.sessions.length) return NextResponse.json({ error: "One of the selected sessions is unavailable." }, { status: 409 });
  const { error: linkError } = await supabase.from("registration_sessions").insert(sessions.map((session) => ({ registration_id: registration.id, session_id: session.id })));
  if (linkError) {
    await supabase.from("registrations").delete().eq("id", registration.id);
    return NextResponse.json({ error: "We could not save your session choices." }, { status: 500 });
  }

  const { EVENT } = await import("@/lib/event");
  const email = await sendEmail({
    to: user.email,
    subject: "Registration recorded: Deepfakes and Digital Trust",
    html: `<p>Hello ${escapeHtml(parsed.data.fullName)},</p><p>Your registration for Deepfakes and Digital Trust on ${escapeHtml(EVENT.date)} has been recorded.</p><p>Selected sessions: ${parsed.data.sessions.map(escapeHtml).join(", ")}.</p>`,
  });

  const { invalidateAdminCache } = await import("@/lib/admin-data");
  invalidateAdminCache();

  return NextResponse.json({ registrationId: registration.id, emailDelivered: email.delivered }, { status: 201 });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]!);
}
