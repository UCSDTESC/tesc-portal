import type { ReactNode } from "react";
import { Compass } from "lucide-react";

/** Consistent empty / error / login-gate state. */
export default function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="card-shadow flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon ?? <Compass className="h-6 w-6" />}
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-secondary">{description}</p>
      )}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
