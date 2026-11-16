import { EventSlotForm } from "@lib/constants";
import { addHoursToLocalDatetime } from "@lib/utils";
import { Tooltip } from "@mui/material";
import { Info, Plus, Trash2 } from "lucide-react";

function isEndAfterStart(startsAt: string, endsAt: string): boolean {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
}

const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export default function EventSlotsEditor({
  slots,
  onChange,
  showCapacity = true,
}: {
  slots: EventSlotForm[];
  onChange: (slots: EventSlotForm[]) => void;
  showCapacity?: boolean;
}) {
  const updateSlot = (index: number, patch: Partial<EventSlotForm>) => {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    onChange(slots.filter((_, i) => i !== index));
  };

  const addSlot = () => {
    const last = slots[slots.length - 1];
    onChange([
      ...slots,
      {
        starts_at: last?.starts_at ?? "",
        ends_at: last?.ends_at ?? "",
        capacity: last?.capacity ?? null,
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-semibold text-ink">Time slots</label>
          <Tooltip
            title="The event's overall start and end times are automatically set from your earliest and latest time slots."
            placement="bottom"
          >
            <Info className="h-3.5 w-3.5 text-ink-muted" />
          </Tooltip>
        </div>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          onClick={addSlot}
        >
          <Plus className="h-4 w-4" />
          Add time slot
        </button>
      </div>
      {slots.map((slot, index) => (
        <div
          key={slot.id ?? `slot-${index}`}
          className="rounded-xl border border-line bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-navy-900">Slot {index + 1}</span>
            {slots.length > 1 && (
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={() => removeSlot(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-secondary">Start</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={slot.starts_at}
                onChange={(e) => {
                  const starts_at = e.target.value;
                  const patch: Partial<EventSlotForm> = { starts_at };
                  if (!isEndAfterStart(starts_at, slot.ends_at)) {
                    patch.ends_at = addHoursToLocalDatetime(starts_at, 1);
                  }
                  updateSlot(index, patch);
                }}
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <label className="text-sm font-medium text-ink-secondary">End</label>
                <Tooltip title="Slot end must be after slot start." placement="bottom">
                  <Info className="h-3.5 w-3.5 text-ink-muted" />
                </Tooltip>
              </div>
              <input
                type="datetime-local"
                className={inputClass}
                min={slot.starts_at}
                value={isEndAfterStart(slot.starts_at, slot.ends_at) ? slot.ends_at : ""}
                onChange={(e) => updateSlot(index, { ends_at: e.target.value })}
                required
              />
            </div>
            {showCapacity && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink-secondary">
                  Capacity (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={slot.capacity ?? ""}
                  onChange={(e) =>
                    updateSlot(index, {
                      capacity: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
