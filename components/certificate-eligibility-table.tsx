"use client";

import { useState } from "react";
import { Download, Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ParticipantEligibility } from "@/lib/surveys";

export default function CertificateEligibilityTable({
  records,
  sessions,
}: {
  records: ParticipantEligibility[];
  sessions: { id: string; title: string; slug: string }[];
}) {
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [surveyFilter, setSurveyFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [certFilter, setCertFilter] = useState("all");

  const filtered = records.filter((r) => {
    // Search by Name or Email
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.fullName.toLowerCase().includes(q);
      const matchEmail = r.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // Session filter
    if (sessionFilter !== "all" && r.sessionId !== sessionFilter && r.sessionSlug !== sessionFilter) {
      return false;
    }

    // Eligibility filter
    if (eligibilityFilter === "eligible" && !r.certificateEligible) return false;
    if (eligibilityFilter === "not_eligible" && r.certificateEligible) return false;

    // Survey filter
    if (surveyFilter === "completed" && !r.surveyCompleted) return false;
    if (surveyFilter === "incomplete" && r.surveyCompleted) return false;

    // Attendance filter
    if (attendanceFilter === "present" && r.attendanceStatus !== "present") return false;
    if (attendanceFilter === "absent" && r.attendanceStatus !== "absent") return false;
    if (attendanceFilter === "not_marked" && r.attendanceStatus !== "not_marked") return false;

    // Certificate filter
    if (certFilter === "generated" && !r.certificateGenerated) return false;
    if (certFilter === "pending" && r.certificateGenerated) return false;

    return true;
  });

  return (
    <div>
      {/* Search and Filters Bar */}
      <div
        style={{
          background: "#f8f6ef",
          border: "1px solid var(--line, #c9c7bd)",
          padding: "clamp(12px, 3vw, 20px)",
          marginBottom: "20px",
          display: "grid",
          gap: "12px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%" }}>
          {/* Search box */}
          <div style={{ flex: "1 1 100%", position: "relative" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by participant name or email..."
              style={{
                width: "100%",
                minHeight: "44px",
                padding: "8px 12px 8px 36px",
                border: "1px solid #8d8d85",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "14px",
                color: "var(--muted, #676860)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Session filter */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            style={{
              flex: "1 1 min(100%, 150px)",
              minHeight: "44px",
              padding: "8px 12px",
              border: "1px solid #8d8d85",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All Sessions</option>
            {sessions.map((s, i) => (
              <option key={s.id} value={s.id}>
                Session 0{i + 1}
              </option>
            ))}
          </select>

          {/* Eligibility filter */}
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            style={{
              flex: "1 1 min(100%, 150px)",
              minHeight: "44px",
              padding: "8px 12px",
              border: "1px solid #8d8d85",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All Eligibility</option>
            <option value="eligible">Eligible Only</option>
            <option value="not_eligible">Not Eligible</option>
          </select>

          {/* Survey filter */}
          <select
            value={surveyFilter}
            onChange={(e) => setSurveyFilter(e.target.value)}
            style={{
              flex: "1 1 min(100%, 150px)",
              minHeight: "44px",
              padding: "8px 12px",
              border: "1px solid #8d8d85",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All Survey Status</option>
            <option value="completed">Survey Completed</option>
            <option value="incomplete">Survey Incomplete</option>
          </select>

          {/* Attendance filter */}
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            style={{
              flex: "1 1 min(100%, 150px)",
              minHeight: "44px",
              padding: "8px 12px",
              border: "1px solid #8d8d85",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All Attendance</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="not_marked">Not Marked</option>
          </select>

          {/* Certificate filter */}
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value)}
            style={{
              flex: "1 1 min(100%, 150px)",
              minHeight: "44px",
              padding: "8px 12px",
              border: "1px solid #8d8d85",
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <option value="all">All Certificate Status</option>
            <option value="generated">Certificate Generated</option>
            <option value="pending">Certificate Pending</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--muted, #676860)" }}>
          <span>
            Showing <strong>{filtered.length}</strong> of {records.length} records
          </span>
          {(search || sessionFilter !== "all" || eligibilityFilter !== "all" || surveyFilter !== "all" || attendanceFilter !== "all" || certFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSessionFilter("all");
                setEligibilityFilter("all");
                setSurveyFilter("all");
                setAttendanceFilter("all");
                setCertFilter("all");
              }}
              style={{
                background: "transparent",
                border: "none",
                textDecoration: "underline",
                cursor: "pointer",
                color: "var(--signal, #d64a24)",
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Session</th>
              <th>Attendance</th>
              <th>Survey</th>
              <th>Eligibility</th>
              <th>Certificate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isPresent = r.attendanceStatus === "present";
              const isAbsent = r.attendanceStatus === "absent";

              return (
                <tr key={`${r.registrationId}-${r.sessionId}`}>
                  <td>
                    <strong>{r.fullName}</strong>
                    <small>{r.email}</small>
                    <small style={{ color: "#777" }}>{r.affiliation}</small>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: r.sessionNumber === "01" ? "#e6f0e7" : "#fff1e6",
                        borderColor: r.sessionNumber === "01" ? "#78927e" : "#d88235",
                        color: r.sessionNumber === "01" ? "#244d2d" : "#8a3d07",
                        fontWeight: 700,
                      }}
                    >
                      Session {r.sessionNumber}
                    </span>
                    <small style={{ display: "block", marginTop: "4px" }}>
                      {r.sessionTitle}
                    </small>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: isPresent ? "#e6f0e7" : isAbsent ? "#fff1ed" : "#f1f0ec",
                        borderColor: isPresent ? "#78927e" : isAbsent ? "#a52b18" : "#999",
                        color: isPresent ? "#2d6139" : isAbsent ? "#8d2413" : "#555",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {isPresent ? "Present" : isAbsent ? "Absent" : "Not marked"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: r.surveyCompleted ? "#e6f0e7" : "#fff8e6",
                        borderColor: r.surveyCompleted ? "#78927e" : "#c5a458",
                        color: r.surveyCompleted ? "#2d6139" : "#7d5b12",
                        fontWeight: 700,
                      }}
                    >
                      {r.surveyCompleted ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: r.certificateEligible ? "#e6f0e7" : "#f1f0ec",
                        borderColor: r.certificateEligible ? "#78927e" : "#999",
                        color: r.certificateEligible ? "#2d6139" : "#555",
                        fontWeight: 800,
                      }}
                    >
                      {r.certificateEligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </td>
                  <td>
                    {r.certificateGenerated && r.certificateNumber ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              background: "#e6f0e7",
                              color: "#2d6139",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            Generated
                          </span>
                          <code
                            style={{
                              display: "block",
                              fontFamily: "var(--font-geist-mono, monospace)",
                              fontSize: "11px",
                              marginTop: "2px",
                            }}
                          >
                            {r.certificateNumber}
                          </code>
                        </div>
                        <a
                          href={`/api/certificates/${r.certificateNumber}`}
                          className="table-action"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          <Download size={12} /> PDF
                        </a>
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted, #676860)", fontSize: "13px" }}>
                        {r.certificateEligible ? "Pending generation" : "Not eligible"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!filtered.length && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state" style={{ padding: "30px", textAlign: "center" }}>
                    No participant records match the selected filters.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
