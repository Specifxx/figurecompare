// Regions that have at least one store: the only ones a visitor can pick.
import { REGIONS } from "@/site";
import { STORES } from "@/content/stores";

export const ACTIVE_REGIONS = REGIONS.filter((r) => STORES.some((s) => s.region === r.code));
