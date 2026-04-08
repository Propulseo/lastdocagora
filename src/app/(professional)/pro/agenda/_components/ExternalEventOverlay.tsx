"use client";

import { RADIUS } from "@/lib/design-tokens";
import { HOUR_HEIGHT, START_HOUR } from "../_lib/agenda-constants";
import type { ExternalEvent } from "../_types/agenda";

interface ExternalEventOverlayProps {
  events: ExternalEvent[];
  selectedDate: string;
}

export function ExternalEventOverlay({ events, selectedDate }: ExternalEventOverlayProps) {
  const filtered = events.filter((ev) => {
    if (ev.all_day) return false;
    return ev.starts_at.split("T")[0] === selectedDate;
  });

  return (
    <>
      {filtered.map((ev) => {
        const startParts = ev.starts_at.split("T")[1];
        const endParts = ev.ends_at.split("T")[1];
        if (!startParts || !endParts) return null;

        const [sh, sm] = startParts.split(":").map(Number);
        const [eh, em] = endParts.split(":").map(Number);
        const topOffset = (sh - START_HOUR + sm / 60) * HOUR_HEIGHT;
        const durationMinutes = eh * 60 + em - (sh * 60 + sm);
        const height = (durationMinutes / 60) * HOUR_HEIGHT;

        if (topOffset < 0 || height <= 0) return null;

        return (
          <div
            key={ev.id}
            className={`absolute right-2 overflow-hidden ${RADIUS.sm} px-3 py-1 border-l-[3px] opacity-60 pointer-events-none`}
            style={{
              top: `${topOffset}px`,
              height: `${Math.max(height, 24)}px`,
              left: "calc(4rem + 45%)",
              borderColor: ev.color ?? "#9333ea",
              backgroundColor: `${ev.color ?? "#9333ea"}20`,
            }}
            title={`${ev.calendar_name}: ${ev.title}`}
          >
            <p className="truncate text-xs font-medium" style={{ color: ev.color ?? "#9333ea" }}>
              {ev.title}
            </p>
            {height >= 40 && (
              <p className="truncate text-[10px] opacity-75" style={{ color: ev.color ?? "#9333ea" }}>
                {startParts.slice(0, 5)} - {endParts.slice(0, 5)}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
