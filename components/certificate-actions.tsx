"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";

export default function CertificateActions({
  sessions,
  activeSessionId,
}: {
  sessions: { id: string; title: string; slug: string }[];
  activeSessionId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function generate(sessionId?: string) {
    const targetId = sessionId ?? "all";
    setBusy(targetId);
    setMessage("");
    const response = await fetch("/api/admin/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: targetId }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? `${data.generated} certificate${data.generated === 1 ? "" : "s"} generated.`
        : data.error ?? "Generation failed."
    );
    setBusy("");
    if (response.ok) router.refresh();
  }

  async function emailAll() {
    const isFiltered = Boolean(activeSessionId && activeSessionId !== "all");
    const activeSession = sessions.find((s) => s.id === activeSessionId || s.slug === activeSessionId);
    const promptText = activeSession
      ? `Send certificates by email to all present participants in ${activeSession.title}?`
      : "Send certificates by email to all present participants across all sessions?";

    if (!confirm(promptText)) return;

    setBusy("email-all");
    setMessage("");
    const response = await fetch("/api/admin/certificates/email-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSession?.id ?? "all" }),
    });
    const data = await response.json();
    if (response.ok) {
      if (data.total === 0) {
        setMessage("No issued certificates found for present participants.");
      } else {
        const certCount = data.totalCertificates ?? data.total;
        setMessage(
          `Emailed ${data.sent} attendee${data.sent === 1 ? "" : "s"} (${certCount} certificate${certCount === 1 ? "" : "s"}).${data.failed ? ` Failed: ${data.failed}.` : ""}`
        );
      }
    } else {
      setMessage(data.error ?? "Failed to send certificate emails.");
    }
    setBusy("");
    router.refresh();
  }

  return (
    <div className="certificate-actions">
      <button
        className="button button-primary"
        disabled={Boolean(busy)}
        onClick={() => generate("all")}
      >
        {busy === "all" ? "Generating..." : "Generate all sessions"}
      </button>

      {sessions.map((session, index) => (
        <button
          className="button"
          disabled={Boolean(busy)}
          onClick={() => generate(session.id)}
          key={session.id}
        >
          {busy === session.id ? "Generating..." : `Generate Session 0${index + 1}`}
        </button>
      ))}

      <button
        className="button button-primary"
        disabled={Boolean(busy)}
        onClick={emailAll}
        title="Email certificates to verified present attendees"
      >
        {busy === "email-all"
          ? "Sending emails..."
          : activeSessionId && activeSessionId !== "all"
          ? "Email session certificates"
          : "Email all certificates"}
      </button>

      <div style={{ display: "inline-flex", gap: "8px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
        <a
          href="/sample-session1.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="rendered-certificate-session1.pdf"
          className="button"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          title="Download rendered sample PDF for Session 1"
        >
          <Download size={14} />
          Sample PDF (S1)
        </a>
        <a
          href="/sample-session2.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="rendered-certificate-session2.pdf"
          className="button"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          title="Download rendered sample PDF for Session 2"
        >
          <Download size={14} />
          Sample PDF (S2)
        </a>
      </div>

      {message && <p role="status">{message}</p>}
    </div>
  );
}
