"""
GDPR / DPIA Compliance Dashboard - Backend API

FastAPI service that accepts architecture documentation (PDF/DOCX/TXT),
sends it to a locally running Ollama instance (Qwen2.5:7b, hosted on the
Windows side of a WSL2 setup) for a structured GDPR compliance audit, and
returns the result as JSON for the React frontend.
"""
import json
import logging
import re
import time

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

from gdpr_prompt import SYSTEM_PROMPT, build_user_prompt
from ollama_client import OLLAMA_MODEL, get_ollama_url, query_ollama
from text_extraction import (
    EmptyDocumentError,
    UnsupportedFileTypeError,
    extract_text,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("gdpr_dashboard.api")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


# --------------------------------------------------------------------------
# Response schema
# --------------------------------------------------------------------------

class Risk(BaseModel):
    title: str
    category: str
    severity: str
    description: str
    recommendation: str


class DataInventoryItem(BaseModel):
    category: str
    sensitive: bool
    retention: str


class AnalysisResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    summary: str
    risks: list[Risk] = Field(default_factory=list)
    data_inventory: list[DataInventoryItem] = Field(default_factory=list)


SEVERITY_ORDER = {"High": 0, "Medium": 1, "Low": 2}


# --------------------------------------------------------------------------
# App setup
# --------------------------------------------------------------------------

app = FastAPI(
    title="GDPR / DPIA Compliance Dashboard API",
    description=(
        "Upload system architecture documentation and receive an AI-generated "
        "GDPR compliance audit, powered by a locally hosted Qwen2.5:7b model via Ollama."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def log_ollama_target() -> None:
    url = get_ollama_url()
    logger.info("Ollama target resolved to: %s (model=%s)", url, OLLAMA_MODEL)


@app.get("/health")
async def health_check():
    """Basic liveness/readiness probe, also reports the resolved Ollama target."""
    return {
        "status": "ok",
        "ollama_url": get_ollama_url(),
        "ollama_model": OLLAMA_MODEL,
    }


def _parse_model_json(raw_response: str) -> dict:
    """
    Ollama with format="json" should return a clean JSON string, but we
    defensively strip markdown code fences and grab the outermost JSON
    object in case the model adds extra text around it.
    """
    text = raw_response.strip()

    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise json.JSONDecodeError("Could not locate a JSON object in the model response", text, 0)


@app.post("/analyze", response_model=AnalysisResult)
async def analyze_document(file: UploadFile = File(...)):
    """
    Accepts a .pdf, .docx, or .txt architecture document, runs it through
    a local Qwen2.5:7b model via Ollama for a GDPR/DPIA compliance audit,
    and returns a structured analysis result.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file is missing a filename.")

    logger.info("Received upload: %s (content_type=%s)", file.filename, file.content_type)

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit.",
        )

    try:
        document_text = extract_text(file.filename, file_bytes)
    except UnsupportedFileTypeError as exc:
        logger.warning("Rejected unsupported file type: %s", file.filename)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except EmptyDocumentError as exc:
        logger.warning("Rejected empty/unreadable document: %s", file.filename)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to extract text from '%s'", file.filename)
        raise HTTPException(
            status_code=422, detail=f"Failed to read '{file.filename}': {exc}"
        ) from exc

    user_prompt = build_user_prompt(document_text, file.filename)

    start_time = time.monotonic()
    try:
        raw_response = query_ollama(SYSTEM_PROMPT, user_prompt)
    except ConnectionError as exc:
        logger.error("Ollama connection error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except TimeoutError as exc:
        logger.error("Ollama timeout: %s", exc)
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    elapsed = time.monotonic() - start_time
    logger.info("Ollama responded in %.1fs for '%s'", elapsed, file.filename)

    try:
        parsed = _parse_model_json(raw_response)
        result = AnalysisResult.model_validate(parsed)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error("Model returned malformed JSON for '%s': %s", file.filename, exc)
        logger.debug("Raw model response: %s", raw_response)
        raise HTTPException(
            status_code=502,
            detail=(
                "The AI model returned a response that could not be parsed as valid "
                "structured JSON. Please try again."
            ),
        ) from exc

    result.risks.sort(key=lambda r: SEVERITY_ORDER.get(r.severity, 99))

    logger.info(
        "Analysis complete for '%s': score=%d, risks=%d, data_categories=%d",
        file.filename,
        result.overall_score,
        len(result.risks),
        len(result.data_inventory),
    )

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
