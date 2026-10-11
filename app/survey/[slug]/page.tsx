import { notFound } from "next/navigation";
import { getSurveyBySlug, hasUserSubmittedSurvey } from "@/lib/surveys";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ParticipantSurvey from "@/components/participant-survey";

export const dynamic = "force-dynamic";

export default async function ParticipantSurveyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const survey = await getSurveyBySlug(slug);

  if (!survey) {
    notFound();
  }

  let userState = {
    authenticated: false,
    userEmail: "",
    fullName: "",
    registered: false,
    registeredForSession: false,
    attendanceStatus: "not_marked" as "present" | "absent" | "not_marked",
    alreadySubmitted: false,
    message: null as string | null,
  };

  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userState.authenticated = true;
      userState.userEmail = user.email ?? "";

      const adminClient = createAdminClient() ?? supabase;
      const { data: reg } = await adminClient
        .from("registrations")
        .select("id, full_name, email, registration_sessions(session_id), attendance(session_id, status)")
        .eq("user_id", user.id)
        .is("cancelled_at", null)
        .maybeSingle();

      if (reg) {
        userState.registered = true;
        userState.fullName = reg.full_name;

        const regSessionIds = new Set(
          (reg.registration_sessions ?? []).map((s: { session_id: string }) => s.session_id)
        );

        userState.registeredForSession = regSessionIds.has(survey.sessionId);

        if (!userState.registeredForSession) {
          userState.message = "You are not registered for this session.";
        } else {
          const att = (reg.attendance ?? []).find(
            (a: { session_id: string; status: string }) => a.session_id === survey.sessionId
          );
          userState.attendanceStatus = (att?.status as "present" | "absent") ?? "not_marked";

          const submitted = await hasUserSubmittedSurvey(reg.id, survey.id);
          userState.alreadySubmitted = submitted;
          if (submitted) {
            userState.message = "You have already completed this survey.";
          }
        }
      } else {
        userState.registered = false;
        userState.message = "You are not registered for this webinar.";
      }
    }
  }

  return <ParticipantSurvey survey={survey} initialUserState={userState} />;
}
