import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { registerSurveysCacheInvalidator } from "@/lib/surveys-cache";
import fs from "node:fs";
import path from "node:path";

export type SurveyStatus = "draft" | "published" | "closed";
export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "checkbox"
  | "rating"
  | "yes_no";

export type SurveyQuestion = {
  id: string;
  surveyId: string;
  question: string;
  description: string | null;
  questionType: QuestionType;
  required: boolean;
  options: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Survey = {
  id: string;
  eventId: string;
  sessionId: string;
  title: string;
  description: string;
  status: SurveyStatus;
  publicSlug: string;
  closingAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
  questions?: SurveyQuestion[];
  session?: { id: string; title: string; slug: string };
};

export type SurveyAnswer = {
  questionId: string;
  answer: string | number | string[];
};

export type SurveyResponseRecord = {
  id: string;
  surveyId: string;
  sessionId: string;
  eventId: string;
  registrationId: string;
  userId: string;
  submittedAt: string;
  answers: SurveyAnswer[];
  participantName?: string;
  participantEmail?: string;
};

export type ParticipantEligibility = {
  registrationId: string;
  userId: string;
  fullName: string;
  email: string;
  affiliation: string;
  category: string;
  sessionId: string;
  sessionSlug: string;
  sessionTitle: string;
  sessionNumber: string;
  registered: boolean;
  attendanceStatus: "present" | "absent" | "not_marked";
  surveyCompleted: boolean;
  surveyId: string | null;
  surveyTitle: string | null;
  surveySlug: string | null;
  certificateEligible: boolean;
  certificateGenerated: boolean;
  certificateNumber: string | null;
  certificateStatus: string | null;
  certificateIssuedAt: string | null;
};

const LOCAL_STORE_FILE = path.join(process.cwd(), "lib", ".surveys-data.json");

type LocalStore = {
  surveys: (Survey & { questions: SurveyQuestion[] })[];
  responses: SurveyResponseRecord[];
};

function getInitialLocalStore(): LocalStore {
  const eventId = "6e3f36c6-431a-4f00-b146-34daad437e2f";
  const session1Id = "70b39a4e-aeba-4560-b9fe-f691e78cc029";
  const session2Id = "4d39b14d-f6af-4f81-9fda-d9f29f67dc12";

  return {
    surveys: [
      {
        id: "survey-session-1-default",
        eventId,
        sessionId: session1Id,
        title: "Session 1 Feedback: Deepfakes in Everyday Social Media",
        description:
          "Thank you for attending Session 1. Please complete this brief survey to provide feedback and unlock certificate eligibility.",
        status: "published",
        publicSlug: "session-1-feedback-social",
        closingAt: null,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        closedAt: null,
        session: {
          id: session1Id,
          slug: "session-1",
          title: "Deepfakes in Everyday Social Media (TikTok, Facebook, Instagram)",
        },
        questions: [
          {
            id: "q1-1",
            surveyId: "survey-session-1-default",
            question: "How would you rate the overall quality of Session 1?",
            description: "Please rate from 1 (poor) to 5 (excellent).",
            questionType: "rating",
            required: true,
            options: [],
            position: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q1-2",
            surveyId: "survey-session-1-default",
            question: "Was the presentation material clear and easy to follow?",
            description: null,
            questionType: "yes_no",
            required: true,
            options: [],
            position: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q1-3",
            surveyId: "survey-session-1-default",
            question: "Which session segment did you find most informative?",
            description: "Select the topic that stood out most.",
            questionType: "multiple_choice",
            required: true,
            options: [
              "How AI is Changing Social Media",
              "Spotting Everyday Fakes",
              "Speaker Discussions",
              "Q&A Segment",
            ],
            position: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q1-4",
            surveyId: "survey-session-1-default",
            question: "Which platforms do you frequently encounter synthetic media on?",
            description: "Select all that apply.",
            questionType: "checkbox",
            required: false,
            options: [
              "TikTok",
              "Facebook",
              "Instagram",
              "X (Twitter)",
              "YouTube",
              "Messaging Apps",
            ],
            position: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q1-5",
            surveyId: "survey-session-1-default",
            question: "What was your primary takeaway from this session?",
            description: "Briefly share key lessons learned.",
            questionType: "long_text",
            required: true,
            options: [],
            position: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q1-6",
            surveyId: "survey-session-1-default",
            question: "Any suggestions or additional comments for the speakers?",
            description: "Optional feedback.",
            questionType: "short_text",
            required: false,
            options: [],
            position: 6,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: "survey-session-2-default",
        eventId,
        sessionId: session2Id,
        title: "Session 2 Feedback: Deepfakes in the Workplace and School",
        description:
          "Thank you for attending Session 2. Please complete this brief survey to provide feedback and unlock certificate eligibility.",
        status: "published",
        publicSlug: "session-2-feedback-workplace",
        closingAt: null,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        closedAt: null,
        session: {
          id: session2Id,
          slug: "session-2",
          title: "Deepfakes in the Workplace and School (Email, Google Meet, News)",
        },
        questions: [
          {
            id: "q2-1",
            surveyId: "survey-session-2-default",
            question: "How would you rate the overall quality of Session 2?",
            description: "Please rate from 1 (poor) to 5 (excellent).",
            questionType: "rating",
            required: true,
            options: [],
            position: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q2-2",
            surveyId: "survey-session-2-default",
            question: "Did this session improve your understanding of verification techniques in school or work?",
            description: null,
            questionType: "yes_no",
            required: true,
            options: [],
            position: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q2-3",
            surveyId: "survey-session-2-default",
            question: "Which workplace or academic risk felt most relevant to your environment?",
            description: "Select one.",
            questionType: "multiple_choice",
            required: true,
            options: [
              "Executive Impersonation / Voice Cloning",
              "Phishing with Generative AI",
              "Academic Integrity and Deepfakes",
              "Media Manipulation in News",
            ],
            position: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q2-4",
            surveyId: "survey-session-2-default",
            question: "Which verification habits do you plan to adopt?",
            description: "Select all that apply.",
            questionType: "checkbox",
            required: false,
            options: [
              "Multi-channel verification",
              "Examining metadata and artifacts",
              "Direct voice or video confirmation",
              "Institutional reporting protocols",
            ],
            position: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q2-5",
            surveyId: "survey-session-2-default",
            question: "What was your primary takeaway from this session?",
            description: "Briefly share key lessons learned.",
            questionType: "long_text",
            required: true,
            options: [],
            position: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "q2-6",
            surveyId: "survey-session-2-default",
            question: "Any suggestions or additional comments for the speakers?",
            description: "Optional feedback.",
            questionType: "short_text",
            required: false,
            options: [],
            position: 6,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ],
    responses: [],
  };
}

function readLocalStore(): LocalStore {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // If read fails, initialize
  }
  const init = getInitialLocalStore();
  writeLocalStore(init);
  return init;
}

function writeLocalStore(store: LocalStore) {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

let cachedTableAvailable: boolean | null = null;
let cachedTableAvailableExpiresAt = 0;

async function isSupabaseTableAvailable(): Promise<boolean> {
  const now = Date.now();
  if (cachedTableAvailable !== null && now < cachedTableAvailableExpiresAt) {
    return cachedTableAvailable;
  }
  const supabase = createAdminClient();
  if (!supabase) {
    cachedTableAvailable = false;
    cachedTableAvailableExpiresAt = now + 60_000;
    return false;
  }
  try {
    const { error } = await supabase.from("surveys").select("id").limit(1);
    cachedTableAvailable = !error;
    cachedTableAvailableExpiresAt = now + (cachedTableAvailable ? 300_000 : 30_000);
    return cachedTableAvailable;
  } catch {
    cachedTableAvailable = false;
    cachedTableAvailableExpiresAt = now + 30_000;
    return false;
  }
}

export type SurveySummary = {
  id: string;
  sessionId: string;
  sessionSlug?: string;
  title: string;
  publicSlug: string;
};

// In-memory cache structures with TTL
let cachedSurveys: { data: Survey[]; expiresAt: number } | null = null;
let cachedSurveysSummary: { data: SurveySummary[]; expiresAt: number } | null = null;
let cachedResponseCounts: { data: Record<string, number>; expiresAt: number } | null = null;
let cachedEligibility: { data: ParticipantEligibility[]; key: string; expiresAt: number } | null = null;

export function clearSurveysMemoryCache() {
  cachedSurveys = null;
  cachedSurveysSummary = null;
  cachedResponseCounts = null;
  cachedEligibility = null;
}

registerSurveysCacheInvalidator(() => {
  clearSurveysMemoryCache();
});

export async function getPublishedSurveysSummary(): Promise<SurveySummary[]> {
  const now = Date.now();
  if (cachedSurveysSummary && now < cachedSurveysSummary.expiresAt) {
    return cachedSurveysSummary.data;
  }

  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data: surveys, error } = await supabase
      .from("surveys")
      .select("id, session_id, title, status, public_slug, session:sessions(id, title, slug)")
      .eq("status", "published");

    if (!error && surveys) {
      const result = surveys.map((s) => {
        const session = Array.isArray(s.session) ? s.session[0] : s.session;
        return {
          id: s.id,
          sessionId: s.session_id,
          sessionSlug: session?.slug,
          title: s.title,
          publicSlug: s.public_slug,
        };
      });
      cachedSurveysSummary = { data: result, expiresAt: now + 30_000 };
      return result;
    }
  }

  const local = readLocalStore();
  const result = local.surveys
    .filter((s) => s.status === "published")
    .map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      sessionSlug: s.session?.slug,
      title: s.title,
      publicSlug: s.publicSlug,
    }));
  cachedSurveysSummary = { data: result, expiresAt: now + 30_000 };
  return result;
}

/**
 * Returns response counts for all surveys in a single query.
 * Replaces expensive N-query waterfalls where all answers were fetched just for .length.
 */
export async function getSurveyResponseCounts(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedResponseCounts && now < cachedResponseCounts.expiresAt) {
    return cachedResponseCounts.data;
  }

  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data, error } = await supabase
      .from("survey_responses")
      .select("survey_id");

    if (!error && data) {
      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.survey_id] = (counts[row.survey_id] || 0) + 1;
      }
      cachedResponseCounts = { data: counts, expiresAt: now + 20_000 };
      return counts;
    }
  }

  const local = readLocalStore();
  const counts: Record<string, number> = {};
  for (const resp of local.responses) {
    counts[resp.surveyId] = (counts[resp.surveyId] || 0) + 1;
  }
  cachedResponseCounts = { data: counts, expiresAt: now + 20_000 };
  return counts;
}

