import Image from "next/image";
import { Mail, ShieldCheck } from "lucide-react";
import posterImage from "@/public/images/1.png";
import RegistrationForm from "@/components/registration-form";
import { createClient } from "@/lib/supabase/server";
import { getPublishedSurveysSummary, getCompletedSurveySessionIds } from "@/lib/surveys";

import { EVENT } from "@/lib/event";

export default async function RegistrationHome() {
  let initialUser: { id: string; email: string; name?: string } | null = null;
  let initialRegistration = null;
  let initialSurveys: any[] = [];
  let initialCompletedSessions: string[] = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        initialUser = {
          id: user.id,
          email: user.email ?? "",
          name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
        };

        const [regResult, surveys] = await Promise.all([
          supabase
            .from("registrations")
            .select("*, registration_sessions(session_id, sessions(*)), attendance(session_id, status), certificates(session_id, certificate_number, status, issued_at)")
            .eq("user_id", user.id)
            .maybeSingle(),
          getPublishedSurveysSummary(),
        ]);

        initialRegistration = regResult.data ?? null;
        initialSurveys = surveys;

        if (initialRegistration?.id) {
          const completedSet = await getCompletedSurveySessionIds(initialRegistration.id);
          initialCompletedSessions = Array.from(completedSet);
        }
      }
    }
  } catch {
    // Graceful fallback to client-side hydration
  }

  return (
    <main className="registration-page">
      <header className="registration-header shell">
        <div>
          <strong>Deepfakes &amp; Digital Trust</strong>
          <span>{EVENT.date}</span>
        </div>
        <a href="/verify">Verify certificate</a>
      </header>
      <section className="registration-direct shell" aria-labelledby="registration-title">
        <aside className="event-poster-panel">
          <Image
            src={posterImage}
            alt="Deepfakes and Digital Trust webinar poster with event schedule and organizer marks"
            priority
            sizes="(max-width: 900px) 100vw, 42vw"
            placeholder="blur"
          />
          <div className="direct-summary">
            <span className="section-index">REGISTRATION / OPEN</span>
            <h1 id="registration-title">Register for the Webinar</h1>
            <p>Join us to learn how to identify manipulated AI-generated media and verify online information.</p>
            <div className="direct-session">
              <b>Session 01</b>
              <span>Deepfakes in Everyday Social Media</span>
              <strong>8:00 AM - 1:00 PM</strong>
            </div>
            <div className="direct-session">
              <b>Session 02</b>
              <span>Deepfakes in the Workplace and School</span>
              <strong>2:00 PM - 7:00 PM</strong>
            </div>
            <p className="direct-note">
              <Mail aria-hidden="true" /> The Google Meet link will be sent to your email.
            </p>
            <p className="direct-note">
              <ShieldCheck aria-hidden="true" /> Select one or both sessions. Separate e-certificates are provided for each session attended.
            </p>
          </div>
        </aside>
        <RegistrationForm
          initialUser={initialUser}
          initialRegistration={initialRegistration}
          initialSurveys={initialSurveys}
          initialCompletedSessions={initialCompletedSessions}
          serverChecked={true}
        />
      </section>
      <footer className="registration-footer shell">
        <span>Gordon College · College of Computer Studies</span>
        <div>
          <a href="/verify">Certificate verification</a>
          <a href="/admin">Admin login</a>
        </div>
      </footer>
    </main>
  );
}
