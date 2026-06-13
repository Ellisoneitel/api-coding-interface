#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ "${1:-}" = "--clean" ] || [ "${1:-}" = "--fresh" ]; then
  echo "Removing installed dependencies and build output..."
  rm -rf node_modules client/node_modules server/node_modules dist client/dist
  shift
fi

if [ ! -d node_modules ]; then
  bash ./setup.sh
fi

echo "Starting the development server..."
npm run dev "$@"
