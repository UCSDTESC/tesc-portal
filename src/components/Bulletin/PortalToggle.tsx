import { PortalMode } from "@lib/constants";
import { FaBriefcase, FaCalendarDays } from "react-icons/fa6";

export default function PortalToggle({
  portalMode,
  onChange,
}: {
  portalMode: PortalMode;
  onChange: (mode: PortalMode) => void;
}) {
  return (
    <div
      className="relative flex shrink-0 items-center rounded-full bg-white/80 p-0.5 shadow-sm h-7 w-[3.75rem]"
      role="tablist"
      aria-label="Portal view"
    >
      <div
        className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-blue shadow-sm transition-transform duration-200 ease-out"
        style={{
          left: "2px",
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
        className="relative z-10 flex h-6 w-1/2 items-center justify-center rounded-full transition-colors duration-200"
        style={{ color: portalMode === "events" ? "white" : "#114675" }}
      >
        <FaCalendarDays className="text-xs" aria-hidden />
      </button>
      <button
        type="button"
        role="tab"
        aria-label="Recruiter Portal"
        aria-selected={portalMode === "recruiter"}
        title="Recruiter Portal"
        onClick={() => onChange("recruiter")}
        className="relative z-10 flex h-6 w-1/2 items-center justify-center rounded-full transition-colors duration-200"
        style={{ color: portalMode === "recruiter" ? "white" : "#114675" }}
      >
        <FaBriefcase className="text-xs" aria-hidden />
      </button>
    </div>
  );
}
