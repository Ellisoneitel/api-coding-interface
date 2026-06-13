// Thin wrapper around the OpenAI Responses API using global fetch (Node 18+).
// Returns both the parsed body and the x-request-id header so the UI can log
// the request id alongside the response id for every turn.

const RESPONSES_URL = "https://api.openai.com/v1/responses";

/**
 * Call POST /v1/responses.
 * @param {object} opts
 * @param {string} opts.apiKey  - OpenAI API key (sk-...)
 * @param {object} opts.body    - Request body for the Responses API
 * @returns {Promise<{data: object, requestId: string|null}>}
 */
export async function createResponse({ apiKey, body }) {
  if (!apiKey) {
    const err = new Error("No API key provided. Add and select a key in Settings.");
    err.status = 401;
    throw err;
  }

  let res;
  try {
    res = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = new Error(`Network error contacting OpenAI: ${e.message}`);
    err.status = 0;
    throw err;
  }

  const requestId = res.headers.get("x-request-id");

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error?.message || `OpenAI API error (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.requestId = requestId;
    err.data = data;
    throw err;
  }

  return { data, requestId };
}
