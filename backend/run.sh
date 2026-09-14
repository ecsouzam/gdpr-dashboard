#!/usr/bin/env bash
# Launch the GDPR Dashboard backend (FastAPI + Uvicorn).
# Run this from WSL2. It expects Ollama to be running on the Windows host
# with `qwen2.5:7b` pulled, and listening on all interfaces:
#   (Windows PowerShell)  $env:OLLAMA_HOST="0.0.0.0"; ollama serve
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating it now..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "Starting GDPR Dashboard backend on http://0.0.0.0:8000 ..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
