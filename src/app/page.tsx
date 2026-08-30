"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { HeroBadge } from "@/components/HeroBadge";
import { FileSlot } from "@/components/FileSlot";
import { LoadingScreen } from "@/components/LoadingScreen";
import { QuestionLedger } from "@/components/QuestionLedger";
import { AnswerViewer } from "@/components/AnswerViewer";
import { rasterizeFile } from "@/lib/rasterize";
import { buildMapping } from "@/lib/mapping";
import type {
  AnswerSegment,
  GradingSummary,
  PageImage,
  ProcessingStage,
  Question,
  QuestionMapping,
} from "@/lib/types";

export default function Home() {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [qPages, setQPages] = useState<PageImage[] | null>(null);
  const [aPages, setAPages] = useState<PageImage[] | null>(null);
  const [qRasterizing, setQRasterizing] = useState(false);
  const [aRasterizing, setARasterizing] = useState(false);

  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const [mappings, setMappings] = useState<QuestionMapping[]>([]);
  const [unmatchedAnswers, setUnmatchedAnswers] = useState<AnswerSegment[]>([]);
  const [grading, setGrading] = useState<GradingSummary | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUnmatchedId, setSelectedUnmatchedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [currentAnswerPage, setCurrentAnswerPage] = useState(0);
  const [mobileTab, setMobileTab] = useState<"questions" | "answer">("questions");

  const isProcessing = ["extracting_questions", "extracting_answers", "mapping", "grading"].includes(
    stage
  );
  const isResults = stage === "done";

  const selectedMapping = useMemo(
    () => mappings.find((m) => m.question.id === selectedId) ?? null,
    [mappings, selectedId]
  );
  const selectedUnmatched = useMemo(
    () => unmatchedAnswers.find((a) => a.id === selectedUnmatchedId) ?? null,
    [unmatchedAnswers, selectedUnmatchedId]
  );
  const activeRegions = useMemo(
    () => selectedUnmatched?.regions ?? selectedMapping?.answer?.regions ?? [],
    [selectedUnmatched, selectedMapping]
  );
  const spansPages = useMemo(
    () => Array.from(new Set(activeRegions.map((r) => r.page))).sort((a, b) => a - b),
    [activeRegions]
  );
  const activeLabel = selectedUnmatched ? "Unmatched" : selectedMapping ? `Q${selectedMapping.question.number}` : "";

  async function onQuestionFileChange(file: File | null) {
    setQuestionFile(file);
    setQPages(null);
    if (!file) return;
    setQRasterizing(true);
    setError(null);
    try {
      setQPages(await rasterizeFile(file));
    } catch {
      setError("Couldn't read that question paper file. Try a different PDF or image.");
      setQuestionFile(null);
    } finally {
      setQRasterizing(false);
    }
  }

  async function onAnswerFileChange(file: File | null) {
    setAnswerFile(file);
    setAPages(null);
    if (!file) return;
    setARasterizing(true);
    setError(null);
    try {
      setAPages(await rasterizeFile(file));
    } catch {
      setError("Couldn't read that answer sheet file. Try a different PDF or image.");
      setAnswerFile(null);
    } finally {
      setARasterizing(false);
    }
  }

  async function handleStartMapping() {
    if (!qPages || !aPages) return;
    setError(null);
    try {
      setStage("extracting_questions");
      const qRes = await fetch("/api/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: qPages.map((p) => ({ page: p.page, dataUrl: p.dataUrl })) }),
      });
      if (!qRes.ok) throw new Error((await qRes.json()).error || "Question extraction failed");
      const { questions }: { questions: Question[] } = await qRes.json();
      if (!questions.length) throw new Error("No questions were detected in that file.");

      setStage("extracting_answers");
      const aRes = await fetch("/api/extract-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: aPages.map((p) => ({ page: p.page, dataUrl: p.dataUrl })),
          questionNumbers: questions.map((q) => q.number),
        }),
      });
      if (!aRes.ok) throw new Error((await aRes.json()).error || "Answer extraction failed");
      const { answers }: { answers: AnswerSegment[] } = await aRes.json();

      setStage("mapping");
      const { mappings: built, unmatchedAnswers: unmatched } = buildMapping(questions, answers);
      setMappings(built);
      setUnmatchedAnswers(unmatched);
      const firstId = built[0]?.question.id ?? null;
      setSelectedId(firstId);
      setCurrentAnswerPage(built[0]?.answer?.regions[0]?.page ?? 0);

      setStage("grading");
      try {
        const items = built
          .filter((m) => m.answer)
          .map((m) => ({
            questionNumber: m.question.number,
            questionText: m.question.text,
            maxMarks: m.question.maxMarks ?? 0,
            studentAnswerText: m.answer!.text,
          }));
        if (items.length) {
          const gRes = await fetch("/api/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });
          if (gRes.ok) setGrading(await gRes.json());
        }
      } catch {
        // Grading is a bonus step — extraction/mapping already succeeded, so don't fail the run.
      }

      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("idle");
    }
  }

  function handleStartOver() {
    setQuestionFile(null);
    setAnswerFile(null);
    setQPages(null);
    setAPages(null);
    setStage("idle");
    setError(null);
    setMappings([]);
    setUnmatchedAnswers([]);
    setSelectedId(null);
    setSelectedUnmatchedId(null);
    setExpandedIds(new Set());
    setGrading(null);
    setMobileTab("questions");
  }

  function selectQuestion(id: string) {
    setSelectedUnmatchedId(null);
    setSelectedId(id);
    setExpandedIds((prev) => new Set(prev).add(id));
    const m = mappings.find((mm) => mm.question.id === id);
    setCurrentAnswerPage(m?.answer?.regions[0]?.page ?? currentAnswerPage);
    setMobileTab("answer");
  }

  function selectUnmatched(id: string) {
    setSelectedId(null);
    setSelectedUnmatchedId(id);
    const a = unmatchedAnswers.find((aa) => aa.id === id);
    setCurrentAnswerPage(a?.regions[0]?.page ?? currentAnswerPage);
    setMobileTab("answer");
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds((prev) =>
      prev.size === mappings.length ? new Set() : new Set(mappings.map((m) => m.question.id))
    );
  }

  const canStartMapping = !!qPages && !!aPages && !qRasterizing && !aRasterizing;

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onBack={handleStartOver} showBack={isResults || isProcessing} />

        {!isResults && !isProcessing && (
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <h1 className="text-[26px] font-semibold leading-tight text-ink sm:text-[30px]">
              Upload{" "}
              <span className="rounded-md bg-orange-soft px-1.5 text-orange">
                Question Paper &amp; Answer Sheets
              </span>
            </h1>
            <p className="mt-2.5 text-[14.5px] text-ink-soft">Upload both files to get started</p>

            <HeroBadge />

            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <FileSlot
                label="Question Paper"
                file={questionFile}
                pageCount={qPages?.length ?? null}
                rasterizing={qRasterizing}
                onChange={onQuestionFileChange}
              />
              <FileSlot
                label="Answer Sheet"
                file={answerFile}
                pageCount={aPages?.length ?? null}
                rasterizing={aRasterizing}
                onChange={onAnswerFileChange}
              />
            </div>

            {error && (
              <div className="mt-5 flex w-full items-start gap-2 rounded-lg border border-red/25 bg-red-soft px-3.5 py-3 text-left text-[13px] text-red">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStartMapping}
              disabled={!canStartMapping}
              className="focus-ring mt-8 flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-panel transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Start Mapping
              <ArrowRight size={15} />
            </button>
            <p className="mt-3 text-[12.5px] text-ink-faint">
              Once both files are uploaded, you&apos;ll be able to map answers with questions
            </p>
          </main>
        )}

        {isProcessing && <LoadingScreen stage={stage} />}

        {isResults && (
          <>
            {error && (
              <div className="flex items-center gap-2 border-b border-border bg-red-soft px-5 py-2 text-[13px] text-red">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
              {(["questions", "answer"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`focus-ring flex-1 rounded-full py-1.5 text-[13px] font-medium transition-colors ${
                    mobileTab === tab ? "bg-ink text-panel" : "bg-bg text-ink-soft"
                  }`}
                >
                  {tab === "questions" ? "Questions" : "Answer Sheet"}
                </button>
              ))}
            </div>

            <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[380px_1fr]">
              <section
                className={`border-border bg-panel md:border-r ${
                  mobileTab === "questions" ? "block" : "hidden md:block"
                }`}
              >
                <QuestionLedger
                  mappings={mappings}
                  grading={grading}
                  selectedId={selectedId}
                  onSelect={selectQuestion}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onExpandAll={expandAll}
                  allExpanded={expandedIds.size === mappings.length && mappings.length > 0}
                  unmatchedAnswers={unmatchedAnswers}
                  selectedUnmatchedId={selectedUnmatchedId}
                  onSelectUnmatched={selectUnmatched}
                />
              </section>

              <section
                className={`min-h-[420px] bg-panel ${
                  mobileTab === "answer" ? "block" : "hidden md:block"
                }`}
              >
                <AnswerViewer
                  pages={aPages ?? []}
                  currentPage={currentAnswerPage}
                  onPageChange={setCurrentAnswerPage}
                  regions={activeRegions}
                  activeLabel={activeLabel}
                  activeKey={selectedId ?? selectedUnmatchedId ?? "none"}
                  spansPages={spansPages}
                />
              </section>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
