"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EVENT } from "@/lib/event";
import { registrationSchema, type RegistrationInput } from "@/lib/validation";
import SurveyPopupModal from "@/components/survey-popup-modal";
import MyRegistrationModal, {
  type RegistrationData as ExistingRegistration,
  type SurveyItem as AvailableSurvey,
} from "@/components/my-registration-modal";

type RegistrationFormProps = {
  initialUser?: { id: string; email: string; name?: string } | null;
  initialRegistration?: ExistingRegistration | null;
  initialSurveys?: AvailableSurvey[];
  initialCompletedSessions?: string[];
  serverChecked?: boolean;
};

export default function RegistrationForm({
  initialUser = null,
  initialRegistration = null,
  initialSurveys = [],
  initialCompletedSessions = [],
  serverChecked = true,
}: RegistrationFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [authReady, setAuthReady] = useState(Boolean(serverChecked || initialUser || initialRegistration || !supabase));
  const [authenticated, setAuthenticated] = useState(Boolean(initialUser || initialRegistration || !supabase));
  const [existingRegistration, setExistingRegistration] = useState<ExistingRegistration | null>(initialRegistration);
  const [availableSurveys, setAvailableSurveys] = useState<AvailableSurvey[]>(initialSurveys);
  const [completedSurveySessionIds, setCompletedSurveySessionIds] = useState<string[]>(initialCompletedSessions);
  const [errorMessage, setErrorMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [activeSurveySlug, setActiveSurveySlug] = useState<string | null>(null);
  const [isMyRegistrationOpen, setIsMyRegistrationOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: initialUser?.email || initialRegistration?.email || "",
      fullName: initialUser?.name || initialRegistration?.full_name || "",
      affiliation: initialRegistration?.affiliation || "",
      participantCategory: (initialRegistration?.participant_category as any) || "student",
      otherCategory: "",
      sessions: [],
      privacyConsent: false,
    },
  });

  const category = watch("participantCategory");

  // Immediate cache check from sessionStorage for instant render on back/refresh
  useEffect(() => {
    if (existingRegistration) return;
    try {
      const cached = sessionStorage.getItem("ddt-verified-registration");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.registration) {
          setExistingRegistration(parsed.registration);
          setAuthenticated(true);
          setAuthReady(true);
          if (parsed.surveys) setAvailableSurveys(parsed.surveys);
          if (parsed.completedSurveySessionIds) {
            setCompletedSurveySessionIds(parsed.completedSurveySessionIds);
          }
        }
      }
    } catch {}
  }, [existingRegistration]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    // If server already provided initialRegistration, skip redundant network roundtrips
    if (initialRegistration) {
      setAuthReady(true);
      return;
    }

    // Subscribe to auth state changes for immediate responsive state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        setAuthenticated(true);
        setValue("email", session.user.email);
        const name = session.user.user_metadata?.full_name;
        if (typeof name === "string") setValue("fullName", name);

        // Fetch registration data in background if not already available
        if (!existingRegistration) {
          try {
            const res = await fetch("/api/registration");
            const json = await res.json();
            if (json?.registration) {
              setExistingRegistration(json.registration);
              try {
                sessionStorage.setItem("ddt-verified-registration", JSON.stringify(json));
              } catch {}
            }
            if (json?.surveys) setAvailableSurveys(json.surveys);
            if (json?.completedSurveySessionIds) {
              setCompletedSurveySessionIds(json.completedSurveySessionIds);
            }
          } catch {}
        }
      } else if (event === "SIGNED_OUT") {
        setAuthenticated(false);
        setExistingRegistration(null);
      }
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [existingRegistration, initialRegistration, setValue, supabase]);

  async function signIn() {
    if (!supabase) return setAuthenticated(true);
    if (signingIn) return;
    setSigningIn(true);
    setErrorMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/#register` },
    });
    if (error) {
      setErrorMessage("Google sign-in could not be started. Please try again.");
      setSigningIn(false);
    }
  }

  async function signOut() {
    try {
      sessionStorage.removeItem("ddt-verified-registration");
      sessionStorage.removeItem("ddt-registration");
    } catch {}
    if (supabase) await supabase.auth.signOut();
    setAuthenticated(false);
    setExistingRegistration(null);
    setValue("email", "");
    setValue("fullName", "");
    window.location.reload();
  }

  async function submit(values: RegistrationInput) {
    setErrorMessage("");
    const response = await fetch("/api/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) {
        // Already registered: fetch their details and display confirmation card
        try {
          const checkRes = await fetch("/api/registration");
          const checkJson = await checkRes.json();
          if (checkJson?.registration) {
            setExistingRegistration(checkJson.registration);
            try {
              sessionStorage.setItem("ddt-verified-registration", JSON.stringify(checkJson));
            } catch {}
            if (checkJson?.surveys) {
              setAvailableSurveys(checkJson.surveys);
            }
            if (checkJson?.completedSurveySessionIds) {
              setCompletedSurveySessionIds(checkJson.completedSurveySessionIds);
            }
            return;
          }
        } catch {
          // ignore
        }
      }
      return setErrorMessage(result.error ?? "Registration could not be completed.");
    }
    sessionStorage.setItem(
      "ddt-registration",
      JSON.stringify({
        ...values,
        id: result.registrationId ?? result.registration?.id,
        emailDelivered: result.emailDelivered,
      })
    );
    try {
      sessionStorage.setItem(
        "ddt-verified-registration",
        JSON.stringify({
          registration: {
            id: result.registrationId ?? result.registration?.id,
            full_name: values.fullName,
            email: values.email,
            affiliation: values.affiliation,
            participant_category: values.participantCategory,
            created_at: new Date().toISOString(),
            registration_sessions: values.sessions.map((s) => ({
              session_id: s,
              sessions: { title: s, slug: s },
            })),
          },
          surveys: availableSurveys,
          completedSurveySessionIds: [],
        })
      );
    } catch {}
    router.push("/confirmation");
  }

  // View 1: Already registered user
  if (authenticated && existingRegistration) {
    const chosenSessions = (existingRegistration.registration_sessions ?? []).flatMap((item) => {
      const s = item.sessions;
      if (!s) return [];
      return Array.isArray(s) ? s.map((x) => x.title) : [s.title];
    });

    const userSessionSlugs = (existingRegistration.registration_sessions ?? []).flatMap((item) => {
      const s = item.sessions;
      if (!s) return [];
      return Array.isArray(s) ? s.map((x) => x.slug) : [s.slug];
    });

    const isRegSession1 =
      userSessionSlugs.includes("deepfakes-social-media") ||
      userSessionSlugs.includes("session-1") ||
      chosenSessions.some((c) => c.toLowerCase().includes("session 01") || c.toLowerCase().includes("session 1"));
    const isRegSession2 =
      userSessionSlugs.includes("deepfakes-workplace") ||
      userSessionSlugs.includes("session-2") ||
      chosenSessions.some((c) => c.toLowerCase().includes("session 02") || c.toLowerCase().includes("session 2"));

    // Explicitly locate the respective survey for each session
    const session1Survey = availableSurveys.find(
      (s) =>
        s.publicSlug === "session-1-feedback-social" ||
        s.publicSlug.includes("session-1") ||
        s.sessionSlug === "deepfakes-social-media" ||
        s.sessionSlug === "session-1" ||
        s.title.toLowerCase().includes("session 1")
    );

    const session2Survey = availableSurveys.find(
      (s) =>
        s.publicSlug === "session-2-feedback-workplace" ||
        s.publicSlug.includes("session-2") ||
        s.sessionSlug === "deepfakes-workplace" ||
        s.sessionSlug === "session-2" ||
        s.title.toLowerCase().includes("session 2")
    );

    const session1Slug = session1Survey?.publicSlug || "session-1-feedback-social";
    const session2Slug = session2Survey?.publicSlug || "session-2-feedback-workplace";

    const surveyButtons: { label: string; slug: string }[] = [];
    if (isRegSession1) {
      surveyButtons.push({
        label: "Take Session 01 Survey",
        slug: session1Slug,
      });
    }
    if (isRegSession2) {
      surveyButtons.push({
        label: "Take Session 02 Survey",
        slug: session2Slug,
      });
    }
    if (surveyButtons.length === 0) {
      surveyButtons.push(
        { label: "Take Session 01 Survey", slug: session1Slug },
        { label: "Take Session 02 Survey", slug: session2Slug }
      );
    }

    return (
      <div className="registration-form-wrap reveal">
        <div className="form-status-line">
          <span>STATUS / CONFIRMED</span>
          <span className="live-indicator">ACTIVE REGISTRATION</span>
        </div>
        <div className="auth-gate" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--green, #2d6139)" }}>
              <CheckCircle2 size={24} aria-hidden="true" />
              <span style={{ font: "700 11px var(--font-geist-mono, monospace)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                Registration Verified
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                padding: "4px 8px",
                background: "#fff2ee",
                color: "var(--signal, #d64a24)",
                border: "1px solid #ffd4c7",
              }}
            >
              Survey Required for Certificate
            </span>
          </div>

          <h3 style={{ margin: "0 0 10px", fontSize: "24px" }}>You have already registered for this event</h3>
          <p style={{ margin: "0 0 20px", color: "var(--muted, #666)" }}>
            Your registration is confirmed under <strong>{existingRegistration.email}</strong>. You do not need to register again.
          </p>

          <dl className="receipt-grid" style={{ margin: "20px 0" }}>
            <div>
              <dt>Participant</dt>
              <dd>{existingRegistration.full_name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{existingRegistration.email}</dd>
            </div>
            <div>
              <dt>Affiliation</dt>
              <dd>{existingRegistration.affiliation}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{existingRegistration.participant_category?.replaceAll("_", " ")}</dd>
            </div>
            {chosenSessions.length > 0 && (
              <div style={{ gridColumn: "1 / -1" }}>
                <dt>Selected Sessions</dt>
                <dd>{chosenSessions.join(" + ")}</dd>
              </div>
            )}
          </dl>

          <div
            style={{
              padding: "clamp(14px, 3vw, 20px) clamp(12px, 3vw, 24px)",
              background: "#fff",
              border: "1px solid var(--line, #c9c7bd)",
              borderLeft: "5px solid var(--signal, #d64a24)",
              margin: "20px 0",
              boxSizing: "border-box",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", minWidth: 0 }}>
              <div style={{ maxWidth: "440px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <ClipboardCheck size={20} style={{ color: "var(--signal, #d64a24)", flexShrink: 0 }} aria-hidden="true" />
                  <strong style={{ fontSize: "16px", color: "var(--ink, #171814)", overflowWrap: "anywhere" }}>
                    Post-Session Feedback Survey
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted, #676860)", lineHeight: 1.5, overflowWrap: "anywhere" }}>
                  Survey completion is required alongside verified attendance to qualify for your official e-certificate.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%" }}>
                {surveyButtons.map((btn) => (
                  <button
                    key={btn.slug}
                    type="button"
                    onClick={() => setActiveSurveySlug(btn.slug)}
                    className="button button-primary"
                    style={{ minHeight: "44px", padding: "10px 14px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", flex: "1 1 200px", width: "100%" }}
                  >
                    <ClipboardCheck size={16} aria-hidden="true" />
                    <span>{btn.label}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
            <button
              type="button"
              className="button"
              onClick={() => setIsMyRegistrationOpen(true)}
              style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", cursor: "pointer" }}
            >
              View My Registration &amp; Certificates
            </button>
            <button className="button" type="button" onClick={signOut} style={{ minHeight: "44px" }}>
              Sign out
            </button>
          </div>

          {/* Post-Session Survey Popup Modal */}
          <SurveyPopupModal
            slug={activeSurveySlug}
            onClose={() => setActiveSurveySlug(null)}
            onSubmitted={() => {
              fetch("/api/registration")
                .then((r) => r.json())
                .then((json) => {
                  if (json?.registration) setExistingRegistration(json.registration);
                  if (json?.surveys) setAvailableSurveys(json.surveys);
                  if (json?.completedSurveySessionIds) {
                    setCompletedSurveySessionIds(json.completedSurveySessionIds);
                  }
                  try {
                    sessionStorage.setItem("ddt-verified-registration", JSON.stringify(json));
                  } catch {}
                })
                .catch(() => {});
            }}
          />

          {/* My Registration & Certificates Popup Modal */}
          <MyRegistrationModal
            isOpen={isMyRegistrationOpen}
            onClose={() => setIsMyRegistrationOpen(false)}
            initialRegistration={existingRegistration}
            initialSurveys={availableSurveys}
            initialCompletedSessions={completedSurveySessionIds}
            onTakeSurvey={(slug) => {
              setActiveSurveySlug(slug);
            }}
          />
        </div>
      </div>
    );
  }

  // View 0: Initial verifying loading state (prevents flashing blank registration form)
  if (!authReady && !existingRegistration) {
    return (
      <div className="registration-form-wrap reveal">
        <div className="form-status-line">
          <span>STATUS / VERIFYING</span>
          <span className="live-indicator">ACTIVE SESSION</span>
        </div>
        <div
          className="auth-gate"
          style={{
            minHeight: "240px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <LoaderCircle className="spin" size={32} style={{ color: "var(--signal, #d64a24)" }} aria-hidden="true" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground, #171814)" }}>
            Checking registration status...
          </span>
        </div>
      </div>
    );
  }

  // View 2: Not authenticated
  if (!authenticated) {
    return (
      <div className="registration-form-wrap reveal">
        <div className="form-status-line">
          <span>FORM / REG-2026</span>
          <span className="live-indicator">SECURE SESSION</span>
        </div>
        <div className="auth-gate">
          <span className="form-step">00 / VERIFY EMAIL</span>
          <h3>Begin with your Google account</h3>
          <p>Your verified email will be used for the Google Meet link and e-certificate.</p>
          <button
            className="button google-button"
            type="button"
            onClick={signIn}
            disabled={!authReady || signingIn}
          >
            {signingIn ? "Connecting to Google..." : "Continue with Google"}
          </button>
          {errorMessage && (
            <p className="form-alert" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // View 3: Authenticated and ready to register
  return (
    <div className="registration-form-wrap reveal">
      <div className="form-status-line">
        <span>FORM / REG-2026</span>
        <span className="live-indicator">SECURE SESSION</span>
      </div>
      <form onSubmit={handleSubmit(submit)} noValidate>
        {!supabase && (
          <p className="demo-notice">
            Demo mode: connect Supabase in <code>.env.local</code> to enable Google authentication and persistent storage.
          </p>
        )}
        <fieldset>
          <legend>
            <span>01</span> Identity
          </legend>
          <FormField
            label="Email Address"
            description="Please provide an active email where we will send the Google Meet link and e-certificate."
            error={errors.email?.message}
          >
            <input
              type="email"
              autoComplete="email"
              readOnly={Boolean(supabase)}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>
          <FormField
            label="Full Name"
            description="Type your name exactly as you want it to appear on your certificate (e.g., Juan Dela Cruz)."
            error={errors.fullName?.message}
          >
            <input
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
          </FormField>
        </fieldset>
        <fieldset>
          <legend>
            <span>02</span> Affiliation
          </legend>
          <FormField
            label="Affiliation / Institution / Company"
            description="If you are a student, please put your school (e.g., Gordon College)."
            error={errors.affiliation?.message}
          >
            <input
              autoComplete="organization"
              aria-invalid={Boolean(errors.affiliation)}
              {...register("affiliation")}
            />
          </FormField>
          <FormField label="Participant Category" error={errors.participantCategory?.message}>
            <select {...register("participantCategory")}>
              <option value="student">Student</option>
              <option value="educator">Faculty/Educator</option>
              <option value="it_professional">IT Professional</option>
              <option value="general_public">General Public</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          {category === "other" && (
            <FormField label="Please specify" error={errors.otherCategory?.message}>
              <input {...register("otherCategory")} />
            </FormField>
          )}
        </fieldset>
        <fieldset>
          <legend>
            <span>03</span> Session
          </legend>
          <p className="field-label">Which session(s) will you attend?</p>
          <div className="session-options">
            {EVENT.sessions.map((session) => (
              <label className="session-option" key={session.key}>
                <input type="checkbox" value={session.key} {...register("sessions")} />
                <span className="custom-check">
                  <Check aria-hidden="true" />
                </span>
                <span>
                  <b>Session {session.number}</b>
                  <strong>{session.title}</strong>
                  <small>{session.time}</small>
                </span>
              </label>
            ))}
          </div>
          {errors.sessions && (
            <p className="field-error" role="alert">
              {errors.sessions.message}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>
            <span>04</span> Consent
          </legend>
          <label className="consent-option">
            <input type="checkbox" {...register("privacyConsent")} />
            <span className="custom-check">
              <Check aria-hidden="true" />
            </span>
            <span>
              I consent to the collection and processing of my personal information for the purpose of registration, attendance tracking, and certificate issuance for this event.
            </span>
          </label>
          {errors.privacyConsent && (
            <p className="field-error" role="alert">
              {errors.privacyConsent.message}
            </p>
          )}
        </fieldset>
        {errorMessage && (
          <p className="form-alert" role="alert">
            {errorMessage}
          </p>
        )}
        <button className="button button-primary submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="spin" aria-hidden="true" /> Recording registration
            </>
          ) : (
            "Confirm my registration"
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span className="field-label">{label}</span>
      {description && <small>{description}</small>}
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
