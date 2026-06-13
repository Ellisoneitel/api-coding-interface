#!/usr/bin/env bash
#
# Fresh-start helper for the Codex Local Assistant.
# Works on macOS and on Windows via WSL (run it from inside your WSL shell).
#
# Usage:
#   ./start.sh            # install deps if needed, then start
#   ./start.sh --clean    # free ports, wipe node_modules/build artifacts,
#                         # reinstall dependencies, then start fresh
#
# All arguments are forwarded to run_api.py.

set -euo pipefail

# Run from the script's own directory so it works no matter where it's called.
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "ERROR: Python 3 is required but was not found on PATH." >&2
  echo "Install it from https://www.python.org/ (or 'sudo apt install python3' in WSL)." >&2
  exit 1
fi

exec "$PY" run_api.py "$@"
