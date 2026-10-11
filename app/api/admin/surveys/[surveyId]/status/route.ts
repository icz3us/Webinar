import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateSurveyStatus, SurveyStatus } from "@/lib/surveys";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["draft", "published", "closed"]),
});

export async function PATCH(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await updateSurveyStatus(surveyId, parsed.data.status as SurveyStatus);
  if (!updated) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  return NextResponse.json({ survey: updated });
}
