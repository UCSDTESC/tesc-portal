import { useEffect, useRef, useState } from "react";

const DURATION_MS = 550;

type Direction = "up" | "down" | null;

export default function AnimatedNumber({
  value,
  hourDelta = 0,
}: {
  readonly value: number;
  readonly hourDelta?: number;
}) {
  const [display, setDisplay] = useState(value);
  const [direction, setDirection] = useState<Direction>(null);
  const displayedRef = useRef(value);

  useEffect(() => {
    const from = displayedRef.current;
    const to = value;
    if (from === to) return;

    setDirection(to > from ? "up" : "down");
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (to - from) * eased);
      displayedRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        displayedRef.current = to;
        setDirection(null);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const color =
    direction === "up" ? "text-emerald-600" : direction === "down" ? "text-rose-600" : "";
  const hourLabel = hourDelta > 0 ? `+${hourDelta}` : hourDelta < 0 ? `${hourDelta}` : null;

  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={`inline-block tabular-nums transition-colors duration-500 ${color}`}>
        {display}
      </span>
      {hourLabel && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
            hourDelta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
          title="Change in the last hour"
        >
          {hourLabel}
        </span>
      )}
    </span>
  );
}
