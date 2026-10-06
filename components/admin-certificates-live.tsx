import { getEventData } from "@/lib/admin-data";
import CertificateArtwork from "@/components/certificate-artwork";
import CertificateActions from "@/components/certificate-actions";
import SendCertificateButton from "@/components/send-certificate-button";

export default async function AdminCertificatesLive({
  searchParams,
}: {
  searchParams?: Promise<{ session?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeSlug = params?.session ?? "all";

  const { sessions, registrations } = await getEventData();

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

  return (
    <main className="admin-content">
      <div className="admin-title">
        <div>
          <span>ISSUANCE / LIVE CERTIFICATES</span>
          <h1>Certificate queue</h1>
        </div>
        <p>
          {filteredIssued.length} certificate{filteredIssued.length === 1 ? "" : "s"} ready
        </p>
      </div>

      <nav className="tab-bar" aria-label="Filter certificates by session">
        <a className={activeSlug === "all" ? "active" : ""} href="/admin/certificates">
          All sessions ({allIssued.length})
        </a>
        {sessions.map((session, index) => {
          const count = allIssued.filter((item) => item.session?.id === session.id).length;
          return (
            <a
              className={activeSlug === session.slug ? "active" : ""}
              href={`/admin/certificates?session=${session.slug}`}
              key={session.id}
            >
              Session 0{index + 1} ({count})
            </a>
          );
        })}
      </nav>

      <CertificateActions
        sessions={sessions.map((item) => ({ id: item.id, title: item.title, slug: item.slug }))}
        activeSessionId={activeSlug}
      />

      <CertificateArtwork
        name={preview?.person.fullName ?? "Participant Name"}
        session={preview?.session?.title ?? sessions[0]?.title ?? "Webinar Session"}
        id={preview?.certificate.number ?? "DDT-PREVIEW"}
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
                    No certificates for present participants in this view. Mark participants present in Attendance, then generate certificates.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
