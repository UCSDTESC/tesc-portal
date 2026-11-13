import { useEffect, useState } from "react";
import { cn } from "@components/lib/utils";

/**
 * Organization avatar: the org's picture when it loads, otherwise a navy tile
 * with the org's initial. Never renders a broken image or an external
 * placeholder service.
 */
export default function OrgAvatar({
  name,
  src,
  className,
  initialClassName,
}: {
  name?: string | null;
  src?: string | null;
  className?: string;
  initialClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  const initial = (name ?? "T").trim().charAt(0).toUpperCase() || "T";

  // A new src deserves a fresh load attempt.
  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-navy-900 font-bold text-white ring-1 ring-line",
          className ?? "h-7 w-7",
          initialClassName ?? "text-sm",
        )}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      className={cn("shrink-0 rounded-full object-cover ring-1 ring-line", className ?? "h-7 w-7")}
    />
  );
}
