import { PortalMode } from "@lib/constants";
import { Briefcase, CalendarDays } from "lucide-react";
import { cn } from "@components/lib/utils";

export default function PortalToggle({
  portalMode,
  onChange,
}: {
  portalMode: PortalMode;
  onChange: (mode: PortalMode) => void;
}) {
  return (
    <div
      className="relative flex shrink-0 items-center rounded-full border border-line bg-white p-1 shadow-sm"
      role="tablist"
      aria-label="Portal view"
    >
      <div
        className="absolute bottom-1 top-1 rounded-full bg-navy-900 shadow-sm transition-transform duration-200 ease-out"
        style={{
          width: "calc(50% - 4px)",
          left: "4px",
          transform: portalMode === "events" ? "translateX(0)" : "translateX(100%)",
        }}
      />
      <button
        type="button"
        role="tab"
        aria-label="Events"
        aria-selected={portalMode === "events"}
        title="Events"
        onClick={() => onChange("events")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          portalMode === "events" ? "text-white" : "text-ink-secondary hover:text-ink",
        )}
      >
        <CalendarDays className="h-4 w-4" aria-hidden />
        Events
      </button>
      <button
        type="button"
        role="tab"
        aria-label="Recruiter Portal"
        aria-selected={portalMode === "recruiter"}
        title="Recruiter Portal"
        onClick={() => onChange("recruiter")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          portalMode === "recruiter" ? "text-white" : "text-ink-secondary hover:text-ink",
        )}
      >
        <Briefcase className="h-4 w-4" aria-hidden />
        Recruiter
      </button>
    </div>
  );
}
