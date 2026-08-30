"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { BBox, PageImage } from "@/lib/types";
import { HighlightOverlay } from "./HighlightOverlay";

const BASE_WIDTH = 640;

export function AnswerViewer({
  pages,
  currentPage,
  onPageChange,
  regions,
  activeLabel,
  activeKey,
  spansPages,
}: {
  pages: PageImage[];
  currentPage: number;
  onPageChange: (page: number) => void;
  regions: BBox[];
  activeLabel: string;
  activeKey: string;
  spansPages: number[];
}) {
  const [zoom, setZoom] = useState(100);
  const page = pages[currentPage];
  const boxOnPage = regions.find((r) => r.page === currentPage) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-[13.5px] font-semibold text-ink">Answer Sheet</h2>
        {spansPages.length > 1 && (
          <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            spans pages
            {spansPages.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`focus-ring rounded px-1.5 py-0.5 font-medium ${
                  p === currentPage ? "bg-green-soft text-green" : "hover:text-ink"
                }`}
              >
                {p + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1 rounded-full border border-border px-1 py-0.5">
          <button
            className="focus-ring rounded-full p-1 text-ink-soft hover:text-ink disabled:opacity-30"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            disabled={zoom <= 50}
            aria-label="Zoom out"
          >
            <Minus size={13} />
          </button>
          <span className="w-9 text-center font-mono text-[11.5px] text-ink-soft">{zoom}%</span>
          <button
            className="focus-ring rounded-full p-1 text-ink-soft hover:text-ink disabled:opacity-30"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            disabled={zoom >= 200}
            aria-label="Zoom in"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="focus-ring rounded-full border border-border p-1 text-ink-soft hover:text-ink disabled:opacity-30"
            disabled={currentPage <= 0}
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-ink-soft">
            Page {pages.length ? currentPage + 1 : 0} of {pages.length}
          </span>
          <button
            className="focus-ring rounded-full border border-border p-1 text-ink-soft hover:text-ink disabled:opacity-30"
            disabled={currentPage >= pages.length - 1}
            onClick={() => onPageChange(Math.min(pages.length - 1, currentPage + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-bg p-6">
        {page ? (
          <div
            className="relative mx-auto rounded-sm bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]"
            style={{ width: `${(BASE_WIDTH * zoom) / 100}px`, maxWidth: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.dataUrl}
              alt={`Answer sheet page ${currentPage + 1}`}
              className="block w-full select-none rounded-sm"
              draggable={false}
            />
            {boxOnPage && (
              <HighlightOverlay key={`${activeKey}-${currentPage}`} box={boxOnPage} label={activeLabel} />
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            No page to display
          </div>
        )}
      </div>
    </div>
  );
}
