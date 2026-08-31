import { cache } from "react";
import { repo } from "./index";

/**
 * React's per-request cache, so the admin event layout and whichever page it
 * wraps (Scores/Teams & poules/Instellingen) don't each make their own
 * repo.getEvent() round-trip for the same id — on the mock repo that's a
 * free Map lookup, but on Supabase it's a real network call, and splitting
 * the admin control room into a layout + separate page routes doubled it
 * (layout fetches the event for the header/nav, the page fetches it again
 * for its own data). Same id within one request now resolves to one call.
 */
export const getEventCached = cache((id: string) => repo.getEvent(id));
