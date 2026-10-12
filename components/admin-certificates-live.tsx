import { getEventData } from "@/lib/admin-data";
import { getAllEligibilityRecords } from "@/lib/surveys";
import CertificateArtwork from "@/components/certificate-artwork";
import CertificateActions from "@/components/certificate-actions";
import SendCertificateButton from "@/components/send-certificate-button";
import CertificateEligibilityTable from "@/components/certificate-eligibility-table";
import { Download } from "lucide-react";

export default async function AdminCertificatesLive({
  searchParams,
}: {
  searchParams?: Promise<{ session?: string; view?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeSlug = params?.session ?? "all";
  const activeView = params?.view ?? "eligibility";

  const { sessions, registrations } = await getEventData();
  const eligibilityRecords = await getAllEligibilityRecords(activeSlug, { sessions, registrations });

  const isPresent = (person: (typeof registrations)[number], sessionId: string) =>
    person.attendance.some((item) => item.sessionId === sessionId && item.status === "present");

  const allIssued = registrations.flatMap((person) =>
    person.certificates
      .filter((certificate) => isPresent(person, certificate.sessionId))
      .map((certificate) => {
        const session = sessions.find((item) => item.id === certificate.sessionId);
        const sessionIndex = sessions.findIndex((item) => item.id === certificate.sessionId);
        return {
          person,
          certificate,
          session,
          sessionNumber: sessionIndex >= 0 ? `0${sessionIndex + 1}` : "01",
        };
      })
  );

  const filteredIssued =
    activeSlug === "all"
      ? allIssued
      : allIssued.filter((item) => item.session?.slug === activeSlug);

  const preview = filteredIssued[0] ?? allIssued[0];

  const totalEligible = eligibilityRecords.filter((r) => r.certificateEligible).length;
  const totalGenerated = eligibilityRecords.filter((r) => r.certificateGenerated).length;
  const pendingSurvey = eligibilityRecords.filter(
    (r) => r.attendanceStatus === "present" && !r.surveyCompleted
  ).length;

  return (
    <main className="admin-content">
      <div className="admin-title">
        <div>
          <span>ISSUANCE / CERTIFICATES &amp; ELIGIBILITY</span>
          <h1>Certificate management</h1>
        </div>
        <p>
          {totalEligible} eligible attendee{totalEligible === 1 ? "" : "s"} &bull; {totalGenerated} generated
        </p>
      </div>

      {/* Top summary cards */}
      <section className="stat-grid" style={{ marginBottom: "28px" }}>
        <article>
          <span>01</span>
          <strong>{totalEligible}</strong>
          <p>Total eligible attendees (Attended + Survey)</p>
        </article>
        <article>
          <span>02</span>
          <strong>{totalGenerated}</strong>
          <p>Certificates generated</p>
        </article>
        <article>
          <span>03</span>
          <strong>{pendingSurvey}</strong>
          <p>Present but pending survey</p>
        </article>
      </section>

      {/* Primary view switch tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--ink, #171814)",
          marginBottom: "20px",
          gap: "8px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          width: "100%",
        }}
      >
        <a
          href={`/admin/certificates?view=eligibility${activeSlug !== "all" ? `&session=${activeSlug}` : ""}`}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "13px",
            background: activeView === "eligibility" ? "var(--ink, #171814)" : "transparent",
            color: activeView === "eligibility" ? "#fff" : "var(--ink, #171814)",
            border: "1px solid var(--ink, #171814)",
            borderBottom: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Certificate Eligibility Matrix
        </a>
        <a
          href={`/admin/certificates?view=queue${activeSlug !== "all" ? `&session=${activeSlug}` : ""}`}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "13px",
            background: activeView === "queue" ? "var(--ink, #171814)" : "transparent",
            color: activeView === "queue" ? "#fff" : "var(--ink, #171814)",
            border: "1px solid var(--ink, #171814)",
            borderBottom: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Issued Certificates Queue ({filteredIssued.length})
        </a>
      </div>

      {/* Session filter tab bar */}
      <nav className="tab-bar" aria-label="Filter certificates by session">
        <a
          className={activeSlug === "all" ? "active" : ""}
          href={`/admin/certificates?view=${activeView}&session=all`}
        >
          All sessions
        </a>
        {sessions.map((session, index) => {
          return (
            <a
              className={activeSlug === session.slug ? "active" : ""}
              href={`/admin/certificates?view=${activeView}&session=${session.slug}`}
              key={session.id}
            >
              Session 0{index + 1}
            </a>
          );
        })}
      </nav>

      <CertificateActions
        sessions={sessions.map((item) => ({ id: item.id, title: item.title, slug: item.slug }))}
        activeSessionId={activeSlug}
      />

      {activeView === "eligibility" ? (
        <CertificateEligibilityTable
          records={eligibilityRecords}
          sessions={sessions.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
        />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "24px 0 16px",
              flexWrap: "wrap",
              gap: "12px",
              padding: "16px 20px",
              background: "#fff",
              border: "1px solid var(--line, #c9c7bd)",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--signal, #b74700)" }}>
                Rendered Certificate Preview
              </span>
              <h2 style={{ fontSize: "17px", margin: "4px 0 0" }}>
                {activeSlug === "session-2" ? "Session 02 Certificate" : "Session 01 Certificate"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a
                href="/sample-session1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="rendered-certificate-session1.pdf"
                className="button"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
              >
                <Download size={15} />
                Download Session 1 Sample PDF
              </a>
              <a
                href="/sample-session2.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="rendered-certificate-session2.pdf"
                className="button"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
              >
                <Download size={15} />
                Download Session 2 Sample PDF
              </a>
            </div>
          </div>

          <CertificateArtwork
            name={preview?.person.fullName ?? "Participant Name"}
            session={preview?.session?.title ?? (activeSlug === "session-2" ? sessions[1]?.title : sessions[0]?.title) ?? "Webinar Session"}
            id={preview?.certificate.number ?? (activeSlug === "session-2" ? "DDT-2026-SESSION2-SAMPLE" : "DDT-2026-SESSION1-SAMPLE")}
          />

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Certificate ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssued.map((item) => (
                  <tr key={item.certificate.number}>
                    <td>
                      <strong>{item.person.fullName}</strong>
                      <small>{item.person.email}</small>
                    </td>
                    <td>
                      <span
                        className="status"
                        style={{
                          background: item.sessionNumber === "01" ? "#e6f0e7" : "#fff1e6",
                          borderColor: item.sessionNumber === "01" ? "#78927e" : "#d88235",
                          color: item.sessionNumber === "01" ? "#244d2d" : "#8a3d07",
                          marginRight: "8px",
                          fontWeight: 700,
                        }}
                      >
                        Session {item.sessionNumber}
                      </span>
                      <span>{item.session?.title}</span>
                    </td>
                    <td>
                      <span className="status">{item.certificate.status}</span>
                    </td>
                    <td>
                      <code style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                        {item.certificate.number}
                      </code>
                    </td>
                    <td className="table-actions">
                      <a className="table-action" href={`/api/certificates/${item.certificate.number}`}>
                        Download
                      </a>
                      <SendCertificateButton certificateId={item.certificate.number} />
                    </td>
                  </tr>
                ))}
                {!filteredIssued.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        No issued certificates in this view. Check the Certificate Eligibility Matrix to see who meets all three criteria.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