export async function getSurveys(): Promise<Survey[]> {
  const now = Date.now();
  if (cachedSurveys && now < cachedSurveys.expiresAt) {
    return cachedSurveys.data;
  }

  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data: surveys, error } = await supabase
      .from("surveys")
      .select("*, session:sessions(id, title, slug), questions:survey_questions(*)")
      .order("created_at", { ascending: false });

    if (!error && surveys) {
      const result = surveys.map((s) => ({
        id: s.id,
        eventId: s.event_id,
        sessionId: s.session_id,
        title: s.title,
        description: s.description,
        status: s.status,
        publicSlug: s.public_slug,
        closingAt: s.closing_at,
        createdBy: s.created_by,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        publishedAt: s.published_at,
        closedAt: s.closed_at,
        session: Array.isArray(s.session) ? s.session[0] : s.session,
        questions: (s.questions ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position).map((q: any) => ({
          id: q.id,
          surveyId: q.survey_id,
          question: q.question,
          description: q.description,
          questionType: q.question_type,
          required: q.required,
          options: Array.isArray(q.options) ? q.options : [],
          position: q.position,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
      }));
      cachedSurveys = { data: result, expiresAt: now + 30_000 };
      return result;
    }
  }

  const local = readLocalStore();
  cachedSurveys = { data: local.surveys, expiresAt: now + 30_000 };
  return local.surveys;
}

export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data, error } = await supabase
      .from("surveys")
      .select("*, session:sessions(id, title, slug), questions:survey_questions(*)")
      .eq("public_slug", slug)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        eventId: data.event_id,
        sessionId: data.session_id,
        title: data.title,
        description: data.description,
        status: data.status,
        publicSlug: data.public_slug,
        closingAt: data.closing_at,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        closedAt: data.closed_at,
        session: Array.isArray(data.session) ? data.session[0] : data.session,
        questions: (data.questions ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position).map((q: any) => ({
          id: q.id,
          surveyId: q.survey_id,
          question: q.question,
          description: q.description,
          questionType: q.question_type,
          required: q.required,
          options: Array.isArray(q.options) ? q.options : [],
          position: q.position,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
      };
    }
  }

  const local = readLocalStore();
  const found = local.surveys.find((s) => s.publicSlug === slug);
  return found ?? null;
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data, error } = await supabase
      .from("surveys")
      .select("*, session:sessions(id, title, slug), questions:survey_questions(*)")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        eventId: data.event_id,
        sessionId: data.session_id,
        title: data.title,
        description: data.description,
        status: data.status,
        publicSlug: data.public_slug,
        closingAt: data.closing_at,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        closedAt: data.closed_at,
        session: Array.isArray(data.session) ? data.session[0] : data.session,
        questions: (data.questions ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position).map((q: any) => ({
          id: q.id,
          surveyId: q.survey_id,
          question: q.question,
          description: q.description,
          questionType: q.question_type,
          required: q.required,
          options: Array.isArray(q.options) ? q.options : [],
          position: q.position,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
      };
    }
  }

  const local = readLocalStore();
  const found = local.surveys.find((s) => s.id === id);
  return found ?? null;
}

