import { notFound } from "next/navigation";
import { getSurveyById, getSurveyResponses } from "@/lib/surveys";
import { getEventData } from "@/lib/admin-data";
import AdminSurveyAnalytics from "@/components/admin-survey-analytics";

export const dynamic = "force-dynamic";

export default async function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const survey = await getSurveyById(surveyId);

  if (!survey) {
    notFound();
  }

  const [{ registrations }, responses] = await Promise.all([
    getEventData(),
    getSurveyResponses(survey.id),
  ]);

  const targetSessionId = survey.sessionId;
  const totalRegistered = registrations.filter((r) =>
    r.sessions.some((s) => s.id === targetSessionId)
  ).length;

  const totalPresent = registrations.filter((r) =>
    r.attendance.some((a) => a.sessionId === targetSessionId && a.status === "present")
  ).length;

  return (
    <AdminSurveyAnalytics
      survey={survey}
      responses={responses}
      totalRegistered={totalRegistered}
      totalPresent={totalPresent}
    />
  );
}
