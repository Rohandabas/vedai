"use client";

import { ChevronDown, ArrowUpDown } from "lucide-react";
import type { AnswerSegment, GradeResult, GradingSummary, QuestionMapping } from "@/lib/types";
import { parseQuestionNumber } from "@/lib/questionNumber";

function ScoreBadge({ status, grade }: { status: QuestionMapping["status"]; grade?: GradeResult }) {
  if (status === "unanswered") {
    return (
      <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-ink-faint">
        Not answered
      </span>
    );
  }
  if (!grade) {
    return (
      <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-ink-faint">
        Pending
      </span>
    );
  }
  const full = grade.marksAwarded >= grade.maxMarks;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
      style={
        full
          ? { background: "var(--green-soft)", color: "var(--green)" }
          : { background: "var(--red-soft)", color: "var(--red)" }
      }
    >
      {grade.marksAwarded}/{grade.maxMarks}
    </span>
  );
}

function QuestionRow({
  mapping,
  label,
  grade,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  indented,
}: {
  mapping: QuestionMapping;
  label: string;
  grade?: GradeResult;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
  indented: boolean;
}) {
  return (
    <li
      className={`border-b border-border last:border-b-0 ${
        isSelected ? "bg-orange-soft/40" : ""
      }`}
      style={isSelected ? { boxShadow: "inset 3px 0 0 var(--orange)" } : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === "Enter" && onSelect()}
        className={`focus-ring flex cursor-pointer items-start gap-2.5 px-3.5 py-3 ${
          indented ? "pl-9" : ""
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            isSelected ? "bg-ink text-panel" : "bg-bg text-ink-soft"
          }`}
        >
          {label}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 flex-1 text-[13.5px] leading-snug text-ink">
              {mapping.question.text}
            </p>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <ScoreBadge status={mapping.status} grade={grade} />
            {mapping.status === "out_of_order" && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: "var(--amber-soft)", color: "var(--amber)" }}
              >
                <ArrowUpDown size={10} />
                Out of order
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="focus-ring mt-0.5 shrink-0 rounded p-0.5 text-ink-faint hover:text-ink"
        >
          <ChevronDown
            size={16}
            className="transition-transform"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="px-3.5 pb-3.5" style={{ paddingLeft: indented ? "2.75rem" : "2.75rem" }}>
          {grade ? (
            <div className="rounded-lg border border-orange/25 bg-orange-soft/50 p-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange">
                AI Feedback
              </p>
              <p className="text-[13px] leading-relaxed text-ink-soft">{grade.feedback}</p>
            </div>
          ) : mapping.answer ? (
            <div className="rounded-lg border border-border bg-bg p-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Transcribed answer
              </p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                {mapping.answer.text}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-ink-faint">No answer was found for this question.</p>
          )}
        </div>
      )}
    </li>
  );
}

export function QuestionLedger({
  mappings,
  grading,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  onExpandAll,
  allExpanded,
  unmatchedAnswers,
  selectedUnmatchedId,
  onSelectUnmatched,
}: {
  mappings: QuestionMapping[];
  grading: GradingSummary | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  allExpanded: boolean;
  unmatchedAnswers: AnswerSegment[];
  selectedUnmatchedId: string | null;
  onSelectUnmatched: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-ink">
          Extracted Questions <span className="font-normal text-ink-faint">(from question paper)</span>
        </h2>
        <button
          onClick={onExpandAll}
          className="focus-ring shrink-0 whitespace-nowrap text-[12.5px] font-medium text-orange hover:underline"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul>
          {mappings.map((m) => {
            const { group, sub } = parseQuestionNumber(m.question.number);
            const prevGroup =
              mappings[mappings.indexOf(m) - 1] &&
              parseQuestionNumber(mappings[mappings.indexOf(m) - 1].question.number).group;
            const isFirstOfGroup = sub == null || group !== prevGroup;
            const grade = grading?.perQuestion.find(
              (g) => g.questionNumber === m.question.number
            );
            return (
              <QuestionRow
                key={m.question.id}
                mapping={m}
                label={sub ? sub : group}
                grade={grade}
                isSelected={selectedId === m.question.id}
                isExpanded={expandedIds.has(m.question.id)}
                onSelect={() => onSelect(m.question.id)}
                onToggle={() => onToggleExpand(m.question.id)}
                indented={sub != null && !isFirstOfGroup}
              />
            );
          })}
        </ul>

        {unmatchedAnswers.length > 0 && (
          <div className="border-t border-border-strong px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber">
              Unmatched answers · {unmatchedAnswers.length}
            </p>
            <ul className="flex flex-col gap-1.5">
              {unmatchedAnswers.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => onSelectUnmatched(a.id)}
                    className={`focus-ring w-full rounded-lg px-2.5 py-2 text-left text-[12.5px] leading-snug transition-colors ${
                      selectedUnmatchedId === a.id
                        ? "bg-amber-soft text-ink"
                        : "text-ink-soft hover:bg-bg"
                    }`}
                  >
                    {a.text.slice(0, 90)}
                    {a.text.length > 90 ? "…" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
