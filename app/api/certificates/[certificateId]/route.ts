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
    .select("certificate_number,issued_at,status,registration_id,session_id,registration:registrations(full_name),session:sessions(title)")
    .ilike("certificate_number", decodedId)
    .eq("status", "issued")
    .maybeSingle();

  if (!data) return Response.json({ error: "Certificate not found." }, { status: 404 });

  const registration = Array.isArray(data.registration) ? data.registration[0] : data.registration;
  const session = Array.isArray(data.session) ? data.session[0] : data.session;

  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const orange = [207, 76, 16] as const;
  const ink = [31, 32, 28] as const;
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
  document.setTextColor(...ink);
  document.text("GCCCS - ByteCast", 42, 20);
  document.setTextColor(...ink);
  document.setFont("courier", "normal");
  document.setFontSize(6);
  document.text("EVENT / DDT-2026", 272, 20, { align: "right" });
  document.text("OCTOBER 18, 2026", 272, 26, { align: "right" });
  document.setTextColor(...orange);
  document.setFont("helvetica", "bold");
  document.setFontSize(14);
  document.text("CERTIFICATE OF PARTICIPATION", 148.5, 64, { align: "center" });
  document.setTextColor(...ink);
  document.setFont("helvetica", "normal");
  document.setFontSize(9.5);
  document.text("This certificate is presented to", 148.5, 76, { align: "center" });
  document.setFont("times", "normal");
  document.setFontSize(40);
  document.text(registration?.full_name ?? "Participant", 148.5, 95, { align: "center", maxWidth: 210 });
  document.setDrawColor(...orange);
  document.setLineWidth(0.7);
  document.line(123, 103, 174, 103);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.text("for verified attendance and participation in", 148.5, 114, { align: "center" });
  document.setFontSize(17);
  document.text(session?.title ?? "Webinar Session", 148.5, 130, { align: "center", maxWidth: 215 });
  document.setTextColor(...orange);
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.text("Deepfakes & Digital Trust", 148.5, 145, { align: "center" });
  document.setTextColor(...ink);
  document.setFont("helvetica", "normal");
  document.setFontSize(7.5);
  document.text("Recognizing AI-Generated Media and Misinformation", 148.5, 152, { align: "center" });
  document.setDrawColor(...ink);
  document.setLineWidth(0.35);
  document.line(40, 180, 99, 180);
  document.line(198, 180, 257, 180);
  document.setDrawColor(...orange);
  document.setLineWidth(0.7);
  document.circle(148.5, 180, 13);
  document.setLineWidth(0.35);
  document.circle(148.5, 180, 11);
  document.setLineDashPattern([1.2, 1.2], 0);
  document.circle(148.5, 180, 8.8);
  document.setLineDashPattern([], 0);
  document.setFillColor(255, 146, 0);
  document.circle(135.5, 180, 1.2, "F");
  document.circle(161.5, 180, 1.2, "F");
  document.setTextColor(...orange);
  document.setFontSize(7);
  document.text("VERIFIED", 148.5, 176.5, { align: "center" });
  document.setFontSize(10);
  document.text("ByteCast", 148.5, 181, { align: "center" });
  document.setFontSize(4.5);
  document.text("DIGITAL CERTIFICATE", 148.5, 184.5, { align: "center" });
  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(8);
  document.text("Event Organizer", 69.5, 186, { align: "center" });
  document.text("College Representative", 227.5, 186, { align: "center" });
  document.setFont("courier", "normal");
  document.setFontSize(5.5);
  document.text(`CERTIFICATE ID / ${data.certificate_number}`, 22, 201);
  document.text(`ISSUED / ${data.issued_at ? new Date(data.issued_at).toLocaleDateString("en-PH") : ""}`, 275, 201, { align: "right" });

  return new Response(document.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${decodedId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
