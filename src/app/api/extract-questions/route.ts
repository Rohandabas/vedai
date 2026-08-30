import { NextRequest, NextResponse } from "next/server";
import { callGrok, parseJsonLoose, GrokApiError, GrokContentPart } from "@/lib/grok";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type RawQuestion = {
  number: string;
  text: string;
  page: number;
  bbox: { x: number; y: number; w: number; h: number };
  maxMarks?: number;
};

const SYSTEM_PROMPT = `You are an exam paper parser with precise vision. You will be shown images of a question paper, one image per page, in the exact printed order.

Extract every question and every labelled sub-part as a SEPARATE entry, in the exact order they appear on the page. A sub-part like "(a)" under question "11" becomes its own entry numbered "11(a)". Preserve the original numbering exactly as printed (keep the same digits, letters, brackets and punctuation style used on the page).

For every entry return an object with:
- "number": the exact printed number/label as a string, e.g. "11(a)", "2.", "Q5"
- "text": the full question text transcribed, excluding the leading number/label itself
- "page": the 0-based index of the page image (matching the order the pages were given to you) where this question's text begins
- "bbox": the bounding box of the question's text block on that page image, as percentages (0-100) of the image's width/height, with keys x (left), y (top), w (width), h (height)
- "maxMarks": a number if marks are printed for the question (e.g. "[5]", "(10 marks)"), otherwise omit this key

Respond with ONLY a raw JSON array of these objects. No markdown fences, no commentary, no trailing text.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pages: { page: number; dataUrl: string }[] = body.pages;
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: "No pages provided" }, { status: 400 });
    }

    const content: GrokContentPart[] = [];
    for (const p of pages) {
      content.push({ type: "text", text: `Page ${p.page}:` });
      content.push({ type: "image_url", image_url: { url: p.dataUrl } });
    }

    const raw = await callGrok([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ]);

    const parsed = parseJsonLoose<RawQuestion[]>(raw);
    const questions: Question[] = parsed.map((q, i) => ({
      id: `q_${i}_${q.number.replace(/\s+/g, "")}`,
      number: q.number,
      text: q.text,
      page: q.page,
      bbox: { page: q.page, x: q.bbox.x, y: q.bbox.y, w: q.bbox.w, h: q.bbox.h },
      maxMarks: q.maxMarks,
    }));

    return NextResponse.json({ questions });
  } catch (err) {
    const status = err instanceof GrokApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status }
    );
  }
}
