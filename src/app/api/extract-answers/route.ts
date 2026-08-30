import { NextRequest, NextResponse } from "next/server";
import { callGrok, parseJsonLoose, GrokApiError, GrokContentPart } from "@/lib/grok";
import type { AnswerSegment } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type RawAnswer = {
  matchedQuestionNumber: string | null;
  text: string;
  regions: { page: number; x: number; y: number; w: number; h: number }[];
};

function buildSystemPrompt(questionNumbers: string[]) {
  return `You are transcribing a student's handwritten answer sheet with precise vision. You will be shown images of the answer sheet, one image per page, in the exact order the student wrote them.

The exam's question numbers, in printed order, are exactly: ${JSON.stringify(
    questionNumbers
  )}. When you can tell which question a piece of writing answers (from a number the student wrote, or the content), set "matchedQuestionNumber" to the EXACT matching string from that list. If you cannot confidently match it to any of those questions, set it to null - do not invent a number that is not in the list.

Identify each distinct answer as its own segment. For every segment return an object with:
- "matchedQuestionNumber": exact string from the list above, or null
- "text": the handwriting transcribed as accurately as possible; if illegible, write your best guess and prefix uncertain words with "[?]"
- "regions": an array of bounding boxes, one per page the answer appears on (a single answer may continue on a later page, e.g. "continued on page 3" - include every page it spans as a separate region in the SAME segment). Each region has keys: "page" (0-based index matching the order pages were given to you), "x", "y", "w", "h" - all as percentages (0-100) of that page image's width/height, top-left origin.

Respond with ONLY a raw JSON array of these segment objects. No markdown fences, no commentary, no trailing text.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pages: { page: number; dataUrl: string }[] = body.pages;
    const questionNumbers: string[] = body.questionNumbers || [];
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: "No pages provided" }, { status: 400 });
    }

    const content: GrokContentPart[] = [];
    for (const p of pages) {
      content.push({ type: "text", text: `Page ${p.page}:` });
      content.push({ type: "image_url", image_url: { url: p.dataUrl } });
    }

    const raw = await callGrok([
      { role: "system", content: buildSystemPrompt(questionNumbers) },
      { role: "user", content },
    ]);

    const parsed = parseJsonLoose<RawAnswer[]>(raw);
    const answers: AnswerSegment[] = parsed.map((a, i) => ({
      id: `a_${i}`,
      matchedQuestionNumber: a.matchedQuestionNumber,
      text: a.text,
      regions: a.regions.map((r) => ({
        page: r.page,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
      })),
    }));

    return NextResponse.json({ answers });
  } catch (err) {
    const status = err instanceof GrokApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status }
    );
  }
}
