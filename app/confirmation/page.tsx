"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { EVENT } from "@/lib/event";

import MyRegistrationModal from "@/components/my-registration-modal";
import SurveyPopupModal from "@/components/survey-popup-modal";

type Saved = { fullName:string; email:string; affiliation:string; participantCategory:string; sessions:string[]; emailDelivered?:boolean };
export default function ConfirmationPage() {
  const [data,setData]=useState<Saved|null>(null);
  const [activeSurveySlug, setActiveSurveySlug] = useState<string | null>(null);
  const [isMyRegOpen, setIsMyRegOpen] = useState(false);

  useEffect(()=>{ const value=sessionStorage.getItem("ddt-registration"); if(value) setData(JSON.parse(value)); },[]);
  const isSession1 = data?.sessions?.includes("deepfakes-social-media");
  const isSession2 = data?.sessions?.includes("deepfakes-workplace");

  return (
    <main className="standalone">
      <section className="receipt">
        <div className="receipt-mark">
          <CheckCircle2 aria-hidden="true" />
        </div>
        <span className="section-index">REGISTRATION / CONFIRMED</span>
        <h1>Registration Confirmed</h1>
        <p>Your registration has been successfully recorded.</p>
        {data ? (
          <dl className="receipt-grid">
            <div>
              <dt>Participant</dt>
              <dd>{data.fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{data.email}</dd>
            </div>
            <div>
              <dt>Affiliation</dt>
              <dd>{data.affiliation}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{data.participantCategory.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Event date</dt>
              <dd>{EVENT.date}</dd>
            </div>
            <div>
              <dt>Selected sessions</dt>
              <dd>
                {data.sessions
                  .map((key) => EVENT.sessions.find((item) => item.key === key)?.title)
                  .join(", ")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="empty-state">Registration details are available from your account.</p>
        )}
        <p className="receipt-note">
          The Google Meet link will be sent to your email.
        </p>
        <div className="receipt-actions" style={{ flexWrap: "wrap", gap: "10px" }}>
          {isSession1 && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setActiveSurveySlug("session-1-feedback-social")}
            >
              Take Session 01 Survey
            </button>
          )}
          {isSession2 && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setActiveSurveySlug("session-2-feedback-workplace")}
            >
              Take Session 02 Survey
            </button>
          )}
          {!isSession1 && !isSession2 && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setActiveSurveySlug("session-1-feedback-social")}
            >
              Take Post-Session Survey
            </button>
          )}
          <button
            type="button"
            className="button"
            onClick={() => setIsMyRegOpen(true)}
          >
            View My Registration &amp; Certificates
          </button>
          <a className="button" href="/">
            Return to event page
          </a>
        </div>
      </section>

      {/* Popups */}
      <SurveyPopupModal
        slug={activeSurveySlug}
        onClose={() => setActiveSurveySlug(null)}
      />

      <MyRegistrationModal
        isOpen={isMyRegOpen}
        onClose={() => setIsMyRegOpen(false)}
        onTakeSurvey={(slug) => {
          setActiveSurveySlug(slug);
        }}
      />
    </main>
  );
}

