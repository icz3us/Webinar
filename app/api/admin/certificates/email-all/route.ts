import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { emailLayout, escapeHtml } from "@/lib/email-html";
import { hasUserSubmittedSurvey } from "@/lib/surveys";

type CertificateBundleItem = {
  number: string;
  sessionTitle: string;
  certificateUrl: string;
  verifyUrl: string;
};

type GroupedRecipient = {
  fullName: string;
  email: string;
  certificates: CertificateBundleItem[];
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body?.sessionId === "string" && body.sessionId !== "all" ? body.sessionId : undefined;

  const supabase = await createClient();
  const admin = createAdminClient() ?? supabase;
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !["admin", "staff"].includes(user.app_metadata?.role)) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }

  // 1. Fetch present attendance records
  let attQuery = admin
    .from("attendance")
    .select("registration_id, session_id, status")
    .eq("status", "present");

  if (sessionId) {
    attQuery = attQuery.eq("session_id", sessionId);
  }

  const { data: attendance, error: attError } = await attQuery;
  if (attError) {
    return NextResponse.json({ error: "Attendance records could not be loaded." }, { status: 500 });
  }

  // 2. Fetch existing certificates
  let certQuery = admin
    .from("certificates")
    .select("id, certificate_number, registration_id, session_id, status")
    .neq("status", "revoked");

  if (sessionId) {
    certQuery = certQuery.eq("session_id", sessionId);
  }

  const { data: existingCerts, error: certError } = await certQuery;
  if (certError) {
    return NextResponse.json({ error: "Certificates could not be loaded." }, { status: 500 });
  }

  // 3. Auto-generate missing certificates ONLY for attendees who are present AND completed the survey
  const existingSet = new Set((existingCerts ?? []).map((c) => `${c.registration_id}:${c.session_id}`));
  const missingCandidates = (attendance ?? []).filter((a) => !existingSet.has(`${a.registration_id}:${a.session_id}`));

  const newRows: {
    registration_id: string;
    session_id: string;
    generated_by: string;
    status: string;
    issued_at: string;
  }[] = [];

  for (const row of missingCandidates) {
    const surveyDone = await hasUserSubmittedSurvey(row.registration_id, row.session_id);
    if (surveyDone) {
      newRows.push({
        registration_id: row.registration_id,
        session_id: row.session_id,
        generated_by: user.id,
        status: "issued",
        issued_at: new Date().toISOString(),
      });
    }
  }

  if (newRows.length > 0) {
    await admin.from("certificates").insert(newRows);
  }

  // 4. Fetch all issued certificates with registration and session data
  let finalQuery = admin
    .from("certificates")
    .select("id, certificate_number, registration_id, session_id, status, registration:registrations(id, full_name, email), session:sessions(id, title)")
    .eq("status", "issued");

  if (sessionId) {
    finalQuery = finalQuery.eq("session_id", sessionId);
  }

  const { data: allIssued, error: finalError } = await finalQuery;
  if (finalError) {
    return NextResponse.json({ error: "Issued certificates could not be loaded." }, { status: 500 });
  }

  // Strictly filter certificates where attendee was marked present AND completed the survey
  const presentKeys = new Set((attendance ?? []).map((a) => `${a.registration_id}:${a.session_id}`));
  
  const eligibleFiltered: typeof allIssued = [];
  for (const c of allIssued ?? []) {
    if (!presentKeys.has(`${c.registration_id}:${c.session_id}`)) continue;
    const surveyDone = await hasUserSubmittedSurvey(c.registration_id, c.session_id);
    if (surveyDone) {
      eligibleFiltered.push(c);
    }
  }

  const eligible = eligibleFiltered;

  if (!eligible.length) {
    return NextResponse.json({ total: 0, sent: 0, failed: 0, totalCertificates: 0 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // 5. Group certificates by participant email to avoid sending multiple emails
  const recipientsMap = new Map<string, GroupedRecipient>();

  for (const cert of eligible) {
    const registration = Array.isArray(cert.registration) ? cert.registration[0] : cert.registration;
    const session = Array.isArray(cert.session) ? cert.session[0] : cert.session;
    if (!registration?.email) continue;

    const emailKey = registration.email.trim().toLowerCase();
    const certificateUrl = `${origin}/api/certificates/${encodeURIComponent(cert.certificate_number)}`;
    const verifyUrl = `${origin}/verify/${encodeURIComponent(cert.certificate_number)}`;

    const certItem: CertificateBundleItem = {
      number: cert.certificate_number,
      sessionTitle: session?.title ?? "Webinar Session",
      certificateUrl,
      verifyUrl,
    };

    if (!recipientsMap.has(emailKey)) {
      recipientsMap.set(emailKey, {
        fullName: registration.full_name,
        email: registration.email.trim(),
        certificates: [certItem],
      });
    } else {
      recipientsMap.get(emailKey)!.certificates.push(certItem);
    }
  }

  const recipients = Array.from(recipientsMap.values());
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const count = recipient.certificates.length;
    let subject: string;
    let htmlContent: string;

    if (count > 1) {
      subject = `Your certificates: Deepfakes and Digital Trust (${count} sessions)`;
      htmlContent = `
        <p>Hello ${escapeHtml(recipient.fullName)},</p>
        <p>Your attendance has been verified for both sessions of <strong>Deepfakes and Digital Trust</strong>. Your official e-certificates are ready to download below:</p>
        <div style="margin:24px 0">
          ${recipient.certificates
            .map(
              (item, idx) => `
            <div style="background:#f8f6ef;border:1px solid #d5d2c9;padding:18px;margin-bottom:14px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#cf4c10;letter-spacing:.08em">SESSION 0${idx + 1} E-CERTIFICATE</p>
              <h3 style="margin:0 0 10px;font-size:16px;line-height:1.3">${escapeHtml(item.sessionTitle)}</h3>
              <p style="margin:0 0 12px;font-size:12px;color:#666">ID: <code style="font-family:monospace;font-weight:700">${escapeHtml(item.number)}</code></p>
              <div>
                <a href="${item.certificateUrl}" style="display:inline-block;background:#cf4c10;color:#fff;text-decoration:none;padding:10px 16px;font-weight:700;font-size:13px">Download certificate (PDF)</a>
                <span style="display:inline-block;margin-left:12px;font-size:12px"><a href="${item.verifyUrl}" style="color:#666">Public verify</a></span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else {
      const single = recipient.certificates[0]!;
      subject = `Your certificate: ${single.sessionTitle}`;
      htmlContent = `
        <p>Hello ${escapeHtml(recipient.fullName)},</p>
        <p>Your attendance has been verified for <strong>${escapeHtml(single.sessionTitle)}</strong>.</p>
        <p style="margin:16px 0 12px;font-size:12px;color:#666">Certificate ID: <code style="font-family:monospace;font-weight:700">${escapeHtml(single.number)}</code></p>
        <p><a href="${single.certificateUrl}" style="display:inline-block;background:#cf4c10;color:#fff;text-decoration:none;padding:13px 18px;font-weight:700">Download certificate</a></p>
        <p style="font-size:13px">Public verification: <a href="${single.verifyUrl}">${single.verifyUrl}</a></p>
      `;
    }

    const delivery = await sendEmail({
      to: recipient.email,
      toName: recipient.fullName,
      subject,
      tags: ["certificate-notification", count > 1 ? "bundled-certificates" : "single-certificate"],
      html: emailLayout(count > 1 ? "Your certificates are ready" : "Your certificate is ready", htmlContent),
    });

    if (delivery.delivered) {
      sent++;
      for (const item of recipient.certificates) {
        await admin.from("audit_logs").insert({
          user_id: user.id,
          action: "certificate.email_sent",
          entity_type: "certificate",
          entity_id: item.number,
          metadata: { recipient: recipient.email, message_id: delivery.id, bundled: count > 1 },
        });
      }
    } else {
      failed++;
    }
  }

  await admin.from("audit_logs").insert({
    user_id: user.id,
    action: "certificates.bulk_email_sent",
    entity_type: "certificates",
    entity_id: sessionId ?? "all",
    metadata: {
      totalRecipients: recipients.length,
      sentEmails: sent,
      failedEmails: failed,
      totalCertificates: eligible.length,
    },
  });

  return NextResponse.json({
    total: recipients.length,
    totalCertificates: eligible.length,
    sent,
    failed,
  });
}
