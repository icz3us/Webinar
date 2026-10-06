import { createClient } from "@/lib/supabase/server";
import { EVENT } from "@/lib/event";

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
              <span className="section-index">SESSION STATUS & E-CERTIFICATES</span>
              <h2 style={{ fontSize: "24px", margin: "8px 0 16px" }}>Session e-Certificates</h2>
              <div className="session-summary" style={{ gridTemplateColumns: "1fr" }}>
                {sessions.map((session, index) => {
                  const status = attendanceMap.get(session.id);
                  const isPresent = status === "present";
                  const cert = isPresent ? certificateMap.get(session.id) : null;

                  return (
                    <article
                      key={session.id}
                      style={{
                        padding: "20px",
                        border: "1px solid var(--line, #ddd)",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <b>Session 0{index + 1}</b>
                        <span
                          style={{
                            fontSize: "12px",
                            padding: "3px 8px",
                            border: "1px solid",
                            borderColor: isPresent ? "#78927e" : "#c5a458",
                            background: isPresent ? "#e6f0e7" : "#fff8e6",
                            color: isPresent ? "#2d6139" : "#7d5b12",
                          }}
                        >
                          {isPresent ? "Attendance Verified (Present)" : "Attendance Pending"}
                        </span>
                      </div>
                      <h3 style={{ margin: "4px 0" }}>{session.title}</h3>

                      {isPresent && cert ? (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "16px",
                            background: "#f8f6ef",
                            border: "1px solid var(--line, #ddd)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "11px", color: "var(--muted, #666)", display: "block" }}>
                              CERTIFICATE ID
                            </span>
                            <strong style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                              {cert.certificate_number}
                            </strong>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <a
                              className="button button-primary"
                              href={`/api/certificates/${cert.certificate_number}`}
                              style={{ padding: "8px 14px", fontSize: "13px" }}
                            >
                              Download PDF
                            </a>
                            <a
                              className="button"
                              href={`/verify/${cert.certificate_number}`}
                              style={{ padding: "8px 14px", fontSize: "13px" }}
                            >
                              Verify
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--muted, #666)" }}>
                          {isPresent
                            ? "Attendance verified. The e-certificate has not been generated by the organizer yet."
                            : "Attendance required. E-certificates are only issued to participants verified present in this session."}
                        </p>
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
