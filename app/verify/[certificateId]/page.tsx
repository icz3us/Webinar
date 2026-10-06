import { notFound } from "next/navigation";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function VerifyCertificate({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const decodedId = decodeURIComponent(certificateId).trim();

  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) {
    return (
      <Verification
        id={decodedId}
        name="Demo Participant"
        session="Demonstration certificate"
        issued="Demo mode"
      />
    );
  }

  const { data } = await supabase
    .from("certificates")
    .select(
      "certificate_number, issued_at, status, registration_id, session_id, registration:registrations(full_name), session:sessions(title), event:sessions(events(title,event_date))"
    )
    .ilike("certificate_number", decodedId)
    .eq("status", "issued")
    .maybeSingle();

  if (!data) {
    return <UnverifiedCertificate id={decodedId} />;
  }

  const registration = Array.isArray(data.registration)
    ? data.registration[0]
    : data.registration;
  const session = Array.isArray(data.session)
    ? data.session[0]
    : data.session;

  return (
    <Verification
      id={data.certificate_number}
      name={registration?.full_name ?? "Participant"}
      session={session?.title ?? "Session"}
      issued={
        data.issued_at
          ? new Date(data.issued_at).toLocaleDateString("en-PH", {
              dateStyle: "long",
            })
          : "Not issued"
      }
    />
  );
}

function Verification({
  id,
  name,
  session,
  issued,
}: {
  id: string;
  name: string;
  session: string;
  issued: string;
}) {
  return (
    <main className="standalone">
      <section className="receipt verify-box">
        <BadgeCheck className="verified-icon" aria-hidden="true" />
        <span className="section-index">AUTHENTIC / RECORD FOUND</span>
        <h1>Certificate Verified</h1>
        <dl className="receipt-grid">
          <div>
            <dt>Certificate ID</dt>
            <dd>{id}</dd>
          </div>
          <div>
            <dt>Participant</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>{session}</dd>
          </div>
          <div>
            <dt>Event</dt>
            <dd>Deepfakes and Digital Trust</dd>
          </div>
          <div>
            <dt>Date issued</dt>
            <dd>{issued}</dd>
          </div>
        </dl>
        <a className="button" href="/verify">
          Verify another certificate
        </a>
      </section>
    </main>
  );
}

function UnverifiedCertificate({ id }: { id: string }) {
  return (
    <main className="standalone">
      <section className="receipt verify-box">
        <ShieldAlert className="verified-icon" style={{ color: "#d9381e" }} aria-hidden="true" />
        <span className="section-index" style={{ color: "#d9381e" }}>RECORD NOT FOUND / UNVERIFIED</span>
        <h1>Certificate Not Verified</h1>
        <p>
          No issued certificate was found matching the identifier:
        </p>
        <p style={{ marginTop: 12 }}>
          <code style={{ fontSize: 16, fontWeight: 700, background: "rgba(0,0,0,0.06)", padding: "4px 8px" }}>
            {id}
          </code>
        </p>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
          Please double check the certificate ID printed on your PDF document. Certificate IDs are case-insensitive.
        </p>
        <div style={{ marginTop: 32 }}>
          <a className="button" href="/verify">
            Try another certificate ID
          </a>
        </div>
      </section>
    </main>
  );
}
