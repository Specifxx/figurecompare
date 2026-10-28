// IndexNow ownership file: the key from the INDEXNOW_KEY Vercel variable,
// written once at build (static, no function).
export const dynamic = "force-static";
export function GET() {
  const key = process.env.INDEXNOW_KEY;
  return new Response(key || "not configured", { status: key ? 200 : 404, headers: { "Content-Type": "text/plain" } });
}
