"use client";

import { useState } from "react";
import { HARDCODED_CLOSED_MESSAGE } from "@/lib/registration-constants";

type AdminRegistrationToggleProps = {
  initialIsOpen: boolean;
};

export default function AdminRegistrationToggle({ initialIsOpen }: AdminRegistrationToggleProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function toggleStatus() {
    setLoading(true);
    setFeedback(null);
    try {
      const nextState = !isOpen;
      const res = await fetch("/api/admin/registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextState }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update registration status.");
      }
      setIsOpen(Boolean(data.isOpen));
      setFeedback({
        type: "success",
        text: data.isOpen
          ? "Registration has been opened. Visitors can now register."
          : "Registration has been closed. Visitors will now see the polite closed notice.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "An unexpected error occurred while toggling status.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line, #c9c7bd)",
        borderLeft: `5px solid ${isOpen ? "var(--green, #426b4c)" : "var(--signal, #d64a24)"}`,
        padding: "24px",
        marginBottom: "28px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span
            style={{
              font: "700 11px var(--font-geist-mono, monospace)",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              display: "block",
              color: "var(--muted, #676860)",
              marginBottom: "4px",
            }}
          >
            REGISTRATION GATE
          </span>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", letterSpacing: "-.02em" }}>
            Event Registration Status
          </h2>
          <p style={{ margin: 0, color: "var(--muted, #676860)", fontSize: "14px", maxWidth: "600px", lineHeight: "1.5" }}>
            Control whether new attendees can submit registrations. When closed, new submissions are rejected and the polite notice is displayed.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: isOpen ? "var(--green, #426b4c)" : "var(--signal, #d64a24)",
              }}
            />
            <strong
              style={{
                font: "700 13px var(--font-geist-mono, monospace)",
                letterSpacing: ".06em",
                color: isOpen ? "var(--green, #426b4c)" : "var(--signal, #d64a24)",
                textTransform: "uppercase",
              }}
            >
              {isOpen ? "REGISTRATION OPEN" : "REGISTRATION CLOSED"}
            </strong>
          </div>

          <button
            className={`button ${isOpen ? "" : "button-primary"}`}
            type="button"
            onClick={toggleStatus}
            disabled={loading}
            style={{
              minHeight: "44px",
              padding: "8px 18px",
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Updating..." : isOpen ? "Close Registration" : "Re-open Registration"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            fontSize: "13px",
            background: feedback.type === "success" ? "#eef6ee" : "#fff1ed",
            border: `1px solid ${feedback.type === "success" ? "#c4dfc4" : "#f5c2b5"}`,
            color: feedback.type === "success" ? "#2d6139" : "#a52b18",
          }}
        >
          {feedback.text}
        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          background: "#f8f6ef",
          border: "1px solid var(--line, #c9c7bd)",
        }}
      >
        <span
          style={{
            font: "700 10px var(--font-geist-mono, monospace)",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--muted, #676860)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          POLITE CLOSED MESSAGE (DISPLAYED WHEN CLOSED)
        </span>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "var(--ink, #171814)" }}>
          {HARDCODED_CLOSED_MESSAGE}
        </p>
      </div>
    </div>
  );
}
