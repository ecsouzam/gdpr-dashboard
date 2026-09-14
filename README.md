# GDPR / DPIA Compliance Dashboard

An AI-powered dashboard that audits system architecture documentation
(PDF, DOCX, or TXT) against core GDPR principles using a locally hosted
LLM (Qwen2.5:7b via Ollama) — no document data leaves your network.

## Architecture

- **Backend**: FastAPI (Python), running in WSL2. Extracts text from
  uploaded documents and sends a structured audit prompt to Ollama.
- **Frontend**: React + Vite + Tailwind CSS, running in WSL2.
- **LLM**: Ollama running `qwen2.5:7b` on the **Windows host**. The
  backend auto-detects the Windows host IP from WSL2's default route.

```
Windows host: Ollama (qwen2.5:7b) on 0.0.0.0:11434
      ^
      | http://<auto-detected-windows-ip>:11434/api/generate
      |
WSL2: FastAPI backend (:8000)  <--fetch--  React frontend (:5173)
```

## Prerequisites

1. **On Windows**: [Ollama](https://ollama.com) installed, with the model pulled:
   ```powershell
   ollama pull qwen2.5:7b
   ```
   Ollama must listen on all interfaces so WSL2 can reach it:
   ```powershell
   $env:OLLAMA_HOST = "0.0.0.0"
   ollama serve
   ```
2. **In WSL2**: Python 3.10+ and Node.js 18+.

## Backend setup & run

```bash
cd backend
./run.sh
```

The script creates a virtual environment on first run, installs
dependencies from `requirements.txt`, and starts the API at
`http://0.0.0.0:8000` (interactive docs at `/docs`).

To verify Ollama connectivity:

```bash
curl http://localhost:8000/health
```

If you need to override the auto-detected host, copy `.env.example` to
`.env` in `backend/` and set `OLLAMA_HOST_IP`.

## Frontend setup & run

```bash
cd frontend
./run.sh
```

Installs dependencies on first run and starts the Vite dev server at
`http://localhost:5173`.

If your backend runs on a non-default host/port, copy `frontend/.env.example`
to `frontend/.env` and set `VITE_API_BASE_URL`.

## Usage

1. Open `http://localhost:5173`.
2. Drag and drop (or click to browse) a `.pdf`, `.docx`, or `.txt`
   architecture document.
3. Click **Run GDPR Compliance Analysis**.
4. Review the overall compliance score, categorized risk findings
   (High / Medium / Low), and the extracted personal data inventory.

## Project layout

```
backend/
  main.py            FastAPI app, /analyze and /health endpoints
  ollama_client.py    WSL2 -> Windows host IP detection + Ollama client
  text_extraction.py  PDF/DOCX/TXT text extraction
  gdpr_prompt.py       System prompt + JSON schema for the AI audit
  requirements.txt
  run.sh
frontend/
  src/
    components/        FileUploadZone, ScoreGauge, RiskList, DataInventoryTable, LoadingIndicator
    api.js             Backend API client
    App.jsx
  run.sh
```
