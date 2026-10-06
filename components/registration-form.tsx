"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EVENT } from "@/lib/event";
import { registrationSchema, type RegistrationInput } from "@/lib/validation";

type ExistingRegistration = {
  id: string;
  full_name: string;
  email: string;
  affiliation: string;
  participant_category: string;
  created_at: string;
  registration_sessions?: {
    session_id: string;
    sessions?: { title: string; slug: string } | { title: string; slug: string }[] | null;
  }[];
};

export default function RegistrationForm() {
  const supabase = useMemo(() => createClient(), []);
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(!supabase);
  const [existingRegistration, setExistingRegistration] = useState<ExistingRegistration | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      fullName: "",
      affiliation: "",
      participantCategory: "student",
      otherCategory: "",
      sessions: [],
      privacyConsent: false,
    },
  });

  const category = watch("participantCategory");

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user?.email) {
        setAuthenticated(true);
        setValue("email", data.user.email);
        const name = data.user.user_metadata?.full_name;
        if (typeof name === "string") setValue("fullName", name);

        // Check if user already has a registration
        try {
          const res = await fetch("/api/registration");
          const json = await res.json();
          if (json?.registration) {
            setExistingRegistration(json.registration);
          }
        } catch {
          // ignore
        }
      }
      setAuthReady(true);
    });
  }, [setValue, supabase]);

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
    window.location.assign("/confirmation");
  }

  // View 1: Already registered user
  if (authenticated && existingRegistration) {
    const chosenSessions = (existingRegistration.registration_sessions ?? []).flatMap((item) => {
      const s = item.sessions;
      if (!s) return [];
      return Array.isArray(s) ? s.map((x) => x.title) : [s.title];
    });

    return (
      <div className="registration-form-wrap reveal">
        <div className="form-status-line">
          <span>STATUS / CONFIRMED</span>
          <span className="live-indicator">ACTIVE REGISTRATION</span>
        </div>
        <div className="auth-gate" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "var(--green, #2d6139)" }}>
            <CheckCircle2 size={24} aria-hidden="true" />
            <span style={{ font: "700 11px var(--font-geist-mono, monospace)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              Registration Verified
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

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "24px" }}>
            <a className="button button-primary" href="/my-registration">
              View My Registration &amp; Certificates
            </a>
            <button className="button" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
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
          <p>Your verified email will be used for the Zoom link and e-certificate.</p>
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
            description="Please provide an active email where we will send the Zoom link and your e-certificate."
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
