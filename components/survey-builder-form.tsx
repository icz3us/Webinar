"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import { QuestionType, Survey, SurveyStatus } from "@/lib/surveys";

type QuestionDraft = {
  id?: string;
  question: string;
  description: string;
  questionType: QuestionType;
  required: boolean;
  options: string[];
  position: number;
};

export default function SurveyBuilderForm({
  initialSurvey,
  sessions,
}: {
  initialSurvey?: Survey | null;
  sessions: { id: string; title: string; slug: string }[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialSurvey?.title ?? "");
  const [description, setDescription] = useState(initialSurvey?.description ?? "");
  const [sessionId, setSessionId] = useState(initialSurvey?.sessionId ?? sessions[0]?.id ?? "");
  const [status, setStatus] = useState<SurveyStatus>(initialSurvey?.status ?? "draft");
  const [publicSlug, setPublicSlug] = useState(initialSurvey?.publicSlug ?? "");
  const [closingAt, setClosingAt] = useState(
    initialSurvey?.closingAt ? new Date(initialSurvey.closingAt).toISOString().slice(0, 16) : ""
  );

  const [questions, setQuestions] = useState<QuestionDraft[]>(
    (initialSurvey?.questions ?? []).map((q, i) => ({
      id: q.id,
      question: q.question,
      description: q.description ?? "",
      questionType: q.questionType,
      required: q.required,
      options: q.options ?? [],
      position: i + 1,
    }))
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function generateSlug(rawTitle: string) {
    return rawTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!initialSurvey && !publicSlug) {
      setPublicSlug(generateSlug(val));
    }
  }

  function addQuestion(type: QuestionType = "short_text") {
    const newQ: QuestionDraft = {
      question: "",
      description: "",
      questionType: type,
      required: true,
      options:
        type === "multiple_choice" || type === "checkbox"
          ? ["Option 1", "Option 2"]
          : [],
      position: questions.length + 1,
    };
    setQuestions([...questions, newQ]);
  }

  function updateQuestion(index: number, updates: Partial<QuestionDraft>) {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    const cloned = [...questions];
    const [moved] = cloned.splice(index, 1);
    cloned.splice(target, 0, moved);
    setQuestions(cloned);
  }

  function addOption(qIndex: number) {
    const q = questions[qIndex];
    const newOptions = [...q.options, `Option ${q.options.length + 1}`];
    updateQuestion(qIndex, { options: newOptions });
  }

  function updateOption(qIndex: number, optIndex: number, val: string) {
    const q = questions[qIndex];
    const newOptions = q.options.map((opt, i) => (i === optIndex ? val : opt));
    updateQuestion(qIndex, { options: newOptions });
  }

  function removeOption(qIndex: number, optIndex: number) {
    const q = questions[qIndex];
    const newOptions = q.options.filter((_, i) => i !== optIndex);
    updateQuestion(qIndex, { options: newOptions });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please provide a survey title.");
      return;
    }
    if (!publicSlug.trim()) {
      setError("Please provide a public slug.");
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one survey question.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setError(`Question #${i + 1} is empty. Please enter question text.`);
        return;
      }
      if (
        (questions[i].questionType === "multiple_choice" ||
          questions[i].questionType === "checkbox") &&
        questions[i].options.length < 2
      ) {
        setError(`Question #${i + 1} requires at least two choices.`);
        return;
      }
    }

    setBusy(true);

    const payload = {
      title,
      description,
      sessionId,
      status,
      publicSlug: publicSlug.toLowerCase().trim(),
      closingAt: closingAt ? new Date(closingAt).toISOString() : null,
      questions: questions.map((q, idx) => ({
        id: q.id,
        question: q.question,
        description: q.description || null,
        questionType: q.questionType,
        required: q.required,
        options: q.options,
        position: idx + 1,
      })),
    };

    try {
      const url = initialSurvey
        ? `/api/admin/surveys/${initialSurvey.id}`
        : "/api/admin/surveys";
      const method = initialSurvey ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save survey.");
      }

      setSuccess("Survey saved successfully.");
      router.push("/admin/surveys");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save survey.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="survey-builder" style={{ maxWidth: "1000px" }}>
      <div
        style={{
          background: "#f8f6ef",
          border: "1px solid var(--line, #c9c7bd)",
          borderTop: "5px solid var(--signal, #d64a24)",
          padding: "28px",
          marginBottom: "32px",
        }}
      >
        <span
          style={{
            font: "600 11px var(--font-geist-mono, monospace)",
            color: "var(--signal, #d64a24)",
            display: "block",
            marginBottom: "8px",
            letterSpacing: "0.06em",
          }}
        >
          METADATA / CONFIGURATION
        </span>
        <h2 style={{ margin: "0 0 20px", fontSize: "24px" }}>Survey Details</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontWeight: 650, marginBottom: "6px" }}>
              Survey Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Session 1 Feedback: Deepfakes in Everyday Social Media"
              style={{
                width: "100%",
                minHeight: "46px",
                padding: "10px 12px",
                border: "1px solid #898a82",
                background: "#fff",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 650, marginBottom: "6px" }}>
              Associated Session *
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              style={{
                width: "100%",
                minHeight: "46px",
                padding: "10px 12px",
                border: "1px solid #898a82",
                background: "#fff",
              }}
            >
              {sessions.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Session 0{idx + 1}: {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 650, marginBottom: "6px" }}>
              Survey Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SurveyStatus)}
              style={{
                width: "100%",
                minHeight: "46px",
                padding: "10px 12px",
                border: "1px solid #898a82",
                background: "#fff",
              }}
            >
              <option value="draft">Draft (organizers only)</option>
              <option value="published">Published (accessible to attendees)</option>
              <option value="closed">Closed (submissions ended)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 650, marginBottom: "6px" }}>
              Public URL Slug *
            </label>
            <input
              type="text"
              required
              value={publicSlug}
              onChange={(e) => setPublicSlug(generateSlug(e.target.value))}
              placeholder="e.g. session-1-feedback-x7k29"
              style={{
                width: "100%",
                minHeight: "46px",
                padding: "10px 12px",
                border: "1px solid #898a82",
                background: "#fff",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            />
            <small style={{ color: "var(--muted, #676860)", display: "block", marginTop: "4px" }}>
              Public link will be: /survey/{publicSlug || "slug"}
            </small>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 650, marginBottom: "6px" }}>
              Closing Date &amp; Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={closingAt}
              onChange={(e) => setClosingAt(e.target.value)}
              style={{
                width: "100%",
                minHeight: "46px",
                padding: "10px 12px",
                border: "1px solid #898a82",
                background: "#fff",
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontWeight: 650, marginBottom: "6px" }}>
              Description / Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thank you for attending this session. Please complete this short survey to provide feedback and unlock certificate eligibility."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #898a82",
                background: "#fff",
                resize: "vertical",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span
              style={{
                font: "600 11px var(--font-geist-mono, monospace)",
                color: "var(--signal, #d64a24)",
                display: "block",
                letterSpacing: "0.06em",
              }}
            >
              FORM DESIGN / QUESTIONS ({questions.length})
            </span>
            <h2 style={{ margin: "4px 0", fontSize: "24px" }}>Question Builder</h2>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="button"
              onClick={() => addQuestion("rating")}
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Plus size={14} /> + Rating (1-5)
            </button>
            <button
              type="button"
              className="button"
              onClick={() => addQuestion("yes_no")}
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Plus size={14} /> + Yes / No
            </button>
            <button
              type="button"
              className="button"
              onClick={() => addQuestion("multiple_choice")}
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Plus size={14} /> + Multiple Choice
            </button>
            <button
              type="button"
              className="button"
              onClick={() => addQuestion("checkbox")}
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Plus size={14} /> + Checkbox
            </button>
            <button
              type="button"
              className="button"
              onClick={() => addQuestion("short_text")}
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Plus size={14} /> + Short Answer
            </button>
            <button
              type="button"
              className="button"
              onClick={() => addQuestion("long_text")}
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Plus size={14} /> + Long Answer
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="empty-state" style={{ background: "#fff", textAlign: "center", padding: "40px 20px" }}>
            <p style={{ margin: "0 0 16px", color: "var(--muted, #676860)" }}>
              No questions added yet. Click one of the buttons above to add your first question.
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => addQuestion("rating")}
            >
              Add Rating Question
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {questions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  background: "#fff",
                  border: "1px solid var(--line, #c9c7bd)",
                  padding: "20px 24px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                    borderBottom: "1px solid #e2e0d8",
                    paddingBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        background: "var(--ink, #171814)",
                        color: "#fff",
                        font: "700 11px var(--font-geist-mono, monospace)",
                        padding: "3px 8px",
                      }}
                    >
                      Q{idx + 1}
                    </span>
                    <strong style={{ fontSize: "13px", textTransform: "uppercase" }}>
                      {q.questionType.replace("_", " ")}
                    </strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, "up")}
                      aria-label="Move question up"
                      style={{
                        padding: "6px 8px",
                        background: "transparent",
                        border: "1px solid #898a82",
                        cursor: idx === 0 ? "not-allowed" : "pointer",
                        opacity: idx === 0 ? 0.3 : 1,
                      }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => moveQuestion(idx, "down")}
                      aria-label="Move question down"
                      style={{
                        padding: "6px 8px",
                        background: "transparent",
                        border: "1px solid #898a82",
                        cursor: idx === questions.length - 1 ? "not-allowed" : "pointer",
                        opacity: idx === questions.length - 1 ? 0.3 : 1,
                      }}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      aria-label="Delete question"
                      style={{
                        padding: "6px 8px",
                        background: "#fff1ed",
                        border: "1px solid #a52b18",
                        color: "#8d2413",
                        cursor: "pointer",
                        marginLeft: "8px",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 650, marginBottom: "4px" }}>
                      Question Text *
                    </label>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                      placeholder="e.g. How would you rate the overall quality of this session?"
                      style={{
                        width: "100%",
                        minHeight: "42px",
                        padding: "8px 10px",
                        border: "1px solid #898a82",
                        background: "#fff",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 650, marginBottom: "4px" }}>
                      Question Type
                    </label>
                    <select
                      value={q.questionType}
                      onChange={(e) =>
                        updateQuestion(idx, {
                          questionType: e.target.value as QuestionType,
                          options:
                            (e.target.value === "multiple_choice" || e.target.value === "checkbox") &&
                            q.options.length === 0
                              ? ["Option 1", "Option 2"]
                              : q.options,
                        })
                      }
                      style={{
                        width: "100%",
                        minHeight: "42px",
                        padding: "8px 10px",
                        border: "1px solid #898a82",
                        background: "#fff",
                      }}
                    >
                      <option value="short_text">Short Answer</option>
                      <option value="long_text">Paragraph / Long Answer</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="checkbox">Checkbox / Multi-select</option>
                      <option value="rating">Rating (1 to 5 scale)</option>
                      <option value="yes_no">Yes / No</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 650, marginBottom: "4px" }}>
                    Helper / Subtitle Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={q.description}
                    onChange={(e) => updateQuestion(idx, { description: e.target.value })}
                    placeholder="e.g. Rate from 1 (poor) to 5 (excellent)"
                    style={{
                      width: "100%",
                      minHeight: "38px",
                      padding: "6px 10px",
                      border: "1px solid #c9c7bd",
                      background: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </div>

                {/* Multiple choice or checkbox options */}
                {(q.questionType === "multiple_choice" || q.questionType === "checkbox") && (
                  <div
                    style={{
                      background: "#f9f8f4",
                      padding: "16px",
                      border: "1px solid #e0ded5",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "12px", textTransform: "uppercase" }}>Options:</strong>
                      <button
                        type="button"
                        onClick={() => addOption(idx)}
                        style={{
                          fontSize: "12px",
                          background: "transparent",
                          border: "1px solid #898a82",
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                      >
                        + Add Option
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted, #676860)", minWidth: "20px" }}>
                            {optIdx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            style={{
                              flex: 1,
                              minHeight: "36px",
                              padding: "6px 10px",
                              border: "1px solid #898a82",
                              background: "#fff",
                            }}
                          />
                          <button
                            type="button"
                            disabled={q.options.length <= 2}
                            onClick={() => removeOption(idx, optIdx)}
                            aria-label={`Remove option ${optIdx + 1}`}
                            style={{
                              padding: "6px 8px",
                              background: "transparent",
                              border: "1px solid #898a82",
                              cursor: q.options.length <= 2 ? "not-allowed" : "pointer",
                              opacity: q.options.length <= 2 ? 0.3 : 1,
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 650,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    Required question
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="form-alert" role="alert" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {success && (
        <div className="operation-message" role="status" style={{ marginBottom: "20px" }}>
          {success}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="submit"
          disabled={busy}
          className="button button-primary"
          style={{ minHeight: "50px", padding: "12px 28px" }}
        >
          {busy ? "Saving survey..." : initialSurvey ? "Update Survey" : "Create Survey"}
        </button>

        {publicSlug && (
          <a
            href={`/survey/${publicSlug}`}
            target="_blank"
            rel="noreferrer"
            className="button"
            style={{ minHeight: "50px" }}
          >
            <Eye size={16} /> Preview Survey
          </a>
        )}

        <button
          type="button"
          onClick={() => router.push("/admin/surveys")}
          className="button"
          style={{ minHeight: "50px" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
