import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import RegistrationForm from "@/components/registration-form";

export default function RegistrationHome() {
  return <main className="registration-page">
    <header className="registration-header shell"><div><strong>Deepfakes &amp; Digital Trust</strong><span>October 11, 2026</span></div><a href="/verify">Verify certificate</a></header>
    <section className="registration-direct shell" aria-labelledby="registration-title">
      <aside className="event-poster-panel">
        <Image src="/images/1.png" alt="Deepfakes and Digital Trust webinar poster with event schedule and organizer marks" width={1080} height={1350} priority sizes="(max-width: 900px) 100vw, 42vw" />
        <div className="direct-summary"><span className="section-index">REGISTRATION / OPEN</span><h1 id="registration-title">Register for the Webinar</h1><p>Join us to learn how to identify manipulated AI-generated media and verify online information.</p>
          <div className="direct-session"><b>Session 01</b><span>Deepfakes in Everyday Social Media</span><strong>8:00 AM - 1:00 PM</strong></div>
          <div className="direct-session"><b>Session 02</b><span>Deepfakes in the Workplace and School</span><strong>2:00 PM - 7:00 PM</strong></div>
          <p className="direct-note"><ShieldCheck aria-hidden="true" /> Select one or both sessions. Separate e-certificates are provided for each session attended.</p>
        </div>
      </aside>
      <RegistrationForm />
    </section>
    <footer className="registration-footer shell"><span>Gordon College · College of Computer Studies</span><div><a href="/verify">Certificate verification</a><a href="/admin">Admin login</a></div></footer>
  </main>;
}

