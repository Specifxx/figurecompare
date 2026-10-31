// POST /api/report: "Report a wrong price" and "Suggest a store", filed in the
// private reports repo (src/lib/reports-github.ts). The site's second function
// (DECISIONS.md, 2026-10-31): POST only, so no page view or crawler runs it, and
// every page stays a static file.
import { handleReportPost } from "@/lib/reports-github";
import { SITE } from "@/site";

export const runtime = "nodejs";

export function POST(req: Request) {
  return handleReportPost(req, "figurecompare", { email: SITE.email });
}
