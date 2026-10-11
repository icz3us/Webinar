"use client";

import { useState } from "react";
import { Download, ExternalLink, QrCode } from "lucide-react";
import { Survey, SurveyResponseRecord } from "@/lib/surveys";
import SurveyQrModal from "@/components/survey-qr-modal";

export default function AdminSurveyAnalytics({
  survey,
  responses,
  totalRegistered,
  totalPresent,
}: {
  survey: Survey;
  responses: SurveyResponseRecord[];
  totalRegistered: number;
  totalPresent: number;
}) {
  const [showQr, setShowQr] = useState(false);

  const questions = survey.questions ?? [];
  const responseCount = responses.length;

  const attendanceResponseRate =
    totalPresent > 0 ? Math.round((responseCount / totalPresent) * 100) : 0;

  // Compute question analytics
  const analyticsByQuestion = questions.map((q) => {
    const rawAnswers = responses
      .map((r) => r.answers.find((a) => a.questionId === q.id)?.answer)
      .filter((a) => a !== undefined && a !== null && a !== "");

    if (q.questionType === "rating") {
      const numericRatings = rawAnswers
        .map((a) => Number(a))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 5);

      const avg =
        numericRatings.length > 0
          ? (numericRatings.reduce((sum, val) => sum + val, 0) / numericRatings.length).toFixed(1)
          : "N/A";

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const rating of numericRatings) {
        if (distribution[rating] !== undefined) distribution[rating]++;
      }

      return {
        question: q,
        totalAnswered: numericRatings.length,
        avgRating: avg,
        distribution,
      };
    }

    if (q.questionType === "yes_no") {
      const counts: Record<string, number> = { Yes: 0, No: 0 };
      for (const a of rawAnswers) {
        const str = String(a).toLowerCase();
        if (str === "yes" || str === "true") counts.Yes++;
        else if (str === "no" || str === "false") counts.No++;
      }
      return {
        question: q,
        totalAnswered: rawAnswers.length,
        counts,
      };
    }

    if (q.questionType === "multiple_choice" || q.questionType === "checkbox") {
      const counts: Record<string, number> = {};
      for (const opt of q.options) {
        counts[opt] = 0;
      }
      counts["Other / Unlisted"] = 0;

      for (const a of rawAnswers) {
        if (Array.isArray(a)) {
          for (const item of a) {
            const key = String(item);
            counts[key] = (counts[key] || 0) + 1;
          }
        } else {
          const key = String(a);
          counts[key] = (counts[key] || 0) + 1;
        }
      }
      return {
        question: q,
        totalAnswered: rawAnswers.length,
        counts,
      };
    }

    // Text questions
    return {
      question: q,
      totalAnswered: rawAnswers.length,
      textResponses: rawAnswers.map((a) => String(a)),
    };
  });

  return (
    <main className="admin-content">
      <div className="admin-title">
        <div>
          <span>SURVEY METRICS / ANALYTICS</span>
          <h1>{survey.title}</h1>
          <p style={{ margin: "4px 0 0" }}>
            Session: <strong>{survey.session?.title ?? "Session"}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a
            href={`/api/admin/surveys/${survey.id}/export`}
            download
            className="button button-primary"
            style={{ minHeight: "44px" }}
          >
            <Download size={15} /> Export responses (CSV)
          </a>

          <button
            type="button"
            onClick={() => setShowQr(true)}
            className="button"
            style={{ minHeight: "44px" }}
          >
            <QrCode size={15} /> QR Code
          </button>

          <a
            href={`/survey/${survey.publicSlug}`}
            target="_blank"
            rel="noreferrer"
            className="button"
            style={{ minHeight: "44px" }}
          >
            <ExternalLink size={15} /> Public page
          </a>
        </div>
      </div>

      {/* Top summary stats */}
      <section className="stat-grid" style={{ marginBottom: "32px" }}>
        <article>
          <span>01</span>
          <strong>{responseCount}</strong>
          <p>Total responses submitted</p>
        </article>
        <article>
          <span>02</span>
          <strong>{totalPresent}</strong>
          <p>Verified present attendees</p>
        </article>
        <article>
          <span>03</span>
          <strong>{attendanceResponseRate}%</strong>
          <p>Response rate (vs. attendees)</p>
        </article>
      </section>

      {/* Question by Question Breakdown */}
      <div style={{ marginBottom: "40px" }}>
        <span
          style={{
            font: "600 11px var(--font-geist-mono, monospace)",
            color: "var(--signal, #d64a24)",
            display: "block",
            marginBottom: "6px",
            letterSpacing: "0.06em",
          }}
        >
          BREAKDOWN / QUESTION RESPONSES
        </span>
        <h2 style={{ margin: "0 0 20px", fontSize: "28px" }}>Question Results</h2>

        <div style={{ display: "grid", gap: "24px" }}>
          {analyticsByQuestion.map((item, idx) => {
            const q = item.question;

            return (
              <div
                key={q.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--line, #c9c7bd)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: "var(--ink, #171814)",
                        color: "#fff",
                        font: "700 10px var(--font-geist-mono, monospace)",
                        padding: "2px 7px",
                      }}
                    >
                      Q{idx + 1}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted, #676860)", textTransform: "uppercase" }}>
                      {q.questionType.replace("_", " ")}
                    </span>
                  </div>
                  <small style={{ color: "var(--muted, #676860)" }}>
                    {item.totalAnswered} response{item.totalAnswered === 1 ? "" : "s"}
                  </small>
                </div>

                <h3 style={{ margin: "8px 0 16px", fontSize: "18px" }}>{q.question}</h3>

                {/* Rating Display */}
                {q.questionType === "rating" && item.distribution && (
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "36px", fontWeight: 700, color: "var(--signal, #d64a24)" }}>
                        {item.avgRating}
                      </span>
                      <span style={{ color: "var(--muted, #676860)", fontSize: "14px" }}>
                        out of 5 average rating
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = item.distribution![stars] || 0;
                        const pct =
                          item.totalAnswered > 0
                            ? Math.round((count / item.totalAnswered) * 100)
                            : 0;

                        return (
                          <div
                            key={stars}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "70px 1fr 60px",
                              gap: "12px",
                              alignItems: "center",
                              fontSize: "13px",
                            }}
                          >
                            <span>{stars} Stars</span>
                            <div
                              style={{
                                height: "18px",
                                background: "#eceae3",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${pct}%`,
                                  background: "var(--signal, #d64a24)",
                                }}
                              />
                            </div>
                            <span style={{ textAlign: "right", color: "var(--muted, #676860)" }}>
                              {count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Yes / No Display */}
                {q.questionType === "yes_no" && item.counts && (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {["Yes", "No"].map((choice) => {
                      const count = item.counts![choice] || 0;
                      const pct =
                        item.totalAnswered > 0
                          ? Math.round((count / item.totalAnswered) * 100)
                          : 0;

                      return (
                        <div
                          key={choice}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "60px 1fr 60px",
                            gap: "12px",
                            alignItems: "center",
                            fontSize: "13px",
                          }}
                        >
                          <strong>{choice}</strong>
                          <div style={{ height: "18px", background: "#eceae3" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: choice === "Yes" ? "var(--green, #426b4c)" : "#8c2d1e",
                              }}
                            />
                          </div>
                          <span style={{ textAlign: "right", color: "var(--muted, #676860)" }}>
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Multiple choice and Checkbox Distribution */}
                {(q.questionType === "multiple_choice" || q.questionType === "checkbox") &&
                  item.counts && (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {Object.entries(item.counts)
                        .filter(([opt, count]) => count > 0 || q.options.includes(opt))
                        .map(([opt, count]) => {
                          const pct =
                            item.totalAnswered > 0
                              ? Math.round((count / item.totalAnswered) * 100)
                              : 0;

                          return (
                            <div
                              key={opt}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(140px, 1.2fr) 2fr 70px",
                                gap: "12px",
                                alignItems: "center",
                                fontSize: "13px",
                              }}
                            >
                              <span>{opt}</span>
                              <div style={{ height: "18px", background: "#eceae3" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: "#3e423b",
                                  }}
                                />
                              </div>
                              <span style={{ textAlign: "right", color: "var(--muted, #676860)" }}>
                                {count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                {/* Text responses list */}
                {(q.questionType === "short_text" || q.questionType === "long_text") &&
                  item.textResponses && (
                    <div>
                      {item.textResponses.length === 0 ? (
                        <p style={{ margin: 0, color: "var(--muted, #676860)", fontSize: "13px" }}>
                          No written responses submitted for this question yet.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            maxHeight: "260px",
                            overflowY: "auto",
                            paddingRight: "8px",
                          }}
                        >
                          {item.textResponses.map((text, textIdx) => (
                            <div
                              key={textIdx}
                              style={{
                                padding: "10px 14px",
                                background: "#f8f6ef",
                                border: "1px solid #e2e0d8",
                                fontSize: "13px",
                                lineHeight: "1.5",
                              }}
                            >
                              {text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Response Log */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <div>
            <span
              style={{
                font: "600 11px var(--font-geist-mono, monospace)",
                color: "var(--signal, #d64a24)",
                display: "block",
                marginBottom: "4px",
                letterSpacing: "0.06em",
              }}
            >
              LOG / SUBMISSION RECORDS
            </span>
            <h2 style={{ margin: 0, fontSize: "24px" }}>Recent Submissions ({responses.length})</h2>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Submitted at</th>
                <th>Response details</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((resp) => (
                <tr key={resp.id}>
                  <td>
                    <strong>{resp.participantName || "Participant"}</strong>
                    <small style={{ color: "var(--muted, #676860)" }}>{resp.participantEmail}</small>
                  </td>
                  <td>
                    {new Date(resp.submittedAt).toLocaleDateString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <details>
                      <summary style={{ cursor: "pointer", color: "var(--signal, #d64a24)", fontSize: "13px" }}>
                        View {resp.answers.length} answers
                      </summary>
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "12px",
                          background: "#f8f6ef",
                          border: "1px solid #e0ded5",
                          fontSize: "12px",
                          display: "grid",
                          gap: "8px",
                        }}
                      >
                        {resp.answers.map((ans) => {
                          const matchingQ = questions.find((q) => q.id === ans.questionId);
                          return (
                            <div key={ans.questionId}>
                              <strong>{matchingQ?.question || "Question"}:</strong>{" "}
                              <span>
                                {Array.isArray(ans.answer) ? ans.answer.join(", ") : String(ans.answer)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}

              {!responses.length && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty-state" style={{ padding: "30px", textAlign: "center" }}>
                      No submissions recorded yet for this survey.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showQr && (
        <SurveyQrModal
          surveyTitle={survey.title}
          slug={survey.publicSlug}
          sessionTitle={survey.session?.title ?? "Webinar Session"}
          onClose={() => setShowQr(false)}
        />
      )}
    </main>
  );
}
