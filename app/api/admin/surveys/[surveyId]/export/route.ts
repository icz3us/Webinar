import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSurveyById, getSurveyResponses } from "@/lib/surveys";

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  if (Array.isArray(value)) {
    return `"${value.join("; ").replace(/"/g, '""')}"`;
  }
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await params;
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const trustedRole = user.app_metadata?.role;
    if (!["staff", "admin"].includes(trustedRole)) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }
  }

  const survey = await getSurveyById(surveyId);
  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const responses = await getSurveyResponses(surveyId);
  const questions = survey.questions ?? [];

  // Build CSV Header
  const headers = [
    "Response ID",
    "Submitted At",
    "Participant Name",
    "Participant Email",
    ...questions.map((q) => q.question),
  ];

  const rows = responses.map((r) => {
    const answerMap = new Map<string, any>();
    for (const a of r.answers) {
      answerMap.set(a.questionId, a.answer);
    }

    return [
      escapeCsvCell(r.id),
      escapeCsvCell(new Date(r.submittedAt).toLocaleString("en-PH")),
      escapeCsvCell(r.participantName ?? "Participant"),
      escapeCsvCell(r.participantEmail ?? ""),
      ...questions.map((q) => escapeCsvCell(answerMap.get(q.id) ?? "")),
    ].join(",");
  });

  const csvContent = [headers.map(escapeCsvCell).join(","), ...rows].join("\r\n");

  const sanitizedSlug = survey.publicSlug.replace(/[^a-z0-9-]/gi, "_");
  const filename = `survey-responses-${sanitizedSlug}.csv`;

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
