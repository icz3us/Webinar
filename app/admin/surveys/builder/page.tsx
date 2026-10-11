import { getSurveyById } from "@/lib/surveys";
import { getEventAndSessions } from "@/lib/admin-data";
import SurveyBuilderForm from "@/components/survey-builder-form";

export const dynamic = "force-dynamic";

export default async function AdminSurveyBuilderPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const surveyId = params?.id;

  const [{ sessions }, initialSurvey] = await Promise.all([
    getEventAndSessions(),
    surveyId ? getSurveyById(surveyId) : Promise.resolve(null),
  ]);

  return (
    <main className="admin-content">
      <div className="admin-title">
        <div>
          <span>SURVEY BUILDER / {initialSurvey ? "EDIT SURVEY" : "CREATE SURVEY"}</span>
          <h1>{initialSurvey ? "Edit Survey" : "Create New Survey"}</h1>
        </div>
        <a href="/admin/surveys" className="button">
          Back to surveys
        </a>
      </div>

      <SurveyBuilderForm
        initialSurvey={initialSurvey}
        sessions={sessions.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
      />
    </main>
  );
}
