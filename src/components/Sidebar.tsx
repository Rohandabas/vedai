"use client";

import {
  LayoutGrid,
  GraduationCap,
  ClipboardList,
  FileCheck2,
  Library,
  Sparkles,
  PanelLeft,
} from "lucide-react";

const NAV = [
  { icon: LayoutGrid, label: "Home" },
  { icon: GraduationCap, label: "My Classroom" },
  { icon: ClipboardList, label: "Assignments" },
  { icon: FileCheck2, label: "Exams", active: true },
  { icon: Library, label: "My Library" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-sidebar px-3 py-4 md:flex">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-panel">
            <GraduationCap size={16} />
          </span>
          <span className="text-[15px] font-semibold text-ink">VedaAI</span>
        </div>
        <PanelLeft size={16} className="text-ink-faint" />
      </div>

      <button className="mb-5 flex items-center justify-center gap-1.5 rounded-full border border-orange bg-ink px-3 py-2 text-[13px] font-medium text-panel">
        <Sparkles size={14} className="text-orange" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors ${
              item.active
                ? "border border-orange/40 bg-orange-soft text-orange font-medium"
                : "text-ink-soft hover:bg-bg"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange">
          <GraduationCap size={14} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-ink">Delhi Public School</p>
          <p className="truncate text-[11px] text-ink-faint">Bokaro Steel City</p>
        </div>
      </div>
    </aside>
  );
}