export async function getSurveyBySessionId(sessionId: string): Promise<Survey | null> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data, error } = await supabase
      .from("surveys")
      .select("*, session:sessions(id, title, slug), questions:survey_questions(*)")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        eventId: data.event_id,
        sessionId: data.session_id,
        title: data.title,
        description: data.description,
        status: data.status,
        publicSlug: data.public_slug,
        closingAt: data.closing_at,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
        closedAt: data.closed_at,
        session: Array.isArray(data.session) ? data.session[0] : data.session,
        questions: (data.questions ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position).map((q: any) => ({
          id: q.id,
          surveyId: q.survey_id,
          question: q.question,
          description: q.description,
          questionType: q.question_type,
          required: q.required,
          options: Array.isArray(q.options) ? q.options : [],
          position: q.position,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
      };
    }
  }

  const local = readLocalStore();
  const found = local.surveys.find((s) => s.sessionId === sessionId);
  return found ?? null;
}

export async function saveSurvey(
  surveyData: {
    id?: string;
    sessionId: string;
    title: string;
    description: string;
    status: SurveyStatus;
    publicSlug: string;
    closingAt?: string | null;
    questions: {
      id?: string;
      question: string;
      description?: string | null;
      questionType: QuestionType;
      required: boolean;
      options: string[];
      position: number;
    }[];
  },
  userId: string
): Promise<Survey> {
  const isDb = await isSupabaseTableAvailable();
  const supabase = createAdminClient();

  let eventId = "6e3f36c6-431a-4f00-b146-34daad437e2f";
  if (supabase) {
    const { data: ev } = await supabase.from("events").select("id").eq("slug", "deepfakes-digital-trust-2026").maybeSingle();
    if (ev) eventId = ev.id;
  }

  const now = new Date().toISOString();
  const surveyId = surveyData.id || `survey-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const questions: SurveyQuestion[] = surveyData.questions.map((q, idx) => ({
    id: q.id || `q-${surveyId}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
    surveyId,
    question: q.question.trim(),
    description: q.description?.trim() || null,
    questionType: q.questionType,
    required: q.required,
    options: q.options.map((opt) => opt.trim()).filter(Boolean),
    position: idx + 1,
    createdAt: now,
    updatedAt: now,
  }));

  if (isDb && supabase) {
    const upsertSurvey = {
      id: surveyData.id || undefined,
      event_id: eventId,
      session_id: surveyData.sessionId,
      title: surveyData.title.trim(),
      description: surveyData.description.trim(),
      status: surveyData.status,
      public_slug: surveyData.publicSlug.trim().toLowerCase(),
      closing_at: surveyData.closingAt || null,
      updated_at: now,
      created_by: userId,
      published_at: surveyData.status === "published" ? now : null,
      closed_at: surveyData.status === "closed" ? now : null,
    };

    const { data: saved, error } = await supabase
      .from("surveys")
      .upsert(upsertSurvey, { onConflict: "id" })
      .select("id")
      .single();

    if (!error && saved) {
      const finalSurveyId = saved.id;
      await supabase.from("survey_questions").delete().eq("survey_id", finalSurveyId);

      const rows = questions.map((q, i) => ({
        survey_id: finalSurveyId,
        question: q.question,
        description: q.description,
        question_type: q.questionType,
        required: q.required,
        options: q.options,
        position: i + 1,
      }));

      await supabase.from("survey_questions").insert(rows);
      const res = await getSurveyById(finalSurveyId);
      if (res) {
        clearSurveysMemoryCache();
        return res;
      }
    }
  }

  // Fallback / sync local store
  const local = readLocalStore();
  const existingIdx = local.surveys.findIndex((s) => s.id === surveyId || s.publicSlug === surveyData.publicSlug);

  const newSurvey: Survey & { questions: SurveyQuestion[] } = {
    id: surveyId,
    eventId,
    sessionId: surveyData.sessionId,
    title: surveyData.title.trim(),
    description: surveyData.description.trim(),
    status: surveyData.status,
    publicSlug: surveyData.publicSlug.trim().toLowerCase(),
    closingAt: surveyData.closingAt || null,
    createdBy: userId,
    createdAt: existingIdx >= 0 ? local.surveys[existingIdx].createdAt : now,
    updatedAt: now,
    publishedAt: surveyData.status === "published" ? now : null,
    closedAt: surveyData.status === "closed" ? now : null,
    questions,
  };

  if (existingIdx >= 0) {
    local.surveys[existingIdx] = newSurvey;
  } else {
    local.surveys.unshift(newSurvey);
  }
  writeLocalStore(local);
  clearSurveysMemoryCache();

  return newSurvey;
}

