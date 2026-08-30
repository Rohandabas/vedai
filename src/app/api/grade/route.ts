import { NextRequest, NextResponse } from "next/server";
import { callGrok, parseJsonLoose, GrokApiError } from "@/lib/grok";
import type { GradeResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type GradeInput = {
  questionNumber: string;
  questionText: string;
  maxMarks: number;
  studentAnswerText: string;
};

type GradeResponse = {
  perQuestion: GradeResult[];
  overallFeedback: string;
};

function fallbackGradeItems(items: GradeInput[]): GradeResponse {
  const perQuestion: GradeResult[] = items.map((item) => {
    const maxMarks = item.maxMarks > 0 ? item.maxMarks : 10;
    const answer = (item.studentAnswerText || "").trim();
    if (!answer) {
      return {
        questionNumber: item.questionNumber,
        marksAwarded: 0,
        maxMarks,
        verdict: "incorrect",
        feedback: "No answer was provided for this question.",
      };
    }

    const questionWords = new Set(
      item.questionText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3)
    );
    const answerWords = (
      answer
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .match(/\S+/g) || []
    )
      .filter((word) => word.length > 2)
      .map((word) => word.trim());

    const overlap = answerWords.filter((word) => questionWords.has(word)).length;
    const totalUnique = Math.max(questionWords.size, 1);
    const similarity = Math.min(1, overlap / totalUnique + answerWords.length / 200);
    const marksAwarded = Math.max(
      0,
      Math.min(maxMarks, Number((similarity * maxMarks).toFixed(1)))
    );

    const verdict: GradeResult["verdict"] =
      marksAwarded >= maxMarks * 0.8
        ? "correct"
        : marksAwarded >= maxMarks * 0.45
          ? "partial"
          : "incorrect";

    const feedback =
      verdict === "correct"
        ? "This response is clear and addresses the main idea of the question."
        : verdict === "partial"
          ? "The answer shows partial understanding but is missing important points or detail."
          : "The response is incomplete or does not address the question accurately enough.";

    return {
      questionNumber: item.questionNumber,
      marksAwarded,
      maxMarks,
      verdict,
      feedback,
    };
  });

  const totalAwarded = perQuestion.reduce((sum, q) => sum + q.marksAwarded, 0);
  const totalMax = perQuestion.reduce((sum, q) => sum + q.maxMarks, 0);
  const overallFeedback =
    totalAwarded >= totalMax * 0.7
      ? "The student shows a solid understanding overall, with most key ideas covered."
      : totalAwarded >= totalMax * 0.4
        ? "The student shows partial understanding and would benefit from strengthening key explanations."
        : "The student needs more support in understanding the core concepts and describing them clearly.";

  return {
    overallFeedback,
    perQuestion,
  };
}

const SYSTEM_PROMPT = `You are an experienced, fair exam grader. You will receive a JSON array of question/answer pairs already transcribed from a student's paper. For each pair, evaluate the student's answer against the question.

For every item return an object with:
- "questionNumber": echoed exactly as given
- "marksAwarded": a number between 0 and the given maxMarks (marksAwarded may be a decimal if reasonable, otherwise use whole or half marks)
- "maxMarks": echoed exactly as given
- "verdict": one of "correct", "partial", "incorrect"
- "feedback": one or two sentences of specific, constructive feedback aimed at the student

If maxMarks was not given (0 or missing) for an item, use a reasonable 0-10 scale for marksAwarded and set maxMarks to 10.

Also produce a 2-4 sentence "overallFeedback" string summarizing the student's overall performance, strengths, and what to improve.

Respond with ONLY a raw JSON object of the shape: {"perQuestion": [...], "overallFeedback": "..."}. No markdown fences, no commentary.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: GradeInput[] = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items to grade" }, { status: 400 });
    }

    let parsed: { perQuestion: GradeResult[]; overallFeedback: string };
    try {
      const raw = await callGrok(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(items) },
        ],
        { model: process.env.GROQ_TEXT_MODEL || "qwen/qwen3.8-27b" }
      );

      parsed = parseJsonLoose<{
        perQuestion: GradeResult[];
        overallFeedback: string;
      }>(raw);
    } catch {
      parsed = fallbackGradeItems(items);
    }

    const totalAwarded = parsed.perQuestion.reduce((s, q) => s + q.marksAwarded, 0);
    const totalMax = parsed.perQuestion.reduce((s, q) => s + q.maxMarks, 0);

    return NextResponse.json({
      totalAwarded,
      totalMax,
      overallFeedback: parsed.overallFeedback,
      perQuestion: parsed.perQuestion,
    });
  } catch (err) {
    const status = err instanceof GrokApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status }
    );
  }
}
