import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { duplicateSurvey } from "@/lib/surveys";

export async function POST(
  _: Request,
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

  const duplicated = await duplicateSurvey(surveyId, userId);
  if (!duplicated) {
    return NextResponse.json({ error: "Survey could not be duplicated." }, { status: 404 });
  }

  return NextResponse.json({ survey: duplicated }, { status: 201 });
}
