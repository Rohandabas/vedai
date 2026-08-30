"use client";

import { useEffect, useState } from "react";
import type { BBox } from "@/lib/types";

export function HighlightOverlay({ box, label }: { box: BBox; label: string }) {
  // Parent remounts this component (via `key`) whenever the target box
  // changes, so this local "shown" state always starts fresh and animates in.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const pad = 1;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  const w = Math.min(100 - x, box.w + pad * 2);
  const h = Math.min(100 - y, box.h + pad * 2);

  return (
    <div
      className="pointer-events-none absolute rounded-md border-2"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        borderColor: "var(--green)",
        background: "var(--green-soft)",
        opacity: shown ? 0.95 : 0,
        transform: shown ? "scale(1)" : "scale(0.97)",
        transition: "opacity 260ms ease, transform 260ms ease",
      }}
    >
      <span
        className="absolute -top-3 left-2 rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white"
        style={{ background: "var(--green)" }}
      >
        {label}
      </span>
    </div>
  );
}
