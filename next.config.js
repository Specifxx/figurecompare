/** @type {import('next').NextConfig} */
// Cost notes (DECISIONS.md "A fully static site"): every page is prerendered at
// the day's one [deploy] build from the committed data/, so a visit is a CDN
// file, never a function. The only function is eBay's account-deletion hook.
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Store photos are hotlinked from the stores' CDNs at the size we ask for;
  // Vercel image optimisation is billed per source image, so it stays off.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
