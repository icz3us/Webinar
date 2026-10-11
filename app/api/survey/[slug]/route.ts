import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSurveyBySlug, submitSurveyResponse, hasUserSubmittedSurvey } from "@/lib/surveys";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const survey = await getSurveyBySlug(slug);

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  if (survey.status !== "published") {
    return NextResponse.json(
      { error: "This survey is currently not available for responses." },
      { status: 403 }
    );
  }

  if (survey.closingAt && new Date(survey.closingAt) < new Date()) {
    return NextResponse.json(
      { error: "This survey has closed." },
      { status: 403 }
    );
  }

  // Check authenticated user
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      survey,
      userState: {
        authenticated: false,
        registered: false,
        attendanceStatus: "not_marked",
        alreadySubmitted: false,
      },
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({
      survey,
      userState: {
        authenticated: false,
        registered: false,
        attendanceStatus: "not_marked",
        alreadySubmitted: false,
      },
    });
  }

  const adminClient = createAdminClient() ?? supabase;

  // Find user's registration
  const { data: reg } = await adminClient
    .from("registrations")
    .select("id, full_name, email, registration_sessions(session_id), attendance(session_id, status)")
    .eq("user_id", user.id)
    .is("cancelled_at", null)
    .maybeSingle();

  if (!reg) {
    return NextResponse.json({
      survey,
      userState: {
        authenticated: true,
        userEmail: user.email,
        registered: false,
        registeredForSession: false,
        attendanceStatus: "not_marked",
        alreadySubmitted: false,
        message: "You are not registered for this webinar.",
      },
    });
  }

  const regSessionIds = new Set(
    (reg.registration_sessions ?? []).map((s: { session_id: string }) => s.session_id)
  );

  const isRegisteredForSession = regSessionIds.has(survey.sessionId);
  if (!isRegisteredForSession) {
    return NextResponse.json({
      survey,
      userState: {
        authenticated: true,
        userEmail: user.email,
        fullName: reg.full_name,
        registered: true,
        registeredForSession: false,
        attendanceStatus: "not_marked",
        alreadySubmitted: false,
        message: "You are not registered for this session.",
      },
    });
  }

  const attRecord = (reg.attendance ?? []).find(
    (a: { session_id: string; status: string }) => a.session_id === survey.sessionId
  );
  let attendanceStatus = attRecord ? attRecord.status : "not_marked";

  if (attendanceStatus !== "present") {
    const { data: directAtt } = await adminClient
      .from("attendance")
      .select("status")
      .eq("registration_id", reg.id)
      .eq("session_id", survey.sessionId)
      .maybeSingle();
    if (directAtt?.status) {
      attendanceStatus = directAtt.status;
    }
  }

  const isPresent = attendanceStatus === "present";
  const alreadySubmitted = await hasUserSubmittedSurvey(reg.id, survey.id);

  return NextResponse.json({
    survey,
    userState: {
      authenticated: true,
      userEmail: user.email,
      fullName: reg.full_name,
      registered: true,
      registeredForSession: true,
      attendanceStatus,
      canAccess: isPresent,
      alreadySubmitted,
      message: !isPresent
        ? attendanceStatus === "absent"
          ? "You are marked absent for this session. Survey access requires verified attendance."
          : "Attendance verification is required before taking this survey. Your attendance has not been verified yet."
        : alreadySubmitted
        ? "You have already completed this survey."
        : null,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const survey = await getSurveyBySlug(slug);

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  if (survey.status !== "published") {
    return NextResponse.json(
      { error: "This survey is currently closed or unpublished." },
      { status: 403 }
    );
  }

  if (survey.closingAt && new Date(survey.closingAt) < new Date()) {
    return NextResponse.json(
      { error: "This survey has closed." },
      { status: 403 }
    );
  }

  // Authenticate user server-side
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to submit the survey." },
      { status: 401 }
    );
  }

  const adminClient = createAdminClient() ?? supabase;

  // Retrieve registration
  const { data: reg, error: regError } = await adminClient
    .from("registrations")
    .select("id, full_name, email, registration_sessions(session_id), attendance(session_id, status)")
    .eq("user_id", user.id)
    .is("cancelled_at", null)
    .maybeSingle();

  if (regError || !reg) {
    return NextResponse.json(
      { error: "No active registration found for your account." },
      { status: 403 }
    );
  }

  // Check session registration
  const regSessionIds = new Set(
    (reg.registration_sessions ?? []).map((s: { session_id: string }) => s.session_id)
  );

  if (!regSessionIds.has(survey.sessionId)) {
    return NextResponse.json(
      { error: "You are not registered for this session." },
      { status: 403 }
    );
  }

  // Check attendance: MUST BE PRESENT
  const attRecord = (reg.attendance ?? []).find(
    (a: { session_id: string; status: string }) => a.session_id === survey.sessionId
  );
  let attendanceStatus = attRecord ? attRecord.status : "not_marked";

  if (attendanceStatus !== "present") {
    const { data: directAtt } = await adminClient
      .from("attendance")
      .select("status")
      .eq("registration_id", reg.id)
      .eq("session_id", survey.sessionId)
      .maybeSingle();
    if (directAtt?.status) {
      attendanceStatus = directAtt.status;
    }
  }

  if (attendanceStatus !== "present") {
    return NextResponse.json(
      {
        error:
          attendanceStatus === "absent"
            ? "You are marked absent for this session. Survey submission requires verified attendance."
            : "Attendance verification is required before taking this survey. Please wait until your attendance is verified present.",
      },
      { status: 403 }
    );
  }

  // Check duplicate submission
  const alreadyDone = await hasUserSubmittedSurvey(reg.id, survey.id);
  if (alreadyDone) {
    return NextResponse.json(
      { error: "You have already completed this survey." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const answersInput: Record<string, any> = body?.answers ?? {};

  // Validate required questions
  const questions = survey.questions ?? [];
  const processedAnswers: { questionId: string; answer: string | number | string[] }[] = [];

  for (const q of questions) {
    const val = answersInput[q.id];
    const isEmpty =
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0);

    if (q.required && isEmpty) {
      return NextResponse.json(
        { error: `Please answer required question: "${q.question}"` },
        { status: 400 }
      );
    }

    if (!isEmpty) {
      processedAnswers.push({
        questionId: q.id,
        answer: val,
      });
    }
  }

  const result = await submitSurveyResponse({
    surveyId: survey.id,
    sessionId: survey.sessionId,
    eventId: survey.eventId,
    registrationId: reg.id,
    userId: user.id,
    participantName: reg.full_name,
    participantEmail: reg.email,
    answers: processedAnswers,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Submission failed." }, { status: 400 });
  }

  const { invalidateAdminCache } = await import("@/lib/admin-data");
  invalidateAdminCache();

  const isPresent = attendanceStatus === "present";

  return NextResponse.json({
    success: true,
    responseId: result.responseId,
    sessionTitle: survey.session?.title ?? survey.title,
    attendanceConfirmed: isPresent,
    surveyCompleted: true,
    certificateEligible: isPresent,
    message: isPresent
      ? "Survey submitted successfully! Your certificate is now eligible and ready."
      : "Survey submitted successfully! Attendance is pending verification.",
  });
}
