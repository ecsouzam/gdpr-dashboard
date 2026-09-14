"""
Prompt construction for the GDPR / DPIA compliance audit performed by
the local LLM (Ollama, Qwen2.5:7b).
"""

# Maximum number of characters of the source document forwarded to the
# model, to keep the request within Qwen2.5:7b's practical context budget.
MAX_DOCUMENT_CHARS = 12000

# Fixed checklist of GDPR compliance categories. The model is required to
# assess each one independently (see SYSTEM_PROMPT below) so that a small
# model cannot silently fold one issue (e.g. a security gap) into another
# (e.g. a cross-border transfer) and skip reporting it separately.
GDPR_CATEGORIES = [
    "Lawfulness & Transparency",
    "Data Minimization & Proportionality",
    "Storage Limitation",
    "Security & Confidentiality",
    "Data Subject Rights",
    "Cross-Border Transfers",
    "Third-Party / Processor Oversight",
    "Breach Notification Readiness",
]

JSON_SCHEMA_EXAMPLE = """{
  "overall_score": 72,
  "summary": "A concise narrative (3-6 sentences) summarizing the overall GDPR/DPIA compliance posture of the described system, referencing the most material strengths and weaknesses.",
  "risks": [
    {
      "title": "Short risk title",
      "category": "One of the fixed GDPR categories listed above",
      "severity": "High",
      "description": "Explanation of the specific compliance gap found in the document.",
      "recommendation": "Concrete, actionable remediation guidance."
    }
  ],
  "data_inventory": [
    {
      "category": "e.g. Customer email address",
      "sensitive": false,
      "retention": "e.g. 24 months after account closure, or 'Not specified in document'"
    }
  ]
}"""

_CATEGORY_CHECKLIST = "\n".join(f"{i}. {name}" for i, name in enumerate(GDPR_CATEGORIES, start=1))

SYSTEM_PROMPT = f"""You are a senior GDPR and Data Protection Impact Assessment (DPIA) auditor.
You review system architecture documentation and assess it strictly against
core GDPR principles. Reference articles: Lawfulness/Transparency (Art. 5(1)(a),
Art. 6), Data Minimization (Art. 5(1)(c)), Storage Limitation (Art. 5(1)(e)),
Security (Art. 5(1)(f), Art. 32), Data Subject Rights (Art. 12-23),
Cross-Border Transfers (Chapter V), Processor Oversight (Art. 28), and
Breach Notification (Art. 33-34).

MANDATORY PROCESS: Before writing your output, you MUST work through the
following fixed checklist of {len(GDPR_CATEGORIES)} categories ONE BY ONE, independently:

{_CATEGORY_CHECKLIST}

For EACH category above, decide independently whether the document shows a
compliance gap. Treat each category as its own separate question - do NOT
skip a category just because you already reported an issue under a
different, related category. In particular:
- An unencrypted or unsecured data transfer to a third party or another
  country is TWO separate issues: report it under BOTH "Security &
  Confidentiality" (the lack of encryption/security measure) AND
  "Cross-Border Transfers" or "Third-Party / Processor Oversight" (the
  transfer itself), each as its own risk entry.
- Continuous, invasive, or disproportionate monitoring of individuals
  (e.g. keystroke logging, constant GPS tracking, screen recording) is a
  "Data Minimization & Proportionality" issue even if the data collected
  is also mentioned elsewhere.
- A category with no compliance gap simply produces no risk entry for that
  category - do not fabricate an issue that is not supported by the text.

You MUST respond with a single valid JSON object and nothing else - no
markdown code fences, no preamble, no explanation outside the JSON.
The JSON object MUST conform exactly to this shape:

{JSON_SCHEMA_EXAMPLE}

Rules for your analysis:
- "overall_score" is an integer from 0 (no compliance) to 100 (fully compliant).
- "summary" must be written in clear, professional English.
- "risks" must be sorted with "High" severity issues first, then "Medium", then "Low".
- Only use the severities "High", "Medium", or "Low" (exact capitalization).
- Every risk's "category" field MUST be exactly one of the {len(GDPR_CATEGORIES)}
  category names from the checklist above (exact spelling).
- Every risk needs a specific, actionable "recommendation" - avoid vague advice.
- "data_inventory" should list every distinct category of personal data you
  can identify in the document (e.g. name, email, IP address, health data,
  payment information). Mark "sensitive" as true for GDPR "special category"
  data (Art. 9): health, biometric, genetic, racial/ethnic origin, political
  opinions, religious beliefs, sexual orientation, trade union membership.
- If retention is not mentioned in the document, set "retention" to
  "Not specified in document" - do not invent a value.
- If the document provides insufficient information to assess a category,
  note this explicitly as a risk with an appropriate severity rather than
  omitting it.
- Base your assessment ONLY on the content of the provided document. Do not
  assume facts not stated or implied by the text.
- Output must be valid JSON: use double quotes for all keys and string
  values, no trailing commas, no comments.
"""


def build_user_prompt(document_text: str, filename: str) -> str:
    truncated = document_text[:MAX_DOCUMENT_CHARS]
    truncation_note = ""
    if len(document_text) > MAX_DOCUMENT_CHARS:
        truncation_note = (
            "\n\n[NOTE: The document was truncated to fit the analysis window. "
            "Base your assessment on the excerpt below.]"
        )

    return (
        f"Architecture documentation file: {filename}\n"
        f"--- BEGIN DOCUMENT ---\n"
        f"{truncated}\n"
        f"--- END DOCUMENT ---"
        f"{truncation_note}\n\n"
        f"Perform a full GDPR/DPIA compliance audit of the system described above "
        f"and respond with the JSON object as instructed."
    )
