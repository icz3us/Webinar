"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Survey } from "@/lib/surveys";
import { createClient } from "@/lib/supabase/client";

type UserState = {
  authenticated: boolean;
  userEmail?: string;
  fullName?: string;
  registered?: boolean;
  registeredForSession?: boolean;
  attendanceStatus?: "present" | "absent" | "not_marked";
  canAccess?: boolean;
  alreadySubmitted?: boolean;
  message?: string | null;
};

type SubmissionResult = {
  success: boolean;
  responseId: string;
  sessionTitle: string;
  attendanceConfirmed: boolean;
  surveyCompleted: boolean;
  certificateEligible: boolean;
  message: string;
};

export default function SurveyPopupModal({
  slug,
  onClose,
  onSubmitted,
}: {
  slug: string | null;
  onClose: () => void;
  onSubmitted?: (slug: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Close on Escape key and prevent background scroll
  useEffect(() => {
    if (!slug) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [slug, onClose]);

  // Load survey data whenever slug changes
  useEffect(() => {
    if (!slug) {
      setSurvey(null);
      setUserState(null);
      setSubmissionResult(null);
      setAnswers({});
      setSubmitError("");
      setLoadError("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setLoadError("");
    setSubmissionResult(null);
    setAnswers({});

    fetch(`/api/survey/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load survey.");
        }
        return data;
      })
      .then((data) => {
        if (!isMounted) return;
        setSurvey(data.survey);
        setUserState(data.userState);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || "Failed to connect to survey service.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug) return null;

  function handleAnswerChange(questionId: string, val: any) {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  }

  function handleCheckboxToggle(questionId: string, option: string) {
    const current: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    if (current.includes(option)) {
      handleAnswerChange(
        questionId,
        current.filter((item) => item !== option)
      );
    } else {
      handleAnswerChange(questionId, [...current, option]);
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    if (!supabase) return;
    const currentPath = window.location.pathname;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!survey) return;
    setSubmitError("");

    const questions = survey.questions ?? [];
    for (const q of questions) {
      const val = answers[q.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);

      if (q.required && isEmpty) {
        setSubmitError(`Please answer required question: "${q.question}"`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/survey/${encodeURIComponent(survey.publicSlug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit survey.");
      }

      setSubmissionResult(data);
      if (onSubmitted) {
        onSubmitted(survey.publicSlug);
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(23, 24, 20, 0.78)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "clamp(6px, 2vw, 16px)",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          background: "var(--paper, #f1efe8)",
          border: "2px solid var(--ink, #171814)",
          borderTop: "6px solid var(--signal, #d64a24)",
          width: "100%",
          maxWidth: "720px",
          minWidth: 0,
          maxHeight: "min(96vh, 900px)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.35)",
          boxSizing: "border-box",
          margin: "auto",
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px clamp(10px, 3vw, 20px)",
            borderBottom: "1px solid var(--line, #c9c7bd)",
            background: "#fff",
            flexShrink: 0,
            boxSizing: "border-box",
            gap: "8px",
            minWidth: 0,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: "1 1 auto", overflow: "hidden" }}>
            <ClipboardCheck size={20} style={{ color: "var(--signal, #d64a24)", flexShrink: 0 }} aria-hidden="true" />
            <span
              style={{
                font: "700 11px var(--font-geist-mono, monospace)",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--signal, #d64a24)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Post-Session Survey
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close survey dialog"
            disabled={submitting}
            style={{
              width: "44px",
              height: "44px",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              background: "transparent",
              border: "1px solid var(--line, #c9c7bd)",
              cursor: "pointer",
              color: "var(--ink, #171814)",
            }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: "clamp(14px, 3vw, 24px) clamp(10px, 2.5vw, 24px) clamp(18px, 3.5vw, 32px)",
            overflowY: "auto",
            overflowX: "hidden",
            flexGrow: 1,
            boxSizing: "border-box",
            minWidth: 0,
            width: "100%",
          }}
        >
          {loading && (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <LoaderCircle
                className="spin"
                size={40}
                style={{ color: "var(--signal, #d64a24)", margin: "0 auto 16px" }}
                aria-hidden="true"
              />
              <p style={{ margin: 0, fontWeight: 600, color: "var(--ink, #171814)" }}>
                Loading session feedback survey...
              </p>
            </div>
          )}

          {!loading && loadError && (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
              <AlertCircle size={44} style={{ color: "#a52b18", margin: "0 auto 16px" }} aria-hidden="true" />
              <h2 id="survey-modal-title" style={{ fontSize: "22px", margin: "0 0 10px" }}>
                Survey Unavailable
              </h2>
              <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "460px" }}>
                {loadError}
              </p>
              <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px" }}>
                Close
              </button>
            </div>
          )}

          {!loading && !loadError && userState && survey && (
            <>
              {/* State 1: Submitted view */}
              {submissionResult ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--green, #2d6139)", marginBottom: "12px" }}>
                    <CheckCircle2 size={32} aria-hidden="true" />
                    <h2 id="survey-modal-title" style={{ fontSize: "24px", margin: 0 }}>
                      Survey Submitted Successfully
                    </h2>
                  </div>
                  <p style={{ color: "var(--muted, #676860)", margin: "0 0 24px", lineHeight: 1.5 }}>
                    Thank you for your feedback. Your responses have been recorded for{" "}
                    <strong>{survey.session?.title ?? survey.title}</strong>.
                  </p>

                  <div
                    style={{
                      padding: "20px",
                      background: "#fff",
                      border: "1px solid var(--line, #c9c7bd)",
                      borderLeft: "4px solid var(--signal, #d64a24)",
                      display: "grid",
                      gap: "12px",
                      marginBottom: "28px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Attendance</span>
                      <strong
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: submissionResult.attendanceConfirmed ? "#e6f0e7" : "#fff8e6",
                          color: submissionResult.attendanceConfirmed ? "#2d6139" : "#7d5b12",
                          border: "1px solid",
                          borderColor: submissionResult.attendanceConfirmed ? "#78927e" : "#c5a458",
                        }}
                      >
                        {submissionResult.attendanceConfirmed ? "Verified Present" : "Pending Check-In"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Survey Status</span>
                      <strong
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: "#e6f0e7",
                          color: "#2d6139",
                          border: "1px solid #78927e",
                        }}
                      >
                        Completed
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Certificate Eligibility</span>
                      <strong
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: submissionResult.certificateEligible ? "#e6f0e7" : "#fff8e6",
                          color: submissionResult.certificateEligible ? "#2d6139" : "#7d5b12",
                          border: "1px solid",
                          borderColor: submissionResult.certificateEligible ? "#78927e" : "#c5a458",
                        }}
                      >
                        {submissionResult.certificateEligible ? "Certificate Eligible" : "Locked (Attendance Required)"}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px" }}>
                      Done
                    </button>
                  </div>
                </div>
              ) : !userState.authenticated ? (
                /* State 2: Not authenticated */
                <div style={{ padding: "28px 16px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
                  <ShieldCheck size={44} style={{ color: "var(--signal, #d64a24)", margin: "0 auto 16px" }} aria-hidden="true" />
                  <h2 id="survey-modal-title" style={{ fontSize: "22px", margin: "0 0 10px" }}>
                    Sign in to Complete Survey
                  </h2>
                  <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "460px", lineHeight: 1.5 }}>
                    Please sign in with your registered Google account so your feedback can be tied to your certificate record.
                  </p>
                  <button onClick={handleGoogleLogin} className="button button-primary" style={{ minHeight: "44px" }}>
                    Sign in with Google
                  </button>
                </div>
              ) : !userState.registered || !userState.registeredForSession ? (
                /* State 3: Not registered for session */
                <div style={{ padding: "28px 16px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
                  <AlertCircle size={44} style={{ color: "#a52b18", margin: "0 auto 16px" }} aria-hidden="true" />
                  <h2 id="survey-modal-title" style={{ fontSize: "22px", margin: "0 0 10px" }}>
                    Session Registration Required
                  </h2>
                  <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "460px", lineHeight: 1.5 }}>
                    {userState.message ?? "You are not registered for this session."}
                  </p>
                  <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px" }}>
                    Close
                  </button>
                </div>
              ) : userState.attendanceStatus !== "present" ? (
                /* State 4: Attendance Verification Required */
                <div style={{ padding: "28px 16px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
                  <AlertCircle size={44} style={{ color: "var(--signal, #d64a24)", margin: "0 auto 16px" }} aria-hidden="true" />
                  <h2 id="survey-modal-title" style={{ fontSize: "22px", margin: "0 0 10px" }}>
                    {userState.attendanceStatus === "absent"
                      ? "Marked Absent for this Session"
                      : "Attendance Verification Required"}
                  </h2>
                  <p style={{ color: "var(--muted, #676860)", margin: "0 auto 20px", maxWidth: "480px", lineHeight: 1.55 }}>
                    {userState.attendanceStatus === "absent"
                      ? "Your attendance record for this session is marked absent. Only verified present participants are eligible to complete this feedback survey."
                      : "You must be marked present in this session to access the feedback survey. Please wait for the event organizer to confirm your attendance."}
                  </p>

                  <div
                    style={{
                      margin: "0 auto 24px",
                      maxWidth: "340px",
                      padding: "12px 16px",
                      background: userState.attendanceStatus === "absent" ? "#fff2ee" : "#fff8e6",
                      border: "1px solid",
                      borderColor: userState.attendanceStatus === "absent" ? "#ffd4c7" : "#c5a458",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>Attendance Status</span>
                    <strong
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: userState.attendanceStatus === "absent" ? "#a52b18" : "#7d5b12",
                        textTransform: "uppercase",
                      }}
                    >
                      {userState.attendanceStatus === "absent" ? "Absent" : "Pending Check-In"}
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button
                      onClick={() => {
                        setLoading(true);
                        fetch(`/api/survey/${encodeURIComponent(slug)}`)
                          .then((r) => r.json())
                          .then((d) => {
                            setSurvey(d.survey);
                            setUserState(d.userState);
                          })
                          .finally(() => setLoading(false));
                      }}
                      className="button button-primary"
                      style={{ minHeight: "44px" }}
                    >
                      Re-check Attendance
                    </button>
                    <button onClick={onClose} className="button" style={{ minHeight: "44px" }}>
                      Close
                    </button>
                  </div>
                </div>
              ) : userState.alreadySubmitted ? (
                /* State 5: Already submitted */
                <div style={{ padding: "28px 16px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
                  <CheckCircle2 size={44} style={{ color: "var(--green, #2d6139)", margin: "0 auto 16px" }} aria-hidden="true" />
                  <h2 id="survey-modal-title" style={{ fontSize: "22px", margin: "0 0 10px" }}>
                    Survey Already Completed
                  </h2>
                  <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "460px", lineHeight: 1.5 }}>
                    You have already submitted the feedback survey for this session. Your responses are recorded.
                  </p>
                  <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px" }}>
                    Close
                  </button>
                </div>
              ) : (
                /* State 6: Active Survey Questions Form */
                <form onSubmit={handleSubmit} noValidate>
                  <div style={{ marginBottom: "24px" }}>
                    <span
                      style={{
                        font: "600 11px var(--font-geist-mono, monospace)",
                        color: "var(--signal, #d64a24)",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Participant Evaluation
                    </span>
                    <h2 id="survey-modal-title" style={{ fontSize: "24px", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                      {survey.session?.title ?? survey.title}
                    </h2>
                    <p style={{ color: "var(--muted, #676860)", margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
                      {survey.description}
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: "24px" }}>
                    {(survey.questions ?? []).map((q, idx) => {
                      const val = answers[q.id];
                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: "clamp(12px, 3vw, 20px)",
                            background: "#fff",
                            border: "1px solid var(--line, #c9c7bd)",
                            minWidth: 0,
                            boxSizing: "border-box",
                          }}
                        >
                          <div style={{ marginBottom: "14px", minWidth: 0 }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "baseline", minWidth: 0 }}>
                              <span style={{ font: "700 12px var(--font-geist-mono, monospace)", color: "var(--signal, #d64a24)", flexShrink: 0 }}>
                                0{idx + 1}.
                              </span>
                              <label htmlFor={`q-${q.id}`} style={{ fontWeight: 650, fontSize: "15px", color: "var(--ink, #171814)", overflowWrap: "anywhere" }}>
                                {q.question}
                                {q.required && (
                                  <span style={{ color: "var(--signal, #d64a24)", marginLeft: "4px" }} aria-label="Required field">
                                    *
                                  </span>
                                )}
                              </label>
                            </div>
                            {q.description && (
                              <p style={{ margin: "4px 0 0 24px", fontSize: "13px", color: "var(--muted, #676860)", overflowWrap: "anywhere" }}>
                                {q.description}
                              </p>
                            )}
                          </div>

                          {/* Question types */}
                          {q.questionType === "rating" && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", width: "100%" }}>
                              {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                  type="button"
                                  key={score}
                                  onClick={() => handleAnswerChange(q.id, score)}
                                  style={{
                                    flex: "1 1 44px",
                                    minWidth: "40px",
                                    minHeight: "44px",
                                    padding: "8px 6px",
                                    border: "1px solid",
                                    borderColor: val === score ? "var(--signal, #d64a24)" : "var(--line, #c9c7bd)",
                                    background: val === score ? "var(--signal, #d64a24)" : "#fff",
                                    color: val === score ? "#fff" : "var(--ink, #171814)",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "3px",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  <Star size={13} fill={val === score ? "#fff" : "none"} aria-hidden="true" />
                                  <span>{score}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {q.questionType === "yes_no" && (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
                              {["Yes", "No"].map((option) => (
                                <button
                                  type="button"
                                  key={option}
                                  onClick={() => handleAnswerChange(q.id, option)}
                                  style={{
                                    flex: "1 1 80px",
                                    minHeight: "44px",
                                    padding: "8px 16px",
                                    border: "1px solid",
                                    borderColor: val === option ? "var(--signal, #d64a24)" : "var(--line, #c9c7bd)",
                                    background: val === option ? "var(--signal, #d64a24)" : "#fff",
                                    color: val === option ? "#fff" : "var(--ink, #171814)",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}

                          {q.questionType === "multiple_choice" && (
                            <div style={{ display: "grid", gap: "8px" }}>
                              {(q.options ?? []).map((opt) => (
                                <label
                                  key={opt}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px 14px",
                                    border: "1px solid",
                                    borderColor: val === opt ? "var(--signal, #d64a24)" : "var(--line, #c9c7bd)",
                                    background: val === opt ? "#fff5f1" : "#fff",
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    checked={val === opt}
                                    onChange={() => handleAnswerChange(q.id, opt)}
                                  />
                                  <span style={{ fontSize: "14px" }}>{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.questionType === "checkbox" && (
                            <div style={{ display: "grid", gap: "8px" }}>
                              {(q.options ?? []).map((opt) => {
                                const checked = Array.isArray(val) && val.includes(opt);
                                return (
                                  <label
                                    key={opt}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      padding: "10px 14px",
                                      border: "1px solid",
                                      borderColor: checked ? "var(--signal, #d64a24)" : "var(--line, #c9c7bd)",
                                      background: checked ? "#fff5f1" : "#fff",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleCheckboxToggle(q.id, opt)}
                                    />
                                    <span style={{ fontSize: "14px" }}>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {q.questionType === "short_text" && (
                            <input
                              id={`q-${q.id}`}
                              type="text"
                              value={val ?? ""}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              placeholder="Type your response..."
                              style={{
                                width: "100%",
                                minHeight: "44px",
                                padding: "10px 14px",
                                border: "1px solid var(--line, #c9c7bd)",
                                background: "#fff",
                              }}
                            />
                          )}

                          {q.questionType === "long_text" && (
                            <textarea
                              id={`q-${q.id}`}
                              rows={3}
                              value={val ?? ""}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              placeholder="Type your feedback here..."
                              style={{
                                width: "100%",
                                padding: "10px 14px",
                                border: "1px solid var(--line, #c9c7bd)",
                                background: "#fff",
                                resize: "vertical",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {submitError && (
                    <div
                      role="alert"
                      style={{
                        margin: "20px 0 0",
                        padding: "12px 16px",
                        background: "#fff1ed",
                        border: "1px solid #a52b18",
                        color: "#8d2413",
                        fontSize: "14px",
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "28px",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="button"
                      style={{ minHeight: "44px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="button button-primary"
                      style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle className="spin" size={16} aria-hidden="true" />
                          <span>Submitting feedback...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Feedback</span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
