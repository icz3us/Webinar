"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, X } from "lucide-react";

export default function SurveyQrModal({
  surveyTitle,
  slug,
  sessionTitle,
  onClose,
}: {
  surveyTitle: string;
  slug: string;
  sessionTitle: string;
  onClose: () => void;
}) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const siteOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const publicUrl = `${siteOrigin}/survey/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: "#171814",
        light: "#f1efe8",
      },
    })
      .then(setQrUrl)
      .catch((err) => console.error("QR generation failed", err));
  }, [publicUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(27, 29, 26, 0.75)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--paper, #f1efe8)",
          border: "2px solid var(--ink, #171814)",
          borderTop: "6px solid var(--signal, #d64a24)",
          width: "min(520px, 100%)",
          padding: "32px",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            right: "16px",
            top: "16px",
            background: "transparent",
            border: "1px solid var(--ink, #171814)",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <X size={18} />
        </button>

        <span
          style={{
            font: "600 11px var(--font-geist-mono, monospace)",
            color: "var(--signal, #d64a24)",
            display: "block",
            letterSpacing: "0.08em",
          }}
        >
          ATTENDEE ACCESS / QR CODE
        </span>
        <h2 id="qr-modal-title" style={{ fontSize: "24px", margin: "8px 0 4px", letterSpacing: "-0.03em" }}>
          {surveyTitle}
        </h2>
        <p style={{ margin: "0 0 20px", color: "var(--muted, #676860)", fontSize: "13px" }}>
          {sessionTitle}
        </p>

        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line, #c9c7bd)",
            padding: "20px",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            width: "min(320px, 100%)",
          }}
        >
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR code for survey ${surveyTitle}`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : (
            <p style={{ fontSize: "13px", color: "var(--muted, #676860)" }}>Generating QR code...</p>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              font: "600 11px var(--font-geist-mono, monospace)",
              color: "var(--muted, #676860)",
              marginBottom: "6px",
            }}
          >
            PUBLIC SURVEY URL
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              readOnly
              value={publicUrl}
              style={{
                flex: 1,
                minHeight: "44px",
                padding: "8px 12px",
                border: "1px solid #898a82",
                background: "#fff",
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "12px",
              }}
            />
            <button
              onClick={copyLink}
              className="button"
              style={{ minHeight: "44px", padding: "8px 16px", fontSize: "13px" }}
            >
              <Copy size={14} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {qrUrl && (
            <a
              href={qrUrl}
              download={`survey-qr-${slug}.png`}
              className="button button-primary"
              style={{ flex: 1, minHeight: "44px", fontSize: "13px" }}
            >
              <Download size={15} />
              Download QR Code (PNG)
            </a>
          )}
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="button"
            style={{ minHeight: "44px", fontSize: "13px" }}
          >
            <ExternalLink size={15} />
            Open Survey
          </a>
        </div>
      </div>
    </div>
  );
}
