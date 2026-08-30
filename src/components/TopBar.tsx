"use client";

import { ArrowLeft, Bell, ChevronDown, FileText, HelpCircle, Sparkles } from "lucide-react";

export function TopBar({ onBack, showBack }: { onBack: () => void; showBack: boolean }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-panel px-4 py-2.5 md:px-5">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <button
          onClick={onBack}
          disabled={!showBack}
          aria-label="Back to exams"
          className="focus-ring rounded-md p-1 text-ink-soft transition-colors hover:text-ink disabled:opacity-30"
        >
          <ArrowLeft size={16} />
        </button>
        <FileText size={14} />
        <span>Exams</span>
      </div>

      <div className="flex items-center gap-3.5 text-ink-soft">
        <HelpCircle size={17} className="hidden sm:block" />
        <span className="relative hidden sm:block">
          <Bell size={17} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-orange" />
        </span>
        <Sparkles size={17} className="hidden text-orange sm:block" />
        <div className="flex items-center gap-1.5 border-l border-border pl-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-soft text-xs font-semibold text-orange">
            MR
          </span>
          <span className="hidden text-[13px] font-medium text-ink md:block">
            Madhur Rastogi
          </span>
          <ChevronDown size={14} className="hidden md:block" />
        </div>
      </div>
    </header>
  );
}
