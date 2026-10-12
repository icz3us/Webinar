import { jsPDF } from "jspdf";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function generateSample(isSession2, outputPath) {
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const orange = [207, 76, 16];
  const ink = [31, 32, 28];
  const muted = [85, 87, 79];

  const bgPath = path.join(process.cwd(), "public", "images", "certificate-background-v3.png");
  const logoPath = path.join(process.cwd(), "public", "images", "bytecast-icon-v2.png");
  const background = await readFile(bgPath);
  const byteCastLogo = await readFile(logoPath);

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
  document.text("Juan Dela Cruz", 148.5, 78, { align: "center", maxWidth: 220 });

  document.setFont("helvetica", "bold");
  document.setFontSize(10.5);
  document.text("for participating in the webinar", 148.5, 90, { align: "center" });

  const sessionTitle = isSession2
    ? "Session 02: Deepfakes in the Workplace and School (Email, Zoom, News)"
    : "Session 01: Deepfakes in Everyday Social Media (TikTok, Facebook, Instagram)";

  document.setFontSize(16);
  document.text(sessionTitle, 148.5, 102, { align: "center", maxWidth: 225 });

  document.setTextColor(141, 55, 8);
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.text("conducted by GCCCS - ByteCast.", 148.5, 112, { align: "center" });

  document.setTextColor(...ink);
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.text("This certificate confirms attendance and participation in the above learning session and reflects engagement", 148.5, 119, { align: "center" });
  document.text("in professional development activities related to the stated topic.", 148.5, 124.5, { align: "center" });

  // Verified Seal
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
  const x1 = 58;
  const x2 = 148.5;
  const x3 = 239;

  // Signature lines
  document.setDrawColor(...ink);
  document.setLineWidth(0.35);
  document.line(x1 - 27, sigY, x1 + 27, sigY);
  document.line(x2 - 27, sigY, x2 + 27, sigY);
  document.line(x3 - 27, sigY, x3 + 27, sigY);

  // Signatures on top of lines
  const sigDir = path.join(process.cwd(), "public", "images", "signatures");
  const udaniSig = new Uint8Array(await readFile(path.join(sigDir, "UDANI_SIGNATURE.png")));

  if (isSession2) {
    // Rosete: w=42, h=16.5, overlap=6
    const roseteSig = new Uint8Array(await readFile(path.join(sigDir, "ROSETE_SIGNATURE.png")));
    document.addImage(roseteSig, "PNG", x1 - 21, sigY - 16.5 + 6, 42, 16.5, undefined, "FAST");

    // Gonzales: w=32, h=10.7, overlap=2.5
    const gonzalesSig = new Uint8Array(await readFile(path.join(sigDir, "GONZALES_SIGNATURE.png")));
    document.addImage(gonzalesSig, "PNG", x3 - 16, sigY - 10.7 + 2.5, 32, 10.7, undefined, "FAST");
  } else {
    // Udani left: w=17, h=28, overlap=8.5
    document.addImage(udaniSig, "PNG", x1 - 8.5, sigY - 28 + 8.5, 17, 28, undefined, "FAST");

    // Ballon right: w=38, h=21.5, overlap=7
    const ballonSig = new Uint8Array(await readFile(path.join(sigDir, "BALLON_SIGNATURE.png")));
    document.addImage(ballonSig, "PNG", x3 - 19, sigY - 21.5 + 7, 38, 21.5, undefined, "FAST");
  }

  // Center: Udani organizer: w=17, h=28, overlap=8.5
  document.addImage(udaniSig, "PNG", x2 - 8.5, sigY - 28 + 8.5, 17, 28, undefined, "FAST");

  // Signatory Names & Roles
  const speaker1 = isSession2
    ? { name: "ROSETE, FRANCIS EMIL", role: "Resource Speaker" }
    : { name: "UDANI, VARNARD PAULO", role: "Resource Speaker" };
  const speaker2 = isSession2
    ? { name: "GONZALES, ICON ZEUS", role: "Resource Speaker" }
    : { name: "BALLON, GLENBERG JAMES", role: "Resource Speaker" };
  const organizer = { name: "UDANI, VARNARD PAULO", role: "Event Head Organizer" };

  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  document.text(speaker1.name, x1, sigY + 5, { align: "center" });
  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.setTextColor(...muted);
  document.text(speaker1.role, x1, sigY + 8.5, { align: "center" });

  document.setTextColor(...ink);
  document.setFont("helvetica", "bold");
  document.setFontSize(8.5);
  document.text(organizer.name, x2, sigY + 5, { align: "center" });
  document.setFont("helvetica", "normal");
  document.setFontSize(7);
  document.setTextColor(...muted);
  document.text(organizer.role, x2, sigY + 8.5, { align: "center" });

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
  document.text("Credential ID: DDT-2026-SAMPLE   |   Issued: October 18, 2026", 148.5, 189, { align: "center" });

  // Disclaimer
  document.setTextColor(110, 112, 104);
  document.setFont("helvetica", "normal");
  document.setFontSize(6.5);
  document.text("Attendance or recognition only. Not a professional certification, license, or academic credential. Misuse is prohibited.", 148.5, 197.5, { align: "center" });

  const buf = Buffer.from(document.output("arraybuffer"));
  await writeFile(outputPath, buf);
  console.log("Wrote " + outputPath);
}

await generateSample(false, path.join(process.cwd(), "public", "sample-session1.pdf"));
await generateSample(true, path.join(process.cwd(), "public", "sample-session2.pdf"));
