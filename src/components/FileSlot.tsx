"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

export function FileSlot({
  label,
  file,
  pageCount,
  rasterizing,
  onChange,
}: {
  label: string;
  file: File | null;
  pageCount: number | null;
  rasterizing: boolean;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputId = `file-${label.replace(/\s+/g, "-")}`;

  return (
    <div
      className={`relative flex-1 rounded-2xl border bg-panel px-5 py-6 text-center transition-colors ${
        dragOver ? "border-orange" : file ? "border-border-strong" : "border-border-strong"
      }`}
      style={{ borderStyle: file ? "solid" : "dashed" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onChange(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="sr-only"
        id={inputId}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {file && (
        <button
          type="button"
          aria-label="Remove file"
          className="focus-ring absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-panel"
          onClick={() => {
            onChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          <X size={13} />
        </button>
      )}

      {!file ? (
        <label htmlFor={inputId} className="focus-ring flex cursor-pointer flex-col items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-ink-soft">
            <Upload size={16} />
          </span>
          <span className="text-[14px] text-ink">
            Upload <strong className="font-semibold text-orange">{label}</strong>
          </span>
          <span className="text-[12px] text-ink-faint">Max 10MB</span>
        </label>
      ) : (
        <label htmlFor={inputId} className="focus-ring flex cursor-pointer flex-col items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-soft text-[9px] font-bold text-red">
            {(file.name.split(".").pop() || "FILE").slice(0, 4).toUpperCase()}
          </span>
          <span className="max-w-[220px] truncate text-[13.5px] font-medium text-ink">
            {file.name}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-ink-faint">
            {(file.size / 1024 / 1024).toFixed(1)} MB
            {rasterizing ? (
              <>
                <span aria-hidden>•</span>
                <Loader2 size={11} className="animate-spin" /> reading pages
              </>
            ) : pageCount != null ? (
              <>
                <span aria-hidden>•</span>
                {pageCount} {pageCount === 1 ? "page" : "pages"}
              </>
            ) : null}
          </span>
        </label>
      )}
    </div>
  );
}
