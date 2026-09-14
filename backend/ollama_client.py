"""
Utilities for locating the Windows host from within WSL2 and talking to
the Ollama server running there (e.g. `ollama run qwen2.5:7b`).
"""
import logging
import os
import re
import subprocess

import requests

logger = logging.getLogger("gdpr_dashboard.ollama")

OLLAMA_PORT = int(os.getenv("OLLAMA_PORT", "11434"))
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "300"))

# Allow a manual override for environments where route parsing is unreliable
# (e.g. bare-metal Linux, Docker). If unset, we auto-detect the WSL2 host IP.
_MANUAL_HOST_OVERRIDE = os.getenv("OLLAMA_HOST_IP")


def get_windows_host_ip() -> str:
    """
    Dynamically resolve the Windows host IP address from within WSL2.

    WSL2 runs in a lightweight VM with its own network namespace. The
    Windows host is reachable via the gateway address of the default
    route, which we extract by parsing `ip route show`.

    Falls back to `localhost` if detection fails (e.g. running natively
    on Linux/macOS with Ollama installed locally), and can be forced via
    the OLLAMA_HOST_IP environment variable.
    """
    if _MANUAL_HOST_OVERRIDE:
        logger.info("Using manually configured Ollama host IP: %s", _MANUAL_HOST_OVERRIDE)
        return _MANUAL_HOST_OVERRIDE

    try:
        result = subprocess.run(
            ["ip", "route", "show"],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
        for line in result.stdout.splitlines():
            if line.startswith("default"):
                match = re.search(r"default via (\S+)", line)
                if match:
                    host_ip = match.group(1)
                    logger.info("Detected Windows host IP via WSL2 default route: %s", host_ip)
                    return host_ip
    except (subprocess.SubprocessError, FileNotFoundError, OSError) as exc:
        logger.warning("Could not parse WSL2 default route (%s). Falling back to localhost.", exc)

    logger.info("Falling back to localhost for Ollama host.")
    return "localhost"


def get_ollama_url() -> str:
    host = get_windows_host_ip()
    return f"http://{host}:{OLLAMA_PORT}/api/generate"


def query_ollama(system_prompt: str, user_prompt: str) -> str:
    """
    Send a prompt to the local Ollama server (running Qwen2.5:7b on the
    Windows host) and return the raw text response.
    """
    url = get_ollama_url()
    payload = {
        "model": OLLAMA_MODEL,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "format": "json",
        "options": {
            # Low temperature so the model reliably follows the fixed
            # category checklist instead of free-associating risks.
            "temperature": 0.1,
            # Generous headroom: forcing per-category coverage produces
            # longer risk lists than free-form analysis, and a truncated
            # response would break JSON parsing.
            "num_predict": 2048,
        },
    }

    logger.info("Sending analysis request to Ollama at %s (model=%s)", url, OLLAMA_MODEL)

    try:
        response = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.exceptions.ConnectionError as exc:
        logger.error("Failed to connect to Ollama at %s: %s", url, exc)
        raise ConnectionError(
            f"Could not connect to Ollama at {url}. Ensure Ollama is running on the "
            f"Windows host and listening on all interfaces "
            f"(OLLAMA_HOST=0.0.0.0 ollama serve), and that qwen2.5:7b is pulled."
        ) from exc
    except requests.exceptions.Timeout as exc:
        logger.error("Ollama request timed out after %ss", OLLAMA_TIMEOUT_SECONDS)
        raise TimeoutError(
            f"Ollama did not respond within {OLLAMA_TIMEOUT_SECONDS} seconds."
        ) from exc

    data = response.json()
    logger.info("Received response from Ollama (%d chars)", len(data.get("response", "")))
    return data.get("response", "")
