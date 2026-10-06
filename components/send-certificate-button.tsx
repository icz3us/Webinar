"use client";
import { useState } from "react";
export default function SendCertificateButton({certificateId}:{certificateId:string}){const[busy,setBusy]=useState(false);const[sent,setSent]=useState(false);async function send(){setBusy(true);const response=await fetch("/api/admin/certificate-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({certificateId})});const data=await response.json();setBusy(false);if(response.ok)setSent(true);else alert(data.error??"Certificate email could not be sent.")}return <button className="table-action" disabled={busy||sent} onClick={send}>{sent?"Sent":busy?"Sending...":"Email"}</button>}

