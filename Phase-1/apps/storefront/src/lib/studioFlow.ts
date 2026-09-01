export const STUDIO_PATH = "/studio";

/** Shopper path on the slides: save → hang two → keep one → see the bet. */
export const STUDIO_FLOW = [
  {
    id: "save",
    n: "1",
    label: "Save similar",
    hint: "Two or more of the same kind",
    to: "/wishlist"
  },
  {
    id: "hang",
    n: "2",
    label: "Hang two",
    hint: "Same rack. Same gender.",
    to: "/studio?view=room&step=hang"
  },
  {
    id: "keep",
    n: "3",
    label: "Keep one",
    hint: "Name the doubt. Keep one hanger.",
    to: "/studio?view=room&step=keep"
  },
  {
    id: "bet",
    n: "4",
    label: "See the bet",
    hint: "Why this room — scored in the open",
    to: "/studio?view=why"
  }
] as const;

export type StudioFlowId = (typeof STUDIO_FLOW)[number]["id"];

/** Two surfaces a reviewer actually uses, plus the Phase 5 coach on the same page. */
export const STUDIO_TABS = [
  { id: "room", label: "The room" },
  { id: "coach", label: "The coach" },
  { id: "why", label: "Why this room" }
] as const;

export const EVIDENCE_SECTIONS = [
  { id: "bet", label: "The bet" },
  { id: "listen", label: "Live voices" },
  { id: "stories", label: "Why they wait" },
  { id: "questions", label: "Questionnaire" },
  { id: "focus", label: "What matters most" },
  { id: "next", label: "What we'd ask" }
] as const;

export type EvidenceSectionId = (typeof EVIDENCE_SECTIONS)[number]["id"];

export const STUDIO_VIEWS = [
  { id: "room", label: "The room", flow: "hang" },
  { id: "coach", label: "The coach", flow: "keep" },
  { id: "why", label: "Why this room", flow: "bet" },
  { id: "bet", label: "The bet", flow: "bet" },
  { id: "listen", label: "Live voices", flow: "bet" },
  { id: "stories", label: "Why they wait", flow: "bet" },
  { id: "questions", label: "Questionnaire", flow: "bet" },
  { id: "focus", label: "What matters most", flow: "bet" },
  { id: "next", label: "What we'd ask", flow: "bet" }
] as const;

export type StudioViewId = (typeof STUDIO_VIEWS)[number]["id"];

export function isStudioView(value: string | null): value is StudioViewId {
  return STUDIO_VIEWS.some((view) => view.id === value);
}

export function studioSurface(view: string | null): "room" | "why" | "coach" {
  if (!view || view === "room") return "room";
  if (view === "coach") return "coach";
  return "why";
}

export const STUDIO_KEEP_ID = "studio-keep";
export const STUDIO_HANG_ID = "studio-hang";
export const STUDIO_SAVE_ID = "studio-save";
export const STUDIO_ROOM_ID = "studio-room";
export const STUDIO_ENTRY = "/studio?view=room";
export const STUDIO_WHY = "/studio?view=why";
export const STUDIO_COACH = "/studio?view=coach";
export const COACH_ORIGIN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_COACH_URL) || "http://localhost:3100";

export interface CoachBagSnapshot {
  brand: string;
  name: string;
  image?: string;
  price: number;
}

export interface CoachBagMessage {
  source: "shortlist-coach";
  type: "add-to-bag";
  productId: string;
  size: string;
  snapshot?: CoachBagSnapshot;
}

export function isCoachOrigin(origin: string): boolean {
  try {
    return new URL(COACH_ORIGIN).origin === origin || origin === "http://127.0.0.1:3100";
  } catch {
    return origin === "http://localhost:3100" || origin === "http://127.0.0.1:3100";
  }
}

export function isCoachBagMessage(data: unknown): data is CoachBagMessage {
  if (!data || typeof data !== "object") return false;
  const body = data as Record<string, unknown>;
  return (
    body.source === "shortlist-coach" &&
    body.type === "add-to-bag" &&
    typeof body.productId === "string" &&
    body.productId.length > 0 &&
    typeof body.size === "string" &&
    body.size.length > 0
  );
}

export function studioCoach(userId?: string | null): string {
  const params = new URLSearchParams({ view: "coach" });
  if (userId) params.set("user", userId);
  return `${STUDIO_PATH}?${params.toString()}`;
}

export function coachEmbedSrc(userId?: string | null): string {
  const params = new URLSearchParams({ embed: "1" });
  if (userId) params.set("user", userId);
  return `${COACH_ORIGIN}/mvp?${params.toString()}`;
}

export function studioPanelId(view: StudioViewId | EvidenceSectionId): string {
  if (view === "room") return STUDIO_ROOM_ID;
  if (view === "coach") return "studio-view-coach";
  if (view === "why" || view === "bet") return "studio-view-bet";
  return `studio-view-${view}`;
}

export function studioRoom(
  itemId?: string | null,
  step?: "hang" | "keep",
  extra?: { occ?: string | null; pile?: string | null }
): string {
  const params = new URLSearchParams({ view: "room" });
  if (step === "keep") params.set("step", "keep");
  if (step === "hang") params.set("step", "hang");
  if (itemId) params.set("item", itemId);
  if (extra?.occ && extra.occ !== "any") params.set("occ", extra.occ);
  if (extra?.pile) params.set("pile", extra.pile);
  return `${STUDIO_PATH}?${params.toString()}`;
}

export function studioView(view: StudioViewId): string {
  if (view === "room") return STUDIO_ENTRY;
  if (view === "why") return STUDIO_WHY;
  if (view === "coach") return STUDIO_COACH;
  return `${STUDIO_PATH}?view=${view}`;
}

export function hrefForFlowStep(
  id: StudioFlowId,
  itemId?: string | null,
  extra?: { occ?: string | null; pile?: string | null }
): string {
  if (id === "save") return "/wishlist";
  if (id === "bet") return STUDIO_WHY;
  if (id === "keep") return studioRoom(itemId, "keep", extra);
  return studioRoom(itemId, "hang", extra);
}

export function flowFromView(view: StudioViewId, step?: string | null): StudioFlowId {
  if (view === "coach") return "keep";
  if (studioSurface(view) !== "room") return "bet";
  return step === "keep" ? "keep" : "hang";
}

export function scrollToKeepStep() {
  scrollToId(STUDIO_KEEP_ID, STUDIO_ROOM_ID);
}

export function scrollToHangStep() {
  scrollToId(STUDIO_HANG_ID, STUDIO_KEEP_ID);
}

export function activateFlowStep(id: StudioFlowId) {
  if (typeof window === "undefined") return;
  const destPath = id === "save" ? "/wishlist" : STUDIO_PATH;
  if (window.location.pathname !== destPath) return;
  window.setTimeout(() => {
    if (id === "save") scrollToId(STUDIO_SAVE_ID);
    else if (id === "hang") scrollToHangStep();
    else if (id === "keep") scrollToKeepStep();
    else scrollToId(studioPanelId("bet"));
  }, 80);
}

export function activateStudioView(view: StudioViewId) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== STUDIO_PATH) return;
  window.setTimeout(() => {
    if (view === "room") scrollToId(STUDIO_ROOM_ID, STUDIO_KEEP_ID);
    else scrollToId(studioPanelId(view));
  }, 80);
}

export function onStudioNavClick() {
  activateStudioView("room");
}

function scrollToId(id: string, fallback?: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id) ?? (fallback ? document.getElementById(fallback) : null);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}
