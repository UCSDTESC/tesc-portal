import { EventSlotForm } from "@lib/constants";
import { Tooltip } from "@mui/material";
import { IoInformationCircleOutline } from "react-icons/io5";

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
        <div className="flex items-center gap-1">
          <label className="font-medium">Time slots</label>
          <Tooltip
            title="The event's overall start and end times are automatically set from your earliest and latest time slots."
            placement="bottom"
          >
            <IoInformationCircleOutline className="text-sm" />
          </Tooltip>
        </div>
        <button
          type="button"
          className="text-sm text-navy underline cursor-pointer"
          onClick={addSlot}
        >
          + Add time slot
        </button>
      </div>
      {slots.map((slot, index) => (
        <div key={slot.id ?? `slot-${index}`} className="rounded-lg border border-gray-300 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-navy">Slot {index + 1}</span>
            {slots.length > 1 && (
              <button
                type="button"
                className="text-xs text-red-600 underline cursor-pointer"
                onClick={() => removeSlot(index)}
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Start</label>
            <input
              type="datetime-local"
              className="border-black border rounded-lg px-3 h-12"
              value={slot.starts_at}
              onChange={(e) => updateSlot(index, { starts_at: e.target.value })}
              required
            />
            <div className="flex items-center gap-1">
              <label className="text-sm">End</label>
              <Tooltip title="Slot end must be after slot start." placement="bottom">
                <IoInformationCircleOutline className="text-sm" />
              </Tooltip>
            </div>
            <input
              type="datetime-local"
              className="border-black border rounded-lg px-3 h-12"
              min={slot.starts_at}
              value={slot.ends_at}
              onChange={(e) => {
                if (new Date(e.target.value).getTime() <= new Date(slot.starts_at).getTime()) {
                  return;
                }
                updateSlot(index, { ends_at: e.target.value });
              }}
              required
            />
            {showCapacity && (
              <>
                <label className="text-sm">Capacity (optional)</label>
                <input
                  type="number"
                  min={0}
                  className="border-black border rounded-lg px-3 h-12"
                  value={slot.capacity ?? ""}
                  onChange={(e) =>
                    updateSlot(index, {
                      capacity: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
