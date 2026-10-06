import { jsPDF } from "jspdf";
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

  document.setFillColor(244, 241, 232);
  document.rect(0, 0, 297, 210, "F");
  document.setFillColor(...orange);
  document.rect(0, 0, 9, 210, "F");
  document.rect(288, 0, 9, 210, "F");
  document.setDrawColor(...ink);
  document.setLineWidth(0.5);
  document.rect(14, 12, 269, 186);
  document.line(22, 35, 275, 35);
  document.line(22, 181, 275, 181);
  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(9);
  document.text("GORDON COLLEGE", 22, 23);
  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.text("COLLEGE OF COMPUTER STUDIES", 22, 28);
  document.setFont("courier", "normal");
  document.text("EVENT / 001", 275, 22, { align: "right" });
  document.text("DATE / 11.10.2026", 275, 28, { align: "right" });
  document.setTextColor(...orange);
  document.setFont("helvetica", "bold");
  document.setFontSize(14);
  document.text("CERTIFICATE OF PARTICIPATION", 148.5, 55, { align: "center" });
  document.setTextColor(...ink);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.text("This is presented to", 148.5, 70, { align: "center" });
  document.setFont("helvetica", "bold");
  document.setFontSize(30);
  document.text(registration?.full_name ?? "Participant", 148.5, 91, { align: "center", maxWidth: 230 });
  document.setDrawColor(...orange);
  document.setLineWidth(1);
  document.line(105, 98, 192, 98);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.text("for verified attendance in", 148.5, 110, { align: "center" });
  document.setFont("helvetica", "bold");
  document.setFontSize(18);
  document.text(session?.title ?? "Webinar Session", 148.5, 126, { align: "center", maxWidth: 225 });
  document.setTextColor(...orange);
  document.setFontSize(13);
  document.text("DEEPFAKES & DIGITAL TRUST", 148.5, 143, { align: "center" });
  document.setTextColor(...ink);
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.text("Recognizing AI-Generated Media and Misinformation", 148.5, 150, { align: "center" });
  document.setDrawColor(...ink);
  document.line(32, 166, 91, 166);
  document.line(206, 166, 265, 166);
  document.setFont("helvetica", "bold");
  document.text("EVENT ORGANIZER", 61.5, 172, { align: "center" });
  document.text("COLLEGE REPRESENTATIVE", 235.5, 172, { align: "center" });
  document.setFont("courier", "normal");
  document.setFontSize(7);
  document.text(`CERTIFICATE ID / ${data.certificate_number}`, 22, 190);
  document.text(`ISSUED / ${data.issued_at ? new Date(data.issued_at).toLocaleDateString("en-PH") : ""}`, 275, 190, { align: "right" });

  return new Response(document.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${decodedId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