export async function deleteSurvey(surveyId: string): Promise<boolean> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    await supabase.from("surveys").delete().eq("id", surveyId);
  }

  const local = readLocalStore();
  local.surveys = local.surveys.filter((s) => s.id !== surveyId);
  local.responses = local.responses.filter((r) => r.surveyId !== surveyId);
  writeLocalStore(local);
  clearSurveysMemoryCache();
  return true;
}

export async function duplicateSurvey(surveyId: string, userId: string): Promise<Survey | null> {
  const original = await getSurveyById(surveyId);
  if (!original) return null;

  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const newSlug = `${original.publicSlug}-copy-${randomSuffix}`;
  const newTitle = `${original.title} (Copy)`;

  return saveSurvey(
    {
      sessionId: original.sessionId,
      title: newTitle,
      description: original.description,
      status: "draft",
      publicSlug: newSlug,
      closingAt: null,
      questions: (original.questions ?? []).map((q) => ({
        question: q.question,
        description: q.description,
        questionType: q.questionType,
        required: q.required,
        options: q.options,
        position: q.position,
      })),
    },
    userId
  );
}

export async function updateSurveyStatus(
  surveyId: string,
  status: SurveyStatus
): Promise<Survey | null> {
  const survey = await getSurveyById(surveyId);
  if (!survey) return null;

  const now = new Date().toISOString();
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    await supabase
      .from("surveys")
      .update({
        status,
        published_at: status === "published" ? now : survey.publishedAt,
        closed_at: status === "closed" ? now : null,
        updated_at: now,
      })
      .eq("id", surveyId);
  }

  const local = readLocalStore();
  const found = local.surveys.find((s) => s.id === surveyId);
  clearSurveysMemoryCache();
  if (found) {
    found.status = status;
    found.updatedAt = now;
    if (status === "published") found.publishedAt = now;
    if (status === "closed") found.closedAt = now;
    writeLocalStore(local);
    return found;
  }
  return getSurveyById(surveyId);
}

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponseRecord[]> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data: responses, error } = await supabase
      .from("survey_responses")
      .select("*, registration:registrations(full_name, email), answers:survey_answers(question_id, answer)")
      .eq("survey_id", surveyId)
      .order("submitted_at", { ascending: false });

    if (!error && responses) {
      return responses.map((r) => {
        const reg = Array.isArray(r.registration) ? r.registration[0] : r.registration;
        return {
          id: r.id,
          surveyId: r.survey_id,
          sessionId: r.session_id,
          eventId: r.event_id,
          registrationId: r.registration_id,
          userId: r.user_id,
          submittedAt: r.submitted_at,
          participantName: reg?.full_name ?? "Participant",
          participantEmail: reg?.email ?? "",
          answers: (r.answers ?? []).map((a: any) => ({
            questionId: a.question_id,
            answer: a.answer,
          })),
        };
      });
    }
  }

  const local = readLocalStore();
  return local.responses.filter((r) => r.surveyId === surveyId);
}

