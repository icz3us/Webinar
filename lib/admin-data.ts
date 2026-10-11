import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateSurveysCache } from "@/lib/surveys-cache";

export type AdminRegistration = {
  id: string;
  fullName: string;
  email: string;
  affiliation: string;
  category: string;
  createdAt: string;
  sessions: { id: string; title: string; slug: string }[];
  attendance: { sessionId: string; status: string }[];
  certificates: { sessionId: string; number: string; status: string }[];
};

export type EventDataResult = {
  event: any;
  sessions: any[];
  registrations: AdminRegistration[];
};

import { EVENT } from "@/lib/event";

const DEFAULT_EVENT = {
  id: "placeholder",
  title: "Deepfakes & Digital Trust",
  slug: "deepfakes-digital-trust-2026",
  description: "",
  event_date: EVENT.isoDate,
  created_at: "",
  updated_at: "",
};

// In-memory cache structures with TTL
let cachedEventAndSessions: {
  event: any;
  sessions: any[];
  expiresAt: number;
} | null = null;

let cachedEventData: {
  data: EventDataResult;
  expiresAt: number;
} | null = null;

const CACHE_TTL_EVENT_SESSIONS_MS = 10 * 60 * 1000; // 10 minutes (static metadata)
const CACHE_TTL_EVENT_DATA_MS = 25 * 1000; // 25 seconds (live registration records)

export function invalidateAdminCache() {
  cachedEventData = null;
  cachedEventAndSessions = null;
  invalidateSurveysCache();
}

/**
 * Lightweight query that fetches ONLY event metadata and sessions.
 * Highly cached to avoid scanning the entire registrations table when
 * only session titles or event dates are required.
 */
export async function getEventAndSessions(): Promise<{ event: any; sessions: any[] }> {
  const now = Date.now();
  if (cachedEventAndSessions && now < cachedEventAndSessions.expiresAt) {
    return { event: cachedEventAndSessions.event, sessions: cachedEventAndSessions.sessions };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { event: DEFAULT_EVENT, sessions: [] };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", "deepfakes-digital-trust-2026")
    .single();

  if (eventError || !event) {
    return { event: DEFAULT_EVENT, sessions: [] };
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("event_id", event.id)
    .order("start_time");

  const result = {
    event,
    sessions: sessions ?? [],
  };

  cachedEventAndSessions = {
    ...result,
    expiresAt: now + CACHE_TTL_EVENT_SESSIONS_MS,
  };

  return result;
}

/**
 * Full event and registration loader for the admin dashboard.
 * Backed by in-memory caching to make subsequent tab navigation instantaneous (0-2ms)
 * instead of repeating expensive multi-table joins on every click.
 */
export async function getEventData(options?: { forceFresh?: boolean }): Promise<EventDataResult> {
  const now = Date.now();
  if (!options?.forceFresh && cachedEventData && now < cachedEventData.expiresAt) {
    return cachedEventData.data;
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return {
      event: DEFAULT_EVENT,
      sessions: [],
      registrations: [],
    };
  }

  const { event, sessions } = await getEventAndSessions();
  if (!event || event.id === "placeholder") {
    return {
      event: DEFAULT_EVENT,
      sessions: [],
      registrations: [],
    };
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select(
      "*, registration_sessions(session:sessions(id,title,slug)), attendance(session_id,status), certificates(session_id,certificate_number,status)"
    )
    .eq("event_id", event.id)
    .is("cancelled_at", null)
    .order("created_at", { ascending: false });

  if (registrationsError) throw new Error("Event records could not be loaded.");

  const people: AdminRegistration[] = (registrations ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    affiliation: row.affiliation,
    category: row.participant_category,
    createdAt: row.created_at,
    sessions: (row.registration_sessions ?? []).flatMap((item: any) =>
      item.session ? (Array.isArray(item.session) ? item.session : [item.session]) : []
    ),
    attendance: (row.attendance ?? []).map((item: any) => ({
      sessionId: item.session_id,
      status: item.status,
    })),
    certificates: (row.certificates ?? []).map((item: any) => ({
      sessionId: item.session_id,
      number: item.certificate_number,
      status: item.status,
    })),
  }));

  const result: EventDataResult = {
    event,
    sessions,
    registrations: people,
  };

  cachedEventData = {
    data: result,
    expiresAt: now + CACHE_TTL_EVENT_DATA_MS,
  };

  return result;
}
