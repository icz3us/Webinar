"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { EVENT } from "@/lib/event";

type Saved = { fullName:string; email:string; affiliation:string; participantCategory:string; sessions:string[]; emailDelivered?:boolean };
export default function ConfirmationPage() {
  const [data,setData]=useState<Saved|null>(null);
  useEffect(()=>{ const value=sessionStorage.getItem("ddt-registration"); if(value) setData(JSON.parse(value)); },[]);
  return <main className="standalone"><section className="receipt"><div className="receipt-mark"><CheckCircle2 aria-hidden="true" /></div><span className="section-index">REGISTRATION / CONFIRMED</span><h1>Registration Confirmed</h1><p>Your registration has been successfully recorded.</p>{data ? <dl className="receipt-grid"><div><dt>Participant</dt><dd>{data.fullName}</dd></div><div><dt>Email</dt><dd>{data.email}</dd></div><div><dt>Affiliation</dt><dd>{data.affiliation}</dd></div><div><dt>Category</dt><dd>{data.participantCategory.replaceAll("_"," ")}</dd></div><div><dt>Event date</dt><dd>{EVENT.date}</dd></div><div><dt>Selected sessions</dt><dd>{data.sessions.map((key)=>EVENT.sessions.find((item)=>item.key===key)?.title).join(", ")}</dd></div></dl> : <p className="empty-state">Registration details are available from your account.</p>}<p className="receipt-note">Zoom access information will be sent to your registered email when it is available.{data?.emailDelivered === false ? " Email delivery is not configured yet, so no email has been sent." : ""}</p><div className="receipt-actions"><a className="button button-primary" href="/my-registration">View My Registration</a><a className="button" href="/">Return to event page</a></div></section></main>;
}

