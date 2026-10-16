import { EVENT } from "@/lib/event";

export function getSessionLabel(slug: string): string {
  const canonicalSlug = slug === "deepfakes-social-media"
    ? "session-1"
    : slug === "deepfakes-workplace"
    ? "session-2"
    : slug;
  const session = EVENT.sessions.find((item) => item.key === canonicalSlug);
  return session ? `Session ${session.number}` : "Session";
}
