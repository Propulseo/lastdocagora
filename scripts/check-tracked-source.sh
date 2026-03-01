#!/usr/bin/env sh
# Exits non-zero if untracked files exist under src/. Delegates to Node for cross-platform use.
set -e
cd "$(dirname "$0")/.."
exec node scripts/check-tracked-source.mjs
