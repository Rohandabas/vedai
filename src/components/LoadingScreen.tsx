import { Sparkles } from "lucide-react";
import type { ProcessingStage } from "@/lib/types";

const LABELS: Partial<Record<ProcessingStage, string>> = {
  rasterizing: "Reading pages",
  extracting_questions: "Extracting questions",
  extracting_answers: "Extracting answers",
  mapping: "Mapping answers",
  grading: "Grading answers",
};

export function LoadingScreen({ stage }: { stage: ProcessingStage }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-panel m-4">
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Sparkles size={40} className="text-orange" />
        <p className="text-[17px] font-semibold text-ink">Extracting…</p>
        <p className="text-[13.5px] text-ink-soft">
          {LABELS[stage] ?? "This may take a while"}
        </p>
      </div>
    </div>
  );
}
