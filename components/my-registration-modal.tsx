"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileBadge,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { EVENT } from "@/lib/event";

export type SessionInfo = { id?: string; title: string; slug: string };
export type AttendanceRecord = { session_id: string; status: string };
export type CertificateRecord = {
  session_id: string;
  certificate_number: string;
  status: string;
  issued_at: string | null;
};

export type RegistrationData = {
  id: string;
  full_name: string;
  email: string;
  affiliation: string;
  participant_category: string;
  created_at: string;
  registration_sessions?: {
    session_id: string;
    sessions?: SessionInfo | SessionInfo[] | null;
  }[];
  attendance?: AttendanceRecord[];
  certificates?: CertificateRecord[];
};

export type SurveyItem = {
  id: string;
  sessionId: string;
  sessionSlug?: string;
  title: string;
  publicSlug: string;
};

export default function MyRegistrationModal({
  isOpen,
  onClose,
  onTakeSurvey,
  initialRegistration = null,
  initialSurveys = [],
  initialCompletedSessions = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onTakeSurvey?: (slug: string) => void;
  initialRegistration?: RegistrationData | null;
  initialSurveys?: SurveyItem[];
  initialCompletedSessions?: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [registration, setRegistration] = useState<RegistrationData | null>(initialRegistration);
  const [surveys, setSurveys] = useState<SurveyItem[]>(initialSurveys);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set(initialCompletedSessions));

  // Sync initial props if updated by parent
  useEffect(() => {
    if (initialRegistration) {
      setRegistration(initialRegistration);
    }
    if (initialSurveys && initialSurveys.length > 0) {
      setSurveys(initialSurveys);
    }
    if (initialCompletedSessions && initialCompletedSessions.length > 0) {
      setCompletedSessions(new Set(initialCompletedSessions));
    }
  }, [initialRegistration, initialSurveys, initialCompletedSessions]);

  // Restore from sessionStorage cache if available for instant display
  useEffect(() => {
    if (registration) return;
    try {
      const cached = sessionStorage.getItem("ddt-verified-registration");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.registration) {
          setRegistration(parsed.registration);
          if (parsed.surveys) setSurveys(parsed.surveys);
          if (parsed.completedSurveySessionIds) {
            setCompletedSessions(new Set(parsed.completedSurveySessionIds));
          }
        }
      }
    } catch {}
  }, [registration]);

  // Close on Escape key and prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  // Fetch or revalidate registration details when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    // Only display spinner if we have no registration data to show yet
    if (!registration && !initialRegistration) {
      setLoading(true);
    }
    setLoadError("");

    fetch("/api/registration")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load registration details.");
        }
        return json;
      })
      .then((data) => {
        if (!isMounted) return;
        setRegistration(data.registration);
        setSurveys(data.surveys ?? []);
        setCompletedSessions(new Set(data.completedSurveySessionIds ?? []));
        try {
          sessionStorage.setItem("ddt-verified-registration", JSON.stringify(data));
        } catch {}
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!registration && !initialRegistration) {
          setLoadError(err.message || "Could not retrieve registration.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve session list
  const sessions: SessionInfo[] = (registration?.registration_sessions ?? []).flatMap((item) => {
    const s = item.sessions;
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  });

  const attendanceMap = new Map(
    (registration?.attendance ?? []).map((att) => [att.session_id, att.status])
  );

  const certificateMap = new Map(
    (registration?.certificates ?? []).map((cert) => [cert.session_id, cert])
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-registration-modal-title"
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--paper, #f1efe8)",
          border: "2px solid var(--ink, #171814)",
          borderTop: "6px solid var(--signal, #d64a24)",
          width: "100%",
          maxWidth: "760px",
          minWidth: 0,
          maxHeight: "min(96vh, 920px)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.35)",
          boxSizing: "border-box",
          margin: "auto",
        }}
      >
        {/* Top Header Bar */}
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
            <FileBadge size={18} style={{ color: "var(--signal, #d64a24)", flexShrink: 0 }} aria-hidden="true" />
            <span
              style={{
                font: "700 11px var(--font-geist-mono, monospace)",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "var(--signal, #d64a24)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Participant Record
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close registration dialog"
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

        {/* Scrollable Body */}
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
            <div style={{ padding: "40px 12px", textAlign: "center" }}>
              <LoaderCircle
                className="spin"
                size={36}
                style={{ color: "var(--signal, #d64a24)", margin: "0 auto 14px" }}
                aria-hidden="true"
              />
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "var(--ink, #171814)" }}>
                Loading your registration and certificate status...
              </p>
            </div>
          )}

          {!loading && loadError && (
            <div style={{ padding: "28px 14px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
              <AlertCircle size={36} style={{ color: "#a52b18", margin: "0 auto 12px" }} aria-hidden="true" />
              <h2 id="my-registration-modal-title" style={{ fontSize: "18px", margin: "0 0 10px" }}>
                Unable to Load Record
              </h2>
              <p style={{ color: "var(--muted, #676860)", margin: "0 auto 20px", maxWidth: "440px", fontSize: "13px" }}>
                {loadError}
              </p>
              <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px", width: "100%" }}>
                Close
              </button>
            </div>
          )}

          {!loading && !loadError && !registration && (
            <div style={{ padding: "28px 14px", textAlign: "center", background: "#fff", border: "1px solid var(--line, #c9c7bd)" }}>
              <ShieldCheck size={36} style={{ color: "var(--signal, #d64a24)", margin: "0 auto 12px" }} aria-hidden="true" />
              <h2 id="my-registration-modal-title" style={{ fontSize: "18px", margin: "0 0 10px" }}>
                No Registration Found
              </h2>
              <p style={{ color: "var(--muted, #676860)", margin: "0 auto 20px", maxWidth: "440px", fontSize: "13px" }}>
                Please sign in with your registered Google account to view your session and certificate details.
              </p>
              <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px", width: "100%" }}>
                Close
              </button>
            </div>
          )}

          {!loading && !loadError && registration && (
            <div style={{ boxSizing: "border-box", minWidth: 0, width: "100%" }}>
              <div style={{ marginBottom: "16px", minWidth: 0 }}>
                <span className="section-index" style={{ color: "var(--signal, #d64a24)", fontSize: "11px", display: "block" }}>
                  CONFIRMED PARTICIPANT
                </span>
                <h1
                  id="my-registration-modal-title"
                  style={{
                    fontSize: "clamp(20px, 5.5vw, 28px)",
                    margin: "4px 0 6px",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    overflowWrap: "anywhere",
                  }}
                >
                  My Registration
                </h1>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted, #676860)",
                    fontSize: "13px",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  Verified record under <strong>{registration.email}</strong>
                </p>
              </div>

              {/* Participant Details Grid: 320px responsive */}
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
                  gap: "8px",
                  margin: "12px 0 20px",
                  borderTop: "1px solid var(--line, #c9c7bd)",
                  paddingTop: "8px",
                  boxSizing: "border-box",
                  minWidth: 0,
                  width: "100%",
                }}
              >
                {[
                  { label: "Participant", value: registration.full_name },
                  { label: "Email", value: registration.email },
                  { label: "Affiliation", value: registration.affiliation },
                  { label: "Category", value: registration.participant_category?.replaceAll("_", " ") },
                  { label: "Event date", value: EVENT.date },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid var(--line, #c9c7bd)",
                      minWidth: 0,
                    }}
                  >
                    <dt
                      style={{
                        font: "500 10px var(--font-geist-mono, monospace)",
                        color: "var(--muted, #676860)",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.label}
                    </dt>
                    <dd
                      style={{
                        margin: "3px 0 0",
                        fontWeight: 650,
                        fontSize: "13px",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Session Status & Certificates Section */}
              <div style={{ marginTop: "20px", minWidth: 0, width: "100%" }}>
                <span className="section-index" style={{ fontSize: "11px", display: "block" }}>
                  SESSION STATUS &amp; E-CERTIFICATES
                </span>
                <h2 style={{ fontSize: "clamp(18px, 4.5vw, 22px)", margin: "4px 0 8px", lineHeight: 1.2 }}>
                  Session Status &amp; Certificates
                </h2>
                <p style={{ color: "var(--muted, #676860)", margin: "0 0 14px", fontSize: "12px", lineHeight: "1.45" }}>
                  Certificates require three verified criteria for each session: registration, verified present attendance,
                  and completion of the session feedback survey.
                </p>

                <div style={{ display: "grid", gap: "14px", minWidth: 0, width: "100%" }}>
                  {sessions.map((session, index) => {
                    const sessionId = session.id ?? "";
                    const status = sessionId ? attendanceMap.get(sessionId) : undefined;
                    const isPresent = status === "present";
                    const isAbsent = status === "absent";
                    const surveyDone = sessionId ? completedSessions.has(sessionId) : false;
                    const matchingSurvey = surveys.find(
                      (s) =>
                        (sessionId && s.sessionId === sessionId) ||
                        (s.publicSlug.includes("session-1") && index === 0) ||
                        (s.publicSlug.includes("session-2") && index === 1)
                    );
                    const cert = isPresent && surveyDone && sessionId ? certificateMap.get(sessionId) : null;
                    const isEligible = isPresent && surveyDone;

                    return (
                      <article
                        key={session.id || index}
                        style={{
                          padding: "clamp(10px, 3vw, 16px)",
                          border: "1px solid var(--line, #c9c7bd)",
                          background: "#fff",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          boxSizing: "border-box",
                          minWidth: 0,
                          width: "100%",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: "14px" }}>Session 0{index + 1}</span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 7px",
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
                              whiteSpace: "normal",
                            }}
                          >
                            {cert
                              ? "Certificate Available"
                              : isEligible
                              ? "Certificate Eligible"
                              : "Certificate Pending"}
                          </span>
                        </div>

                        <h3 style={{ margin: 0, fontSize: "15px", lineHeight: "1.3", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                          {session.title}
                        </h3>

                        {/* 3 Checkpoints: Clean vertical stack on narrow mobile, 3-col on desktop */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
                            gap: "8px",
                            padding: "10px",
                            background: "#faf9f5",
                            border: "1px solid var(--line, #ddd)",
                            boxSizing: "border-box",
                            minWidth: 0,
                            width: "100%",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "10px", color: "var(--muted, #676860)", display: "block" }}>
                              REGISTRATION
                            </span>
                            <strong style={{ color: "var(--green, #2d6139)", fontSize: "12px", display: "block" }}>
                              ✓ Confirmed
                            </strong>
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "10px", color: "var(--muted, #676860)", display: "block" }}>
                              ATTENDANCE
                            </span>
                            <strong
                              style={{
                                color: isPresent
                                  ? "var(--green, #2d6139)"
                                  : isAbsent
                                  ? "#a52b18"
                                  : "var(--muted, #676860)",
                                fontSize: "12px",
                                display: "block",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {isPresent
                                ? "✓ Present"
                                : isAbsent
                                ? "✗ Absent"
                                : "Pending check-in"}
                            </strong>
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: "10px", color: "var(--muted, #676860)", display: "block" }}>
                              SURVEY
                            </span>
                            <strong
                              style={{
                                color: surveyDone ? "var(--green, #2d6139)" : "var(--signal, #d64a24)",
                                fontSize: "12px",
                                display: "block",
                              }}
                            >
                              {surveyDone ? "✓ Completed" : "Not completed"}
                            </strong>
                          </div>
                        </div>

                        {/* Certificate Actions or CTA */}
                        {cert ? (
                          <div
                            style={{
                              padding: "10px 12px",
                              background: "#f8f6ef",
                              border: "1px solid var(--line, #ddd)",
                              borderLeft: "4px solid var(--signal, #d64a24)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              boxSizing: "border-box",
                              minWidth: 0,
                              width: "100%",
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontSize: "10px", color: "var(--muted, #666)", display: "block" }}>
                                CERTIFICATE ID
                              </span>
                              <strong
                                style={{
                                  fontFamily: "var(--font-geist-mono, monospace)",
                                  fontSize: "12px",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-all",
                                  display: "block",
                                }}
                              >
                                {cert.certificate_number}
                              </strong>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
                              <a
                                className="button button-primary"
                                href={`/api/certificates/${cert.certificate_number}`}
                                style={{ padding: "8px 12px", fontSize: "12px", minHeight: "44px", flex: "1 1 110px", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                Download PDF
                              </a>
                              <a
                                className="button"
                                href={`/verify/${cert.certificate_number}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: "8px 12px", fontSize: "12px", minHeight: "44px", flex: "1 1 70px", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                Verify
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, width: "100%" }}>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted, #666)", lineHeight: 1.45, minWidth: 0, overflowWrap: "anywhere" }}>
                              {!isPresent
                                ? isAbsent
                                  ? "Marked absent. Verified attendance is required to take the feedback survey."
                                  : "Attendance check-in required. Survey unlocks once you are marked present."
                                : !surveyDone
                                ? "Complete survey to unlock your certificate."
                                : "Requirements satisfied. Generating certificate..."}
                            </p>

                            {!surveyDone && matchingSurvey && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (onTakeSurvey) {
                                    onTakeSurvey(matchingSurvey.publicSlug);
                                  }
                                }}
                                className={`button ${isPresent ? "button-primary" : ""}`}
                                style={{
                                  padding: "10px 14px",
                                  fontSize: "13px",
                                  minHeight: "44px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  width: "100%",
                                }}
                              >
                                {isPresent ? "Complete Survey" : "Check Survey"} <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: "20px", display: "flex" }}>
                <button onClick={onClose} className="button button-primary" style={{ minHeight: "44px", width: "100%" }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
