import { createClient } from "@/lib/supabase/server";
import { EVENT } from "@/lib/event";
import { getSurveys, getCompletedSurveySessionIds } from "@/lib/surveys";
import { CheckCircle2, AlertCircle, FileBadge, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type SessionInfo = { id: string; title: string; slug: string };
type AttendanceRecord = { session_id: string; status: string };
type CertificateRecord = {
  session_id: string;
  certificate_number: string;
  status: string;
  issued_at: string | null;
};

type RegistrationRecord = {
  id: string;
  full_name: string;
  email: string;
  affiliation: string;
  participant_category: string;
  created_at: string;
  registration_sessions?: { session: SessionInfo | SessionInfo[] | null }[];
  attendance?: AttendanceRecord[];
  certificates?: CertificateRecord[];
};

export default async function MyRegistration() {
  const supabase = await createClient();
  let registration: RegistrationRecord | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("registrations")
        .select(`
          id, full_name, email, affiliation, participant_category, created_at,
          registration_sessions(session:sessions(id, title, slug)),
          attendance(session_id, status),
          certificates(session_id, certificate_number, status, issued_at)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      registration = data as RegistrationRecord | null;
    }
  }

  const surveys = await getSurveys();
  const completedSurveySessions = registration
    ? await getCompletedSurveySessionIds(registration.id)
    : new Set<string>();

  const sessions: SessionInfo[] = (registration?.registration_sessions ?? []).flatMap(
    (item) =>
      item.session
        ? Array.isArray(item.session)
          ? item.session
          : [item.session]
        : []
  );

  const attendanceMap = new Map(
    (registration?.attendance ?? []).map((att) => [att.session_id, att.status])
  );

  const certificateMap = new Map(
    (registration?.certificates ?? []).map((cert) => [cert.session_id, cert])
  );

  return (
    <main className="standalone">
      <section className="receipt wide">
        <span className="section-index">PARTICIPANT / RECORD</span>
        <h1>My Registration</h1>

        {registration ? (
          <>
            <dl className="receipt-grid">
              <div>
                <dt>Participant</dt>
                <dd>{registration.full_name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{registration.email}</dd>
              </div>
              <div>
                <dt>Affiliation</dt>
                <dd>{registration.affiliation}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{registration.participant_category.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Event date</dt>
                <dd>{EVENT.date}</dd>
              </div>
            </dl>

            <div style={{ marginTop: "32px" }}>
              <span className="section-index">SESSION STATUS &amp; E-CERTIFICATES</span>
              <h2 style={{ fontSize: "24px", margin: "8px 0 16px" }}>Session Status &amp; Certificates</h2>
              <p style={{ color: "var(--muted, #676860)", margin: "0 0 20px", fontSize: "14px", lineHeight: "1.5" }}>
                Certificates require three verified criteria for each session: registration, verified present attendance,
                and completion of the session feedback survey.
              </p>

              <div className="session-summary" style={{ gridTemplateColumns: "1fr", gap: "20px" }}>
                {sessions.map((session, index) => {
                  const status = attendanceMap.get(session.id);
                  const isPresent = status === "present";
                  const isAbsent = status === "absent";
                  const surveyDone = completedSurveySessions.has(session.id);
                  const matchingSurvey = surveys.find((s) => s.sessionId === session.id);
                  const cert = isPresent && surveyDone ? certificateMap.get(session.id) : null;

                  const isEligible = isPresent && surveyDone;

                  return (
                    <article
                      key={session.id}
                      style={{
                        padding: "24px",
                        border: "1px solid var(--line, #ddd)",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, fontSize: "16px" }}>Session 0{index + 1}</span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "4px 10px",
                            border: "1px solid",
                            borderColor: cert
                              ? "#78927e"
                              : isEligible
                              ? "#78927e"
                              : "#c5a458",
                            background: cert
                              ? "#e6f0e7"
                              : isEligible
                              ? "#e6f0e7"
                              : "#fff8e6",
                            color: cert || isEligible ? "#2d6139" : "#7d5b12",
                          }}
                        >
                          {cert
                            ? "Certificate Available"
                            : isEligible
                            ? "Certificate Eligible"
                            : "Certificate Pending"}
                        </span>
                      </div>

                      <h3 style={{ margin: "0", fontSize: "20px", lineHeight: "1.3" }}>{session.title}</h3>

                      {/* 3 Verification Checkpoints */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "12px",
                          background: "#f8f6ef",
                          padding: "16px",
                          border: "1px solid #e2e0d8",
                        }}
                      >
                        {/* Check 1: Registration */}
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--muted, #676860)", display: "block" }}>
                            REGISTRATION
                          </span>
                          <strong style={{ color: "var(--green, #426b4c)", fontSize: "14px" }}>
                            ✓ Registered
                          </strong>
                        </div>

                        {/* Check 2: Attendance */}
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--muted, #676860)", display: "block" }}>
                            ATTENDANCE
                          </span>
                          <strong
                            style={{
                              color: isPresent
                                ? "var(--green, #426b4c)"
                                : isAbsent
                                ? "#a52b18"
                                : "var(--muted, #676860)",
                              fontSize: "14px",
                            }}
                          >
                            {isPresent
                              ? "✓ Present"
                              : isAbsent
                              ? "✗ Absent"
                              : "Pending check-in"}
                          </strong>
                        </div>

                        {/* Check 3: Survey */}
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--muted, #676860)", display: "block" }}>
                            SURVEY
                          </span>
                          <strong
                            style={{
                              color: surveyDone ? "var(--green, #426b4c)" : "var(--signal, #d64a24)",
                              fontSize: "14px",
                            }}
                          >
                            {surveyDone ? "✓ Completed" : "Not completed"}
                          </strong>
                        </div>
                      </div>

                      {/* Certificate or Call to Action */}
                      {cert ? (
                        <div
                          style={{
                            padding: "16px",
                            background: "#f8f6ef",
                            border: "1px solid var(--line, #ddd)",
                            borderLeft: "4px solid var(--signal, #d64a24)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "11px", color: "var(--muted, #666)", display: "block" }}>
                              CERTIFICATE ID
                            </span>
                            <strong style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "14px", overflowWrap: "anywhere", wordBreak: "break-all" }}>
                              {cert.certificate_number}
                            </strong>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <a
                              className="button button-primary"
                              href={`/api/certificates/${cert.certificate_number}`}
                              style={{ padding: "8px 14px", fontSize: "13px", minHeight: "44px", display: "inline-flex", alignItems: "center" }}
                            >
                              Download PDF
                            </a>
                            <a
                              className="button"
                              href={`/verify/${cert.certificate_number}`}
                              style={{ padding: "8px 14px", fontSize: "13px", minHeight: "44px", display: "inline-flex", alignItems: "center" }}
                            >
                              Verify
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #666)", overflowWrap: "anywhere" }}>
                            {!isPresent
                              ? isAbsent
                                ? "Marked absent. Verified attendance is required to take the feedback survey."
                                : "Attendance check-in required. Survey unlocks once you are marked present."
                              : !surveyDone
                              ? "Complete survey to unlock your certificate."
                              : "Requirements satisfied. Generating certificate..."}
                          </p>

                          {!surveyDone && matchingSurvey && (
                            <a
                              href={`/survey/${matchingSurvey.publicSlug}`}
                              className={`button ${isPresent ? "button-primary" : ""}`}
                              style={{ padding: "8px 16px", fontSize: "13px", minHeight: "44px", display: "inline-flex", alignItems: "center" }}
                            >
                              {isPresent ? "Complete Survey" : "Check Survey"} <ArrowRight size={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>No persistent registration found</h2>
            <p>Connect Supabase and sign in, or complete the registration from the event page.</p>
          </div>
        )}

        <div style={{ marginTop: "32px", display: "flex", gap: "10px" }}>
          <a className="button" href="/">
            Back to event page
          </a>
        </div>
      </section>
    </main>
  );
}
