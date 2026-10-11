"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Star, Download, ShieldCheck } from "lucide-react";
import { Survey } from "@/lib/surveys";
import { createClient } from "@/lib/supabase/client";

type UserState = {
  authenticated: boolean;
  userEmail?: string;
  fullName?: string;
  registered?: boolean;
  registeredForSession?: boolean;
  attendanceStatus?: "present" | "absent" | "not_marked";
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

export default function ParticipantSurvey({
  survey,
  initialUserState,
}: {
  survey: Survey;
  initialUserState: UserState;
}) {
  const [userState, setUserState] = useState<UserState>(initialUserState);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const questions = survey.questions ?? [];

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
    setSubmitError("");

    // Validate required questions client-side
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
      const res = await fetch(`/api/survey/${survey.publicSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit survey.");
      }

      setSubmissionResult(data);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. Completion / Submitted View
  if (submissionResult) {
    return (
      <main className="standalone">
        <section className="receipt" style={{ borderTopColor: "var(--signal, #d64a24)" }}>
          <div className="receipt-mark" style={{ color: "var(--green, #426b4c)" }}>
            <CheckCircle2 size={54} aria-hidden="true" />
          </div>

          <span className="section-index">FEEDBACK / RECORDED</span>
          <h1>Survey Submitted</h1>
          <p>
            Thank you for your feedback. Your response has been successfully recorded for{" "}
            <strong>{survey.session?.title ?? survey.title}</strong>.
          </p>

          <div
            style={{
              marginTop: "32px",
              padding: "24px",
              background: "#fff",
              border: "1px solid var(--line, #c9c7bd)",
              display: "grid",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Attendance</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  border: "1px solid",
                  borderColor: submissionResult.attendanceConfirmed ? "#78927e" : "#c5a458",
                  background: submissionResult.attendanceConfirmed ? "#e6f0e7" : "#fff8e6",
                  color: submissionResult.attendanceConfirmed ? "#2d6139" : "#7d5b12",
                }}
              >
                {submissionResult.attendanceConfirmed ? "✓ Confirmed (Present)" : "Pending Verification"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Survey</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  border: "1px solid #78927e",
                  background: "#e6f0e7",
                  color: "#2d6139",
                }}
              >
                ✓ Completed
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #eee" }}>
              <span style={{ fontWeight: 700 }}>Certificate Eligibility</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  border: "1px solid",
                  borderColor: submissionResult.certificateEligible ? "#78927e" : "#c5a458",
                  background: submissionResult.certificateEligible ? "#e6f0e7" : "#fff8e6",
                  color: submissionResult.certificateEligible ? "#2d6139" : "#7d5b12",
                }}
              >
                {submissionResult.certificateEligible ? "✓ Eligible" : "Pending Attendance Confirmation"}
              </span>
            </div>
          </div>

          <p className="receipt-note" style={{ marginTop: "24px" }}>
            {submissionResult.certificateEligible
              ? "All certificate requirements are satisfied: Registered + Present + Survey completed. Your e-certificate is generated and available in your registration record."
              : "Attendance verification is required before your certificate is generated. Once the organizer verifies your attendance, your certificate will automatically become eligible."}
          </p>

          <div className="receipt-actions" style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a href="/my-registration" className="button button-primary" style={{ minHeight: "48px" }}>
              View My Registration &amp; Certificates
            </a>
            <a href="/" className="button" style={{ minHeight: "48px" }}>
              Return to Event Page
            </a>
          </div>
        </section>
      </main>
    );
  }

  // 2. Auth Gate View
  if (!userState.authenticated) {
    return (
      <main className="standalone">
        <section className="receipt" style={{ borderTopColor: "var(--signal, #d64a24)" }}>
          <span className="section-index">SESSION FEEDBACK / IDENTIFICATION</span>
          <h1>Session Feedback</h1>
          <p style={{ margin: "8px 0 24px", fontWeight: 700, fontSize: "20px" }}>
            {survey.session?.title ?? survey.title}
          </p>

          <div
            style={{
              padding: "36px",
              background: "#fff",
              border: "1px solid var(--line, #c9c7bd)",
              textAlign: "center",
            }}
          >
            <ShieldCheck size={44} style={{ color: "var(--signal, #d64a24)", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "24px", margin: "0 0 10px" }}>Sign in to complete survey</h2>
            <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "480px", lineHeight: "1.5" }}>
              To ensure certificate eligibility is accurately tied to your attendance and registration,
              please sign in with your registered Google account.
            </p>

            <button
              onClick={handleGoogleLogin}
              className="button button-primary"
              style={{ minHeight: "48px", padding: "12px 28px", margin: "auto" }}
            >
              Sign in with Google
            </button>
          </div>

          <div style={{ marginTop: "24px" }}>
            <a href="/" className="button" style={{ minHeight: "44px" }}>
              <ArrowLeft size={16} /> Return to event page
            </a>
          </div>
        </section>
      </main>
    );
  }

  // 3. Not registered for event or not registered for this session
  if (userState.registered === false || userState.registeredForSession === false) {
    return (
      <main className="standalone">
        <section className="receipt" style={{ borderTopColor: "var(--signal, #d64a24)" }}>
          <span className="section-index" style={{ color: "#a52b18" }}>
            ACCESS RESTRICTED / NOT REGISTERED
          </span>
          <h1>Registration Required</h1>
          <p style={{ margin: "8px 0 24px", fontWeight: 700, fontSize: "20px" }}>
            {survey.session?.title ?? survey.title}
          </p>

          <div className="empty-state" style={{ background: "#fff", padding: "32px", textAlign: "center" }}>
            <AlertCircle size={40} style={{ color: "#a52b18", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "22px", margin: "0 0 8px" }}>
              {userState.message ?? "You are not registered for this session."}
            </h2>
            <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "460px" }}>
              Only participants who registered for this specific session are eligible to submit feedback
              and receive the session certificate.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <a href="/my-registration" className="button button-primary">
                View My Registration
              </a>
              <a href="/" className="button">
                Return to event page
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // 3.5 Attendance Verification Gate: Must be verified present
  if (userState.attendanceStatus !== "present") {
    const isAbsent = userState.attendanceStatus === "absent";
    return (
      <main className="standalone">
        <section className="receipt" style={{ borderTopColor: "var(--signal, #d64a24)" }}>
          <span className="section-index" style={{ color: "var(--signal, #d64a24)" }}>
            ATTENDANCE / VERIFICATION REQUIRED
          </span>
          <h1>Attendance Required</h1>
          <p style={{ margin: "8px 0 24px", fontWeight: 700, fontSize: "20px" }}>
            {survey.session?.title ?? survey.title}
          </p>

          <div className="empty-state" style={{ background: "#fff", padding: "32px", textAlign: "center" }}>
            <AlertCircle size={44} style={{ color: "var(--signal, #d64a24)", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "22px", margin: "0 0 10px" }}>
              {isAbsent ? "Marked Absent for this Session" : "Attendance Verification Required"}
            </h2>
            <p style={{ color: "var(--muted, #676860)", margin: "0 auto 24px", maxWidth: "480px", lineHeight: "1.55" }}>
              {isAbsent
                ? "Your attendance record for this session is marked absent. Only verified present participants are eligible to access and complete this feedback survey."
                : "You must be marked present in this session to access the feedback survey. If you attended this session, please wait for the organizers to confirm your attendance or check back shortly."}
            </p>

            <div
              style={{
                margin: "0 auto 28px",
                maxWidth: "380px",
                padding: "14px 18px",
                background: isAbsent ? "#fff2ee" : "#fff8e6",
                border: "1px solid",
                borderColor: isAbsent ? "#ffd4c7" : "#c5a458",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink, #171814)" }}>
                Current Attendance Status
              </span>
              <strong
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isAbsent ? "#a52b18" : "#7d5b12",
                  textTransform: "uppercase",
                }}
              >
                {isAbsent ? "Absent" : "Pending Check-In"}
              </strong>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="button button-primary"
                onClick={() => window.location.reload()}
                style={{ minHeight: "44px" }}
              >
                Refresh Status
              </button>
              <a href="/my-registration" className="button" style={{ minHeight: "44px" }}>
                View My Registration
              </a>
              <a href="/" className="button" style={{ minHeight: "44px" }}>
                Return to Event Page
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // 4. Already submitted view
  if (userState.alreadySubmitted) {
    return (
      <main className="standalone">
        <section className="receipt" style={{ borderTopColor: "var(--green, #426b4c)" }}>
          <div className="receipt-mark" style={{ color: "var(--green, #426b4c)" }}>
            <CheckCircle2 size={54} aria-hidden="true" />
          </div>

          <span className="section-index">RECORD FOUND / COMPLETED</span>
          <h1>Survey Already Completed</h1>
          <p style={{ margin: "8px 0 24px", fontWeight: 700, fontSize: "20px" }}>
            {survey.session?.title ?? survey.title}
          </p>

          <p style={{ color: "var(--muted, #676860)", lineHeight: "1.6" }}>
            You have already completed the feedback survey for this session. Duplicate submissions
            are not permitted.
          </p>

          <div
            style={{
              margin: "24px 0",
              padding: "20px",
              background: "#fff",
              border: "1px solid var(--line, #c9c7bd)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Attendance status:</span>
              <strong>
                {userState.attendanceStatus === "present"
                  ? "✓ Verified Present"
                  : "Pending Verification"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
              <span>Survey status:</span>
              <strong style={{ color: "var(--green, #426b4c)" }}>✓ Completed</strong>
            </div>
          </div>

          <div className="receipt-actions" style={{ display: "flex", gap: "12px" }}>
            <a href="/my-registration" className="button button-primary">
              Check Certificate Status
            </a>
            <a href="/" className="button">
              Return to event page
            </a>
          </div>
        </section>
      </main>
    );
  }

  // 5. Active Survey Question Form
  return (
    <main className="standalone">
      <section className="receipt wide" style={{ borderTopColor: "var(--signal, #d64a24)" }}>
        <span className="section-index">SESSION FEEDBACK</span>
        <h1 style={{ marginBottom: "8px" }}>Session Feedback</h1>
        <h2 style={{ fontSize: "22px", margin: "0 0 16px", color: "var(--signal, #d64a24)" }}>
          {survey.session?.title ?? survey.title}
        </h2>

        <p style={{ color: "var(--muted, #676860)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 24px" }}>
          {survey.description ||
            "Thank you for attending this session. Please complete this short survey to provide feedback about the webinar and qualify for your certificate of participation."}
        </p>

        {userState.fullName && (
          <div
            style={{
              padding: "14px 18px",
              background: "#fff",
              border: "1px solid var(--line, #c9c7bd)",
              marginBottom: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted, #676860)", textTransform: "uppercase" }}>
                Submitting as:
              </span>
              <strong style={{ display: "block" }}>{userState.fullName}</strong>
            </div>
            <span style={{ fontSize: "12px", color: "var(--muted, #676860)" }}>
              {userState.userEmail}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "28px" }}>
          {questions.map((q, idx) => (
            <fieldset
              key={q.id}
              style={{
                border: "1px solid var(--line, #c9c7bd)",
                background: "#fff",
                padding: "24px",
                margin: 0,
              }}
            >
              <legend
                style={{
                  padding: "0 8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--signal, #d64a24)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                QUESTION 0{idx + 1} {q.required ? "*" : "(OPTIONAL)"}
              </legend>

              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: 650,
                  marginBottom: q.description ? "4px" : "16px",
                  lineHeight: "1.4",
                }}
              >
                {q.question}
                {q.required && <span style={{ color: "var(--signal, #d64a24)", marginLeft: "4px" }}>*</span>}
              </label>

              {q.description && (
                <p style={{ margin: "0 0 16px", color: "var(--muted, #676860)", fontSize: "13px" }}>
                  {q.description}
                </p>
              )}

              {/* Short Text */}
              {q.questionType === "short_text" && (
                <input
                  type="text"
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Your answer"
                  style={{
                    width: "100%",
                    minHeight: "46px",
                    padding: "10px 14px",
                    border: "1px solid #898a82",
                    background: "#fff",
                  }}
                />
              )}

              {/* Long Text */}
              {q.questionType === "long_text" && (
                <textarea
                  rows={4}
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Your response..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #898a82",
                    background: "#fff",
                    resize: "vertical",
                  }}
                />
              )}

              {/* Rating (1 to 5) */}
              {q.questionType === "rating" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "8px",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = answers[q.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, val)}
                          style={{
                            minWidth: "54px",
                            minHeight: "54px",
                            border: isSelected ? "2px solid var(--signal, #d64a24)" : "1px solid #898a82",
                            background: isSelected ? "var(--signal, #d64a24)" : "#fff",
                            color: isSelected ? "#fff" : "var(--ink, #171814)",
                            fontSize: "18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "2px",
                          }}
                        >
                          <Star size={16} fill={isSelected ? "#fff" : "none"} strokeWidth={2} />
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      maxWidth: "320px",
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "var(--muted, #676860)",
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}
                  >
                    <span>1 = POOR</span>
                    <span>5 = EXCELLENT</span>
                  </div>
                </div>
              )}

              {/* Yes / No */}
              {q.questionType === "yes_no" && (
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  {["Yes", "No"].map((option) => {
                    const isSelected = answers[q.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleAnswerChange(q.id, option)}
                        style={{
                          flex: 1,
                          minHeight: "50px",
                          border: isSelected ? "2px solid var(--signal, #d64a24)" : "1px solid #898a82",
                          background: isSelected ? "var(--signal, #d64a24)" : "#fff",
                          color: isSelected ? "#fff" : "var(--ink, #171814)",
                          fontSize: "16px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice (Radio) */}
              {q.questionType === "multiple_choice" && (
                <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
                  {q.options.map((option, optIdx) => {
                    const isSelected = answers[q.id] === option;
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleAnswerChange(q.id, option)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "14px 16px",
                          border: isSelected ? "2px solid var(--signal, #d64a24)" : "1px solid #898a82",
                          background: isSelected ? "#fff8f6" : "#fff",
                          cursor: "pointer",
                          minHeight: "48px",
                        }}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(q.id, option)}
                          style={{ width: "18px", height: "18px", accentColor: "var(--signal, #d64a24)" }}
                        />
                        <span style={{ fontSize: "14px", fontWeight: isSelected ? 650 : 400 }}>
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Checkbox (Multi-select) */}
              {q.questionType === "checkbox" && (
                <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
                  {q.options.map((option, optIdx) => {
                    const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(option);
                    return (
                      <label
                        key={optIdx}
                        onClick={(e) => {
                          e.preventDefault();
                          handleCheckboxToggle(q.id, option);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "14px 16px",
                          border: isChecked ? "2px solid var(--signal, #d64a24)" : "1px solid #898a82",
                          background: isChecked ? "#fff8f6" : "#fff",
                          cursor: "pointer",
                          minHeight: "48px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ width: "18px", height: "18px", accentColor: "var(--signal, #d64a24)" }}
                        />
                        <span style={{ fontSize: "14px", fontWeight: isChecked ? 650 : 400 }}>
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          ))}

          {submitError && (
            <div className="form-alert" role="alert">
              {submitError}
            </div>
          )}

          <div style={{ marginTop: "12px" }}>
            <button
              type="submit"
              disabled={submitting}
              className="button button-primary submit-button"
              style={{ minHeight: "56px", fontSize: "16px", width: "100%" }}
            >
              {submitting ? "Submitting response..." : "Submit Survey"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
