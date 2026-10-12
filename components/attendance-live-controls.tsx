"use client";

import { useMemo, useState } from "react";

type Person = {
  id: string;
  name: string;
  email: string;
  affiliation?: string;
  category?: string;
  attendance: string;
};

function formatCategory(category?: string) {
  if (!category) return "";
  const map: Record<string, string> = {
    it_professional: "IT Professional",
    student: "Student",
    educator: "Educator",
    general_public: "General Public",
    other: "Other",
  };
  return map[category] || category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AttendanceLiveControls({
  people,
  sessionId,
}: {
  people: Person[];
  sessionId: string;
}) {
  const [state, setState] = useState(() =>
    Object.fromEntries(people.map((person) => [person.id, person.attendance]))
  );
  const [prevSessionId, setPrevSessionId] = useState(sessionId);
  if (prevSessionId !== sessionId) {
    setPrevSessionId(sessionId);
    setState(Object.fromEntries(people.map((person) => [person.id, person.attendance])));
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "not_marked">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "name_asc" | "name_desc" | "unmarked_first" | "present_first">("default");

  const [busy, setBusy] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [message, setMessage] = useState("");

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let unmarked = 0;
    for (const p of people) {
      const s = state[p.id] ?? "not_marked";
      if (s === "present") present++;
      else if (s === "absent") absent++;
      else unmarked++;
    }
    return {
      total: people.length,
      present,
      absent,
      unmarked,
    };
  }, [people, state]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [people]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = people.filter((person) => {
      // 1. Search Query
      if (q) {
        const matchName = person.name.toLowerCase().includes(q);
        const matchEmail = person.email.toLowerCase().includes(q);
        const matchAffiliation = person.affiliation ? person.affiliation.toLowerCase().includes(q) : false;
        if (!matchName && !matchEmail && !matchAffiliation) return false;
      }

      // 2. Status Filter
      const currentStatus = state[person.id] ?? "not_marked";
      if (statusFilter === "present" && currentStatus !== "present") return false;
      if (statusFilter === "absent" && currentStatus !== "absent") return false;
      if (statusFilter === "not_marked" && currentStatus !== "not_marked") return false;

      // 3. Category Filter
      if (categoryFilter !== "all" && person.category !== categoryFilter) return false;

      return true;
    });

    if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "unmarked_first") {
      const getRank = (id: string) => {
        const s = state[id] ?? "not_marked";
        return s === "not_marked" ? 0 : s === "present" ? 1 : 2;
      };
      result.sort((a, b) => getRank(a.id) - getRank(b.id));
    } else if (sortBy === "present_first") {
      const getRank = (id: string) => {
        const s = state[id] ?? "not_marked";
        return s === "present" ? 0 : s === "not_marked" ? 1 : 2;
      };
      result.sort((a, b) => getRank(a.id) - getRank(b.id));
    }

    return result;
  }, [people, searchQuery, statusFilter, categoryFilter, sortBy, state]);

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("default");
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "default";

  const unmarkedFiltered = filtered.filter(
    (p) => (state[p.id] ?? "not_marked") !== "present"
  );

  async function mark(id: string, status: "present" | "absent") {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationIds: [id], sessionId, status }),
      });
      const result = await response.json();
      if (response.ok) {
        setState((current) => ({ ...current, [id]: status }));
        setMessage("Attendance saved.");
      } else {
        setMessage(result.error ?? "Attendance could not be saved.");
      }
    } catch {
      setMessage("Network error saving attendance.");
    } finally {
      setBusy("");
    }
  }

  async function markBulkPresent() {
    if (!unmarkedFiltered.length) return;
    setBulkBusy(true);
    setMessage("");
    const ids = unmarkedFiltered.map((p) => p.id);
    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationIds: ids, sessionId, status: "present" }),
      });
      const result = await response.json();
      if (response.ok) {
        setState((current) => {
          const next = { ...current };
          for (const id of ids) {
            next[id] = "present";
          }
          return next;
        });
        setMessage(`Marked ${ids.length} participant${ids.length === 1 ? "" : "s"} as present.`);
      } else {
        setMessage(result.error ?? "Attendance could not be saved.");
      }
    } catch {
      setMessage("Network error saving attendance.");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <>
      {message && (
        <p className="operation-message" role="status">
          {message}
        </p>
      )}

      {/* Quick Status Filter Chips */}
      <div className="attendance-summary-bar" role="group" aria-label="Filter by attendance status">
        <button
          type="button"
          className={`attendance-chip ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
          aria-pressed={statusFilter === "all"}
        >
          <span>All participants</span>
          <span className="chip-count">{counts.total}</span>
        </button>
        <button
          type="button"
          className={`attendance-chip chip-present ${statusFilter === "present" ? "active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "present" ? "all" : "present")}
          aria-pressed={statusFilter === "present"}
        >
          <span>Present</span>
          <span className="chip-count">{counts.present}</span>
        </button>
        <button
          type="button"
          className={`attendance-chip chip-absent ${statusFilter === "absent" ? "active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "absent" ? "all" : "absent")}
          aria-pressed={statusFilter === "absent"}
        >
          <span>Absent</span>
          <span className="chip-count">{counts.absent}</span>
        </button>
        <button
          type="button"
          className={`attendance-chip ${statusFilter === "not_marked" ? "active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "not_marked" ? "all" : "not_marked")}
          aria-pressed={statusFilter === "not_marked"}
        >
          <span>Not marked</span>
          <span className="chip-count">{counts.unmarked}</span>
        </button>
      </div>

      {/* Search and Filters Controls */}
      <div className="table-tools">
        <div style={{ position: "relative", flex: "1 1 240px", display: "flex" }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, or affiliation..."
            aria-label="Search participants"
            style={{ width: "100%", paddingRight: searchQuery ? "32px" : "12px" }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--muted, #676860)",
                fontSize: "16px",
                lineHeight: 1,
                padding: "6px",
              }}
            >
              ×
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "present" | "absent" | "not_marked")}
          aria-label="Filter by attendance status"
        >
          <option value="all">All statuses</option>
          <option value="not_marked">Not marked</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>

        {availableCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {formatCategory(cat)}
              </option>
            ))}
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value as
                | "default"
                | "name_asc"
                | "name_desc"
                | "unmarked_first"
                | "present_first"
            )
          }
          aria-label="Sort participants"
        >
          <option value="default">Default order</option>
          <option value="name_asc">Name (A–Z)</option>
          <option value="name_desc">Name (Z–A)</option>
          <option value="unmarked_first">Not marked first</option>
          <option value="present_first">Present first</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="button"
            onClick={resetFilters}
            style={{
              background: "transparent",
              color: "var(--signal, #d64a24)",
              borderColor: "var(--signal, #d64a24)",
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Results Header with Count & Bulk Action */}
      <div className="attendance-results-header">
        <span>
          Showing {filtered.length} of {people.length} participant{people.length === 1 ? "" : "s"}
          {hasActiveFilters && " (filtered)"}
        </span>
        {unmarkedFiltered.length > 0 && filtered.length > 0 && (
          <button
            type="button"
            className="button"
            disabled={bulkBusy}
            onClick={markBulkPresent}
            style={{
              minHeight: "36px",
              padding: "6px 14px",
              fontSize: "12px",
              background: "#f0f6f1",
              borderColor: "var(--green, #426b4c)",
              color: "var(--green, #426b4c)",
            }}
          >
            {bulkBusy
              ? "Saving..."
              : `Mark ${unmarkedFiltered.length} matching as Present`}
          </button>
        )}
      </div>

      {/* Attendance List */}
      <div className="attendance-list">
        {filtered.map((person) => {
          const currentStatus = state[person.id] ?? "not_marked";
          const isBusy = busy === person.id || bulkBusy;

          return (
            <article key={person.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <strong>{person.name}</strong>
                  {currentStatus === "present" && (
                    <span className="attendance-badge present">Present</span>
                  )}
                  {currentStatus === "absent" && (
                    <span className="attendance-badge absent">Absent</span>
                  )}
                  {currentStatus === "not_marked" && (
                    <span className="attendance-badge unmarked">Not marked</span>
                  )}
                </div>
                <span>{person.email}</span>
                {(person.affiliation || person.category) && (
                  <small className="attendance-meta">
                    {person.affiliation}
                    {person.affiliation && person.category && " • "}
                    {person.category && formatCategory(person.category)}
                  </small>
                )}
              </div>
              <div className="attendance-actions">
                <button
                  type="button"
                  disabled={isBusy}
                  className={currentStatus === "present" ? "active" : ""}
                  onClick={() => mark(person.id, "present")}
                  aria-label={`Mark ${person.name} as present`}
                >
                  Present
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  className={currentStatus === "absent" ? "active absent" : ""}
                  onClick={() => mark(person.id, "absent")}
                  aria-label={`Mark ${person.name} as absent`}
                >
                  Absent
                </button>
              </div>
            </article>
          );
        })}

        {people.length > 0 && filtered.length === 0 && (
          <div className="empty-state" style={{ textAlign: "center", padding: "32px 16px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 600 }}>No participants match your search and filter criteria.</p>
            <button
              type="button"
              className="button"
              onClick={resetFilters}
              style={{
                minHeight: "40px",
                background: "transparent",
                color: "var(--signal, #d64a24)",
                borderColor: "var(--signal, #d64a24)",
              }}
            >
              Reset filters
            </button>
          </div>
        )}

        {!people.length && (
          <div className="empty-state">No participants are registered for this session.</div>
        )}
      </div>
    </>
  );
}