export async function hasUserSubmittedSurvey(
  registrationId: string,
  surveyIdOrSessionId: string
): Promise<boolean> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("registration_id", registrationId)
      .or(`survey_id.eq.${surveyIdOrSessionId},session_id.eq.${surveyIdOrSessionId}`)
      .limit(1)
      .maybeSingle();

    if (data) return true;
  }

  const local = readLocalStore();
  return local.responses.some(
    (r) =>
      r.registrationId === registrationId &&
      (r.surveyId === surveyIdOrSessionId || r.sessionId === surveyIdOrSessionId)
  );
}

export async function submitSurveyResponse(params: {
  surveyId: string;
  sessionId: string;
  eventId: string;
  registrationId: string;
  userId: string;
  participantName?: string;
  participantEmail?: string;
  answers: { questionId: string; answer: string | number | string[] }[];
}): Promise<{ success: boolean; responseId: string; error?: string }> {
  // Check if already submitted
  const alreadyDone = await hasUserSubmittedSurvey(params.registrationId, params.surveyId);
  if (alreadyDone) {
    return { success: false, responseId: "", error: "You have already completed this survey." };
  }

  const alreadySessionDone = await hasUserSubmittedSurvey(params.registrationId, params.sessionId);
  if (alreadySessionDone) {
    return { success: false, responseId: "", error: "You have already completed the survey for this session." };
  }

  const now = new Date().toISOString();
  const responseId = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data: inserted, error } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: params.surveyId,
        session_id: params.sessionId,
        event_id: params.eventId,
        registration_id: params.registrationId,
        user_id: params.userId,
        submitted_at: now,
      })
      .select("id")
      .single();

    if (!error && inserted) {
      const finalId = inserted.id;
      const answerRows = params.answers.map((a) => ({
        response_id: finalId,
        question_id: a.questionId,
        answer: a.answer,
      }));
      await supabase.from("survey_answers").insert(answerRows);

      // Check if participant was already marked present
      // If present, automatically issue certificate now that all 3 conditions are satisfied!
      const { data: attendance } = await supabase
        .from("attendance")
        .select("status")
        .eq("registration_id", params.registrationId)
        .eq("session_id", params.sessionId)
        .maybeSingle();

      if (attendance?.status === "present") {
        const { data: existingCert } = await supabase
          .from("certificates")
          .select("id")
          .eq("registration_id", params.registrationId)
          .eq("session_id", params.sessionId)
          .maybeSingle();

        if (!existingCert) {
          await supabase.from("certificates").insert({
            registration_id: params.registrationId,
            session_id: params.sessionId,
            generated_by: params.userId,
            status: "issued",
            issued_at: now,
          });
        }
      }

      return { success: true, responseId: finalId };
    }
  }

  // Save to local store
  const local = readLocalStore();
  const record: SurveyResponseRecord = {
    id: responseId,
    surveyId: params.surveyId,
    sessionId: params.sessionId,
    eventId: params.eventId,
    registrationId: params.registrationId,
    userId: params.userId,
    submittedAt: now,
    answers: params.answers,
    participantName: params.participantName,
    participantEmail: params.participantEmail,
  };
  local.responses.push(record);
  writeLocalStore(local);

  // If in local/Supabase hybrid, check attendance in Supabase
  const supabase = createAdminClient();
  if (supabase) {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("registration_id", params.registrationId)
      .eq("session_id", params.sessionId)
      .maybeSingle();

    if (attendance?.status === "present") {
      const { data: existingCert } = await supabase
        .from("certificates")
        .select("id")
        .eq("registration_id", params.registrationId)
        .eq("session_id", params.sessionId)
        .maybeSingle();

      if (!existingCert) {
        await supabase.from("certificates").insert({
          registration_id: params.registrationId,
          session_id: params.sessionId,
          generated_by: params.userId,
          status: "issued",
          issued_at: now,
        });
      }
    }
  }

  clearSurveysMemoryCache();
  return { success: true, responseId };
}

