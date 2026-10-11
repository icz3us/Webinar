import { getSurveys, getSurveyResponseCounts } from "@/lib/surveys";
import { getEventAndSessions } from "@/lib/admin-data";
import AdminSurveysLive from "@/components/admin-surveys-live";

export const dynamic = "force-dynamic";

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams?: Promise<{ session?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeSlug = params?.session ?? "all";

  const [{ sessions }, surveys, responseCounts] = await Promise.all([
    getEventAndSessions(),
    getSurveys(),
    getSurveyResponseCounts(),
  ]);

  const enhanced = surveys.map((s) => ({
    ...s,
    responseCount: responseCounts[s.id] || 0,
  }));

  return (
    <AdminSurveysLive
      surveys={enhanced}
      sessions={sessions.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
      activeSessionSlug={activeSlug}
    />
  );
}
