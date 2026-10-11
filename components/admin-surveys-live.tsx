"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  Check,
  Copy,
  Edit,
  ExternalLink,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { Survey } from "@/lib/surveys";
import SurveyQrModal from "@/components/survey-qr-modal";

export default function AdminSurveysLive({
  surveys,
  sessions,
  activeSessionSlug,
}: {
  surveys: (Survey & { responseCount?: number })[];
  sessions: { id: string; title: string; slug: string }[];
  activeSessionSlug: string;
}) {
  const router = useRouter();

  const [qrTarget, setQrTarget] = useState<Survey | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const filtered =
    activeSessionSlug === "all"
      ? surveys
      : surveys.filter((s) => s.session?.slug === activeSessionSlug);

  const totalResponses = surveys.reduce((sum, s) => sum + (s.responseCount ?? 0), 0);
  const publishedCount = surveys.filter((s) => s.status === "published").length;

  const siteOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  async function handleCopy(slug: string, id: string) {
    const url = `${siteOrigin}/survey/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(id);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      // ignore
    }
  }

  async function handleStatusChange(surveyId: string, newStatus: "draft" | "published" | "closed") {
    setBusyAction(`${surveyId}-${newStatus}`);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed.");
      setMessage(`Survey status changed to ${newStatus}.`);
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "Status change failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDuplicate(surveyId: string) {
    setBusyAction(`${surveyId}-dup`);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplication failed.");
      setMessage("Survey duplicated successfully.");
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "Duplication failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete(surveyId: string, title: string) {
    if (!confirm(`Are you sure you want to delete the survey: "${title}"?`)) return;
    setBusyAction(`${surveyId}-del`);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setMessage("Survey deleted.");
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "Delete failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="admin-content">
      <div className="admin-title">
        <div>
          <span>FEEDBACK &amp; VERIFICATION / SURVEY MANAGER</span>
          <h1>Post-session surveys</h1>
        </div>
        <a
          href="/admin/surveys/builder"
          className="button button-primary"
          style={{ minHeight: "46px" }}
        >
          <Plus size={16} /> Create survey
        </a>
      </div>

      {message && (
        <div className="operation-message" role="status" style={{ marginBottom: "20px" }}>
          {message}
        </div>
      )}

      {/* Top summary metrics */}
      <section className="stat-grid" style={{ marginBottom: "32px" }}>
        <article>
          <span>01</span>
          <strong>{surveys.length}</strong>
          <p>Total configured surveys</p>
        </article>
        <article>
          <span>02</span>
          <strong>{publishedCount}</strong>
          <p>Active published surveys</p>
        </article>
        <article>
          <span>03</span>
          <strong>{totalResponses}</strong>
          <p>Total responses received</p>
        </article>
      </section>

      {/* Filter tab bar */}
      <nav className="tab-bar" aria-label="Filter surveys by session">
        <a
          className={activeSessionSlug === "all" ? "active" : ""}
          href="/admin/surveys"
        >
          All sessions ({surveys.length})
        </a>
        {sessions.map((session, index) => {
          const count = surveys.filter((s) => s.session?.id === session.id || s.sessionId === session.id).length;
          return (
            <a
              key={session.id}
              className={activeSessionSlug === session.slug ? "active" : ""}
              href={`/admin/surveys?session=${session.slug}`}
            >
              Session 0{index + 1} ({count})
            </a>
          );
        })}
      </nav>

      {/* Surveys table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Survey / Title</th>
              <th>Session</th>
              <th>Status</th>
              <th>Questions</th>
              <th>Responses</th>
              <th>Public link / QR</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((survey) => {
              const isPublished = survey.status === "published";
              const isClosed = survey.status === "closed";

              return (
                <tr key={survey.id}>
                  <td>
                    <strong>{survey.title}</strong>
                    <small style={{ color: "var(--muted, #676860)" }}>
                      Slug: /{survey.publicSlug}
                    </small>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: survey.session?.slug === "session-1" ? "#e6f0e7" : "#fff1e6",
                        borderColor: survey.session?.slug === "session-1" ? "#78927e" : "#d88235",
                        color: survey.session?.slug === "session-1" ? "#244d2d" : "#8a3d07",
                        fontWeight: 700,
                      }}
                    >
                      {survey.session?.slug === "session-1" ? "Session 01" : "Session 02"}
                    </span>
                    <small style={{ display: "block", marginTop: "4px" }}>
                      {survey.session?.title}
                    </small>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background:
                          isPublished
                            ? "#e6f0e7"
                            : isClosed
                            ? "#f1f0ec"
                            : "#fff8e6",
                        borderColor:
                          isPublished
                            ? "#78927e"
                            : isClosed
                            ? "#999"
                            : "#c5a458",
                        color:
                          isPublished
                            ? "#2d6139"
                            : isClosed
                            ? "#555"
                            : "#7d5b12",
                        textTransform: "uppercase",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {survey.status}
                    </span>
                  </td>
                  <td>
                    <strong>{survey.questions?.length ?? 0}</strong> questions
                  </td>
                  <td>
                    <strong>{survey.responseCount ?? 0}</strong> responses
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(survey.publicSlug, survey.id)}
                        className="table-action"
                        title="Copy survey URL"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        {copyFeedback === survey.id ? <Check size={14} /> : <Copy size={14} />}
                        {copyFeedback === survey.id ? "Copied" : "Copy"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrTarget(survey)}
                        className="table-action"
                        title="Generate QR code"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        <QrCode size={14} /> QR
                      </button>

                      <a
                        href={`/survey/${survey.publicSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="table-action"
                        title="Open survey in new tab"
                        style={{ fontSize: "12px", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    </div>
                  </td>
                  <td className="table-actions">
                    <a
                      href={`/admin/surveys/${survey.id}`}
                      className="table-action"
                      title="View responses & analytics"
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                    >
                      <BarChart2 size={13} /> Responses
                    </a>

                    <a
                      href={`/admin/surveys/builder?id=${survey.id}`}
                      className="table-action"
                      title="Edit survey"
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                    >
                      <Edit size={13} /> Edit
                    </a>

                    {isPublished ? (
                      <button
                        type="button"
                        disabled={busyAction === `${survey.id}-draft`}
                        onClick={() => handleStatusChange(survey.id, "draft")}
                        className="table-action"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyAction === `${survey.id}-published`}
                        onClick={() => handleStatusChange(survey.id, "published")}
                        className="table-action"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        Publish
                      </button>
                    )}

                    {!isClosed && (
                      <button
                        type="button"
                        disabled={busyAction === `${survey.id}-closed`}
                        onClick={() => handleStatusChange(survey.id, "closed")}
                        className="table-action"
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        Close
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busyAction === `${survey.id}-dup`}
                      onClick={() => handleDuplicate(survey.id)}
                      className="table-action"
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      disabled={busyAction === `${survey.id}-del`}
                      onClick={() => handleDelete(survey.id, survey.title)}
                      className="table-action"
                      style={{
                        fontSize: "12px",
                        padding: "6px 10px",
                        color: "#a52b18",
                        borderColor: "#a52b18",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {!filtered.length && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 16px", color: "var(--muted, #676860)" }}>
                      No surveys found for this view.
                    </p>
                    <a href="/admin/surveys/builder" className="button button-primary">
                      Create your first survey
                    </a>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* QR Code Modal */}
      {qrTarget && (
        <SurveyQrModal
          surveyTitle={qrTarget.title}
          slug={qrTarget.publicSlug}
          sessionTitle={qrTarget.session?.title ?? "Webinar Session"}
          onClose={() => setQrTarget(null)}
        />
      )}
    </main>
  );
}
