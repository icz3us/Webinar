import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSurveyById, saveSurvey, deleteSurvey, getSurveyResponses } from "@/lib/surveys";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(2, "Question text is required."),
  description: z.string().nullable().optional(),
  questionType: z.enum([
    "short_text",
    "long_text",
    "multiple_choice",
    "checkbox",
    "rating",
    "yes_no",
  ]),
  required: z.boolean().default(true),
  options: z.array(z.string()).default([]),
  position: z.number().int().default(1),
});

const surveyUpdateSchema = z.object({
  sessionId: z.string().min(1, "Session is required."),
  title: z.string().trim().min(3, "Survey title must be at least 3 characters."),
  description: z.string().trim().default(""),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  publicSlug: z
    .string()
    .trim()
    .min(3, "Public slug must be at least 3 characters.")
    .regex(/^[a-z0-9-]+$/, "Public slug can only contain lowercase letters, numbers, and hyphens."),
  closingAt: z.string().nullable().optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required."),
});

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
  return NextResponse.json({ survey, responses, responseCount: responses.length });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await params;
  const supabase = await createClient();
  let userId = "admin";
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const trustedRole = user.app_metadata?.role;
    if (!["staff", "admin"].includes(trustedRole)) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }
    userId = user.id;
  }

  const body = await request.json().catch(() => null);
  const parsed = surveyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await getSurveyById(surveyId);
  if (!existing) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const updated = await saveSurvey(
    {
      id: surveyId,
      ...parsed.data,
    },
    userId
  );

  return NextResponse.json({ survey: updated });
}

export async function DELETE(
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

  const existing = await getSurveyById(surveyId);
  if (!existing) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  await deleteSurvey(surveyId);
  return NextResponse.json({ success: true });
}
