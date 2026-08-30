const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export type GrokContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type GrokMessage = {
  role: "system" | "user" | "assistant";
  content: string | GrokContentPart[];
};

export class GrokApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GrokApiError";
    this.status = status;
  }
}

export async function callGrok(
  messages: GrokMessage[],
  opts: { model?: string; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GrokApiError(
      "Missing GROQ_API_KEY environment variable. Add your Groq API key from https://console.groq.com to run extraction."
    );
  }

  const model = opts.model || process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.1,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const errorText = body.slice(0, 500);
        const isRetryable = res.status === 429 || res.status >= 500;

        if (isRetryable && attempt < maxAttempts) {
          const delayMs = 1000 * 2 ** (attempt - 1) + Math.random() * 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw new GrokApiError(
          `Groq API request failed (${res.status}): ${errorText || "Rate limited or unavailable"}`,
          res.status
        );
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new GrokApiError("Groq API returned an unexpected response shape.");
      }
      return content;
    } catch (error) {
      if (attempt < maxAttempts && error instanceof TypeError) {
        const delayMs = 1000 * 2 ** (attempt - 1) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }

  throw new GrokApiError("Groq API request failed after multiple attempts.");
}

/** Strips markdown code fences and parses the first JSON value found in the text. */
export function parseJsonLoose<T>(raw: string): T {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const firstBrace = Math.min(
    ...[text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0)
  );
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (Number.isFinite(firstBrace) && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text) as T;
}
