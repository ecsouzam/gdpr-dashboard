const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Upload an architecture document to the backend for GDPR/DPIA analysis.
 * @param {File} file
 * @returns {Promise<{overall_score:number, summary:string, risks:Array, data_inventory:Array}>}
 */
export async function analyzeDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      `Could not reach the analysis backend at ${API_BASE_URL}. Make sure the backend server is running.`,
      0,
    );
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (body?.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // response body was not JSON; keep the generic message
    }
    throw new ApiError(detail, response.status);
  }

  return response.json();
}
