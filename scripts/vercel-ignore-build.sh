#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json `ignoreCommand`), copied from Rift
# Compare's scripts/vercel-ignore-build.sh, where it ended a run of exhausted
# Neon projects: every production build re-renders the site and clears the ISR
# page cache, so 10–30 pushes a day cost more than all real traffic.
#
#   exit 0 → skip (no deployment)      exit 1 → build
#
# Production builds only when the commit SUBJECT (first line, never the body)
# carries [deploy] (any case). .github/workflows/production-deploy.yml lands one
# such commit a day after the price import. Preview/development builds need
# [preview] in the subject. claude/* branches never deploy (vercel.json).
# An unreadable message builds production (fail open) and never a preview.
set -u

msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"
[ -z "$msg" ] && msg="$(git log -1 --format=%B 2>/dev/null || true)"
subject="$(printf '%s\n' "$msg" | head -n 1)"
env="${VERCEL_ENV:-}"

if [ "$env" = "preview" ] || [ "$env" = "development" ]; then
  if [ -n "$subject" ] && printf '%s' "$subject" | grep -qiF -- '[preview]'; then
    echo "[ignore-build] $env build requested by [preview] in the subject."
    exit 1
  fi
  echo "[ignore-build] $env builds are off unless the commit subject carries [preview]."
  exit 0
fi

if [ -z "$msg" ]; then
  echo "[ignore-build] commit message unreadable — building production to fail open."
  exit 1
fi

if printf '%s' "$subject" | grep -qiF -- '[deploy]'; then
  echo "[ignore-build] [deploy] in the subject — building production."
  exit 1
fi
echo "[ignore-build] no [deploy] in the subject — skipping; the daily release will ship it."
exit 0