export async function getCompletedSurveySessionIds(registrationId: string): Promise<Set<string>> {
  const isDb = await isSupabaseTableAvailable();
  if (isDb) {
    const supabase = createAdminClient()!;
    const { data } = await supabase
      .from("survey_responses")
      .select("session_id")
      .eq("registration_id", registrationId);

    if (data) {
      return new Set(data.map((r) => r.session_id));
    }
  }

  const local = readLocalStore();
  const set = new Set<string>();
  for (const r of local.responses) {
    if (r.registrationId === registrationId) {
      set.add(r.sessionId);
    }
  }
  return set;
}

export async function getAllEligibilityRecords(
  filterSessionId?: string,
  preloadedData?: { sessions: any[]; registrations: any[] }
): Promise<ParticipantEligibility[]> {
  const cacheKey = filterSessionId || "all";
  const now = Date.now();
  if (!preloadedData && cachedEligibility && cachedEligibility.key === cacheKey && now < cachedEligibility.expiresAt) {
    return cachedEligibility.data;
  }

  const supabase = createAdminClient();
  const surveys = await getSurveys();

  // Load registrations, attendance, certificates
  let registrations: any[] = [];
  let sessions: any[] = [];

  if (preloadedData) {
    sessions = preloadedData.sessions;
    registrations = preloadedData.registrations;
  } else if (supabase) {
    const { data: ev } = await supabase.from("events").select("id").eq("slug", "deepfakes-digital-trust-2026").single();
    if (ev) {
      const [sessRes, regRes] = await Promise.all([
        supabase.from("sessions").select("*").eq("event_id", ev.id).order("start_time"),
        supabase
          .from("registrations")
          .select("*, registration_sessions(session:sessions(id,title,slug)), attendance(session_id,status), certificates(session_id,certificate_number,status,issued_at)")
          .eq("event_id", ev.id)
          .is("cancelled_at", null)
          .order("created_at", { ascending: false }),
      ]);
      sessions = sessRes.data ?? [];
      registrations = regRes.data ?? [];
    }
  }

  // Pre-fetch all survey responses
  const completedSessionMap = new Map<string, Set<string>>(); // regId -> Set of sessionIds
  const isDb = await isSupabaseTableAvailable();
  if (isDb && supabase) {
    const { data: allResp } = await supabase.from("survey_responses").select("registration_id, session_id");
    for (const item of allResp ?? []) {
      if (!completedSessionMap.has(item.registration_id)) {
        completedSessionMap.set(item.registration_id, new Set());
      }
      completedSessionMap.get(item.registration_id)!.add(item.session_id);
    }
  } else {
    const local = readLocalStore();
    for (const item of local.responses) {
      if (!completedSessionMap.has(item.registrationId)) {
        completedSessionMap.set(item.registrationId, new Set());
      }
      completedSessionMap.get(item.registrationId)!.add(item.sessionId);
    }
  }

  const records: ParticipantEligibility[] = [];

  for (const reg of registrations) {
    const regSessions = (reg.registration_sessions ?? []).flatMap((item: any) =>
      item.session ? (Array.isArray(item.session) ? item.session : [item.session]) : []
    );

    const attMap = new Map(
      (reg.attendance ?? []).map((a: any) => [a.session_id || a.sessionId, a.status])
    );
    const certMap = new Map(
      (reg.certificates ?? []).map((c: any) => [c.session_id || c.sessionId, c])
    );

    const completedSessions = completedSessionMap.get(reg.id) ?? new Set<string>();

    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i];
      if (filterSessionId && filterSessionId !== "all" && sess.id !== filterSessionId && sess.slug !== filterSessionId) {
        continue;
      }

      const isReg = regSessions.some((s: any) => s.id === sess.id || s.slug === sess.slug);
      const attStatus = ((attMap.get(sess.id) ?? "not_marked") as "present" | "absent" | "not_marked");
      const isPresent = attStatus === "present";
      const surveyCompleted = completedSessions.has(sess.id);
      const cert = certMap.get(sess.id) as
        | { status?: string; certificate_number?: string; number?: string; issued_at?: string }
        | undefined;

      const matchingSurvey = surveys.find((s) => s.sessionId === sess.id);

      // Strict triple condition: Registered + Present + Survey completed
      const isEligible = isReg && isPresent && surveyCompleted;

      records.push({
        registrationId: reg.id,
        userId: reg.user_id,
        fullName: reg.full_name || reg.fullName,
        email: reg.email,
        affiliation: reg.affiliation,
        category: reg.participant_category || reg.category,
        sessionId: sess.id,
        sessionSlug: sess.slug,
        sessionTitle: sess.title,
        sessionNumber: `0${i + 1}`,
        registered: isReg,
        attendanceStatus: attStatus,
        surveyCompleted,
        surveyId: matchingSurvey?.id ?? null,
        surveyTitle: matchingSurvey?.title ?? null,
        surveySlug: matchingSurvey?.publicSlug ?? null,
        certificateEligible: isEligible,
        certificateGenerated: Boolean(cert && cert.status !== "revoked"),
        certificateNumber: cert?.certificate_number ?? cert?.number ?? null,
        certificateStatus: cert?.status ?? null,
        certificateIssuedAt: cert?.issued_at ?? null,
      });
    }
  }

  if (!preloadedData) {
    cachedEligibility = { data: records, key: cacheKey, expiresAt: now + 20_000 };
  }
  return records;
}
