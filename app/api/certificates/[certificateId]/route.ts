import { jsPDF } from "jspdf";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const decodedId = decodeURIComponent(certificateId).trim();
  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) return Response.json({ error: "Supabase is required." }, { status: 503 });

  const { data } = await supabase
    .from("certificates")
    .select("certificate_number,issued_at,status,registration_id,session_id,registration:registrations(full_name),session:sessions(title,slug)")
    .ilike("certificate_number", decodedId)
    .eq("status", "issued")
    .maybeSingle();

  if (!data) return Response.json({ error: "Certificate not found." }, { status: 404 });

  const registration = Array.isArray(data.registration) ? data.registration[0] : data.registration;
  const session = Array.isArray(data.session) ? data.session[0] : data.session;

  const isSession2 =
    session?.slug === "session-2" ||
    (typeof session?.title === "string" && (session.title.includes("02") || session.title.includes("Session 2") || session.title.toLowerCase().includes("workplace")));

  const speaker1 = isSession2
    ? { name: "ROSETE, FRANCIS EMIL", role: "Resource Speaker" }
    : { name: "UDANI, VARNARD PAULO", role: "Resource Speaker" };

  const speaker2 = isSession2
    ? { name: "GONZALES, ICON ZEUS", role: "Resource Speaker" }
    : { name: "BALLON, GLENBERG JAMES", role: "Resource Speaker" };

  const organizer = { name: "UDANI, VARNARD PAULO", role: "Event Head Organizer" };

  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const orange = [207, 76, 16] as const;
  const ink = [31, 32, 28] as const;
  const muted = [85, 87, 79] as const;
  const background = await readFile(path.join(process.cwd(), "public", "images", "certificate-background-v3.png"));
  const byteCastLogo = await readFile(path.join(process.cwd(), "public", "images", "bytecast-icon-v2.png"));

  document.addImage(new Uint8Array(background), "PNG", 0, 0, 297, 210, undefined, "FAST");
  document.addImage(new Uint8Array(byteCastLogo), "PNG", 20, 11, 14, 14, undefined, "FAST");
  document.setDrawColor(141, 55, 8);
  document.setLineWidth(0.3);
  document.line(38, 11, 38, 25);
  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.text("GCCCS - ByteCast", 42, 20);
  document.setFont("courier", "normal");
  document.setFontSize(6);
  document.text("EVENT / DDT-2026", 272, 20, { align: "right" });
  document.text("OCTOBER 18, 2026", 272, 26, { align: "right" });
  document.setTextColor(...orange);
  document.setFont("helvetica", "bold");
  document.setFontSize(14);
  document.text("CERTIFICATE OF PARTICIPATION", 148.5, 52, { align: "center" });

  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(10.5);
  document.text("is presented to", 148.5, 60, { align: "center" });

  document.setFont("helvetica", "bold");
  document.setFontSize(34);
  document.text(registration?.full_name ?? "Participant", 148.5, 78, { align: "center", maxWidth: 220 });

  document.setFont("helvetica", "bold");
  document.setFontSize(10.5);
  document.text("for participating in the webinar", 148.5, 90, { align: "center" });

  document.setFontSize(16);
  document.text(session?.title ?? "Webinar Session", 148.5, 102, { align: "center", maxWidth: 225 });

  document.setTextColor(141, 55, 8);
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.text("conducted by GCCCS - ByteCast.", 148.5, 112, { align: "center" });

  document.setTextColor(...ink);
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.text("This certificate confirms attendance and participation in the above learning session and reflects engagement", 148.5, 119, { align: "center" });
  document.text("in professional development activities related to the stated topic.", 148.5, 124.5, { align: "center" });

  // Verified Seal (Centered at X=148.5, Y=145)
  const sealY = 145;
  document.setDrawColor(...orange);
  document.setLineWidth(0.6);
  document.circle(148.5, sealY, 10.5);
  document.setLineWidth(0.3);
  document.circle(148.5, sealY, 9);
  document.setLineDashPattern([1, 1], 0);
  document.circle(148.5, sealY, 7.2);
  document.setLineDashPattern([], 0);
  document.setFillColor(255, 146, 0);
  document.circle(138, sealY, 1, "F");
  document.circle(159, sealY, 1, "F");
  document.setTextColor(...orange);
  document.setFont("helvetica", "bold");
  document.setFontSize(5.5);
  document.text("VERIFIED", 148.5, sealY - 2.8, { align: "center" });
  document.setFontSize(8);
  document.text("ByteCast", 148.5, sealY + 0.8, { align: "center" });
  document.setFontSize(3.8);
  document.text("DIGITAL CERTIFICATE", 148.5, sealY + 3.8, { align: "center" });

  const sigY = 168;
  document.setDrawColor(...ink);
  document.setLineWidth(0.35);

  // Left: Speaker 1
  const x1 = 58;
  document.line(x1 - 27, sigY, x1 + 27, sigY);
  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  document.text(speaker1.name, x1, sigY + 5, { align: "center" });
  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.setTextColor(...muted);
  document.text(speaker1.role, x1, sigY + 8.5, { align: "center" });

  // Center: Event Head Organizer
  const x2 = 148.5;
  document.line(x2 - 27, sigY, x2 + 27, sigY);
  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  document.text(organizer.name, x2, sigY + 5, { align: "center" });
  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.setTextColor(...muted);
  document.text(organizer.role, x2, sigY + 8.5, { align: "center" });

  // Right: Speaker 2
  const x3 = 239;
  document.line(x3 - 27, sigY, x3 + 27, sigY);
  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  document.text(speaker2.name, x3, sigY + 5, { align: "center" });
  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.setTextColor(...muted);
  document.text(speaker2.role, x3, sigY + 8.5, { align: "center" });

  // Metadata / Credential ID
  document.setTextColor(...muted);
  document.setFont("courier", "normal");
  document.setFontSize(6.5);
  const issuedDate = data.issued_at ? new Date(data.issued_at).toLocaleDateString("en-PH", { dateStyle: "long" }) : "October 18, 2026";
  document.text(`Credential ID: ${data.certificate_number}   |   Issued: ${issuedDate}`, 148.5, 189, { align: "center" });

  // Disclaimer
  document.setTextColor(110, 112, 104);
  document.setFont("helvetica", "normal");
  document.setFontSize(6.5);
  document.text("Attendance or recognition only. Not a professional certification, license, or academic credential. Misuse is prohibited.", 148.5, 197.5, { align: "center" });

  return new Response(document.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${decodedId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
