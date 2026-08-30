import type { AnswerSegment, Question, QuestionMapping } from "./types";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[\s.]+/g, "");
}

function firstRegionKey(a: AnswerSegment): [number, number] {
  const r = a.regions[0];
  return r ? [r.page, r.y] : [Infinity, Infinity];
}

/**
 * Builds the question -> answer mapping, flags unanswered questions, flags
 * questions whose answer was written out of the printed sequence (relative
 * to neighbouring answered questions), and returns answers that could not
 * be tied to any known question.
 */
export function buildMapping(
  questions: Question[],
  answers: AnswerSegment[]
): { mappings: QuestionMapping[]; unmatchedAnswers: AnswerSegment[] } {
  const byNumber = new Map<string, AnswerSegment>();
  const usedAnswerIds = new Set<string>();

  for (const a of answers) {
    if (!a.matchedQuestionNumber) continue;
    const key = normalize(a.matchedQuestionNumber);
    const matchQ = questions.find((q) => normalize(q.number) === key);
    if (matchQ && !byNumber.has(normalize(matchQ.number))) {
      byNumber.set(normalize(matchQ.number), a);
      usedAnswerIds.add(a.id);
    }
  }

  // Determine sequence order using the longest increasing subsequence of
  // answer positions (page, y) against printed question order. Anything not
  // part of that subsequence was written out of order relative to its peers.
  const answeredIdx: number[] = [];
  questions.forEach((q, i) => {
    if (byNumber.has(normalize(q.number))) answeredIdx.push(i);
  });
  const positions = answeredIdx.map((i) => firstRegionKey(byNumber.get(normalize(questions[i].number))!));
  const cmp = (p: [number, number], q: [number, number]) =>
    p[0] !== q[0] ? p[0] - q[0] : p[1] - q[1];

  // Standard patience-sorting LIS over `positions`, tracking indices into answeredIdx.
  const tails: number[] = []; // indices into answeredIdx, positions increasing
  const parents: number[] = new Array(answeredIdx.length).fill(-1);
  const tailsIdx: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    let lo = 0,
      hi = tailsIdx.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cmp(positions[tailsIdx[mid]], positions[i]) <= 0) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) parents[i] = tailsIdx[lo - 1];
    tailsIdx[lo] = i;
    if (lo === tails.length) tails.push(i);
  }
  const inOrderSet = new Set<number>();
  if (tailsIdx.length > 0) {
    let k = tailsIdx[tailsIdx.length - 1];
    while (k !== -1) {
      inOrderSet.add(answeredIdx[k]);
      k = parents[k];
    }
  }

  const mappings: QuestionMapping[] = questions.map((q, i) => {
    const ans = byNumber.get(normalize(q.number));
    if (!ans) return { question: q, status: "unanswered" };
    if (answeredIdx.length > 1 && !inOrderSet.has(i)) {
      return { question: q, status: "out_of_order", answer: ans };
    }
    return { question: q, status: "answered", answer: ans };
  });

  const unmatchedAnswers = answers.filter((a) => !usedAnswerIds.has(a.id));

  return { mappings, unmatchedAnswers };
}
