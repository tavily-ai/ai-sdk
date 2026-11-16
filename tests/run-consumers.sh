#!/usr/bin/env bash
# Packs this package and, for each advertised AI SDK major, installs it into a clean consumer with the
# matching provider adapter, typechecks consumer-types.ts and runs consumer.mjs. Offline apart from npm.
# Usage: pnpm test:consumers [ai-major...]   (default: 5 6 7)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

openai_major() { case "$1" in 5) echo 2 ;; 6) echo 3 ;; 7) echo 4 ;; esac; }

(cd "$root" && pnpm build >/dev/null)
tarball="$work/$(cd "$root" && npm pack --silent --pack-destination "$work")"

[ $# -gt 0 ] || set -- 5 6 7
for major in "$@"; do
  dir="$work/ai-$major"
  mkdir "$dir" && cd "$dir"
  echo '{ "name": "consumer", "private": true, "type": "module" }' > package.json
  npm install --silent --no-audit --no-fund "$tarball" "ai@$major" "@ai-sdk/openai@$(openai_major "$major")" zod@4 typescript@6 @types/node
  cp "$root/tests/consumer-types.ts" "$root/tests/consumer.mjs" .
  npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler --types node consumer-types.ts
  echo "ai@$(node -p "require('ai/package.json').version") types OK"
  node consumer.mjs
done
