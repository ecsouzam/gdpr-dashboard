#!/usr/bin/env bash
# Launch the GDPR Dashboard frontend (Vite dev server).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting GDPR Dashboard frontend on http://localhost:5173 ..."
exec npm run dev -- --host 0.0.0.0
