import { Download, Eye, EyeOff, QrCode, Trash2 } from "lucide-react";
import { Event } from "@lib/constants";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import EventQrModal from "../Form/EventQrModal";
import { fetchEventAttendanceToken } from "@services/event";
import { buildRegistrantCsv, fetchEventRegistrantsWithAnswers, type EventRegistrantRow } from "@services/eventQuestions";
import DisplayToast from "@lib/hooks/useToast";
import AnimatedNumber from "./AnimatedNumber";

type ColumnDef = { key: string; label: string };

type Props = {
  daton: Event;
  columns: readonly ColumnDef[];
  getCellValue: (daton: Event, key: string) => string;
  onDelete: (id: string) => Promise<void>;
  onEdit: (daton: Event) => void;
  focusId?: string | null;
};

/** Columns whose cell values are "Yes"/"No" and render as status pills. */
const YESNO_COLUMNS = new Set(["track_attendance", "as_funding"]);

function YesNoPill({ value }: { value: string }) {
  const yes = value === "Yes";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        yes ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {value}
    </span>
  );
}

function TagChips({ raw }: { raw: string }) {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tags.length === 0) return <span className="text-ink-muted">—</span>;
  const shown = tags.slice(0, 3);
  const extra = tags.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((tag) => (
        <span
          key={tag}
          className="inline-flex max-w-[110px] truncate rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
          title={tag}
        >
          {tag}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs font-medium text-ink-muted">+{extra}</span>
      )}
    </span>
  );
}

export default function TableRow({
  daton,
  columns,
  getCellValue,
  onDelete,
  onEdit,
  focusId,
}: Props) {
  const [attendees, setAttendees] = useState<EventRegistrantRow[]>([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrModal, setQrModal] = useState<{
    eventId: string;
    eventTitle: string;
    attendanceToken: string;
  } | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(daton.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAttendees = () => {
    setShowAttendees((prev) => !prev);
    if (attendees.length === 0) fetchAttendees();
  };

  const fetchAttendees = async () => {
    const { rows } = await fetchEventRegistrantsWithAnswers(daton.id);
    setAttendees(rows);
  };

  const openQrModal = async () => {
    setLoadingQr(true);
    try {
      let token = daton.attendance_token ?? null;
      if (!token) {
        const { token: fetched, error } = await fetchEventAttendanceToken(daton.id);
        if (error || !fetched) {
          DisplayToast("QR code is not available for this event", "error");
          return;
        }
        token = fetched;
      }
      setQrModal({
        eventId: daton.id,
        eventTitle: daton.title,
        attendanceToken: token,
      });
    } finally {
      setLoadingQr(false);
    }
  };

  const truncate = (s: string, max = 40) => (s.length <= max ? s : s.slice(0, max) + "…");
  return (
    <>
      <tr
        className={`border-b border-line transition-colors last:border-b-0 hover:bg-brand-50/40 cursor-pointer ${focusId === daton.id ? "bg-brand-50" : ""}`}
        onClick={() => onEdit(daton)}
      >
        {columns.map((col) => {
          if (col.key === "actions") {
            return (
              <td
                key={col.key}
                className="px-3 py-2 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-0.5">
                  <DeleteConfirmationModal
                    itemName={daton.title}
                    isDeleting={isDeleting}
                    onConfirm={handleDelete}
                    trigger={
                      <button
                        type="button"
                        className="cursor-pointer rounded-lg p-1.5 text-destructive hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    }
                  />
                  {daton.track_attendance && (
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg p-1.5 text-ink-secondary hover:bg-surface hover:text-ink disabled:opacity-50"
                      onClick={openQrModal}
                      disabled={loadingQr}
                      title="Show QR code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  )}
                  {(daton.track_attendance || (daton.questions?.length ?? 0) > 0) && (
                    <div className="relative inline-block">
                      <button
                        type="button"
                        className="cursor-pointer rounded-lg p-1.5 text-ink-secondary hover:bg-surface hover:text-ink"
                        onClick={toggleAttendees}
                        title={showAttendees ? "Hide registrants" : "View registrants"}
                      >
                        {showAttendees ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      {showAttendees && (
                        <div className="card-shadow absolute top-full right-0 z-10 mt-1 min-w-[220px] max-h-48 overflow-auto rounded-2xl border border-line bg-white py-2">
                          <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-xs font-semibold text-ink-muted">
                            Registrants
                            <CSVLink
                              data={buildRegistrantCsv(daton.questions ?? [], attendees)}
                              className="text-brand-600 hover:underline"
                              filename={`registrants-${daton.title?.replace(/\s+/g, "-") || daton.id}.csv`}
                            >
                              <Download className="inline h-3.5 w-3.5" />
                            </CSVLink>
                          </div>
                          <ul className="divide-y divide-line text-xs text-ink-secondary">
                            {attendees.length === 0 ? (
                              <li className="px-3 py-2 text-ink-muted">None yet</li>
                            ) : (
                              attendees.map((a) => (
                                <li key={a.events_log_id} className="px-3 py-1.5">
                                  {a.users?.email ?? a.user_id}
                                  {a.attended ? " · attended" : " · RSVP"}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>
            );
          }
          if (col.key === "rsvp" || col.key === "attendance") {
            const count = Number(col.key === "rsvp" ? daton.rsvp : daton.attendance);
            return (
              <td
                key={col.key}
                className="min-w-0 overflow-hidden px-3 py-2 text-ellipsis text-ink-secondary"
              >
                <AnimatedNumber
                  value={Number.isFinite(count) ? count : 0}
                  hourDelta={
                    col.key === "rsvp"
                      ? daton.rsvp_hour_delta ?? 0
                      : daton.attendance_hour_delta ?? 0
                  }
                />
              </td>
            );
          }
          const raw = getCellValue(daton, col.key);
          if (YESNO_COLUMNS.has(col.key)) {
            return (
              <td
                key={col.key}
                className="min-w-0 overflow-hidden px-3 py-2 text-ellipsis"
              >
                {raw ? <YesNoPill value={raw} /> : <span className="text-ink-muted">—</span>}
              </td>
            );
          }
          if (col.key === "tags") {
            return (
              <td
                key={col.key}
                className="min-w-0 overflow-hidden px-3 py-2 text-ellipsis"
              >
                <TagChips raw={raw} />
              </td>
            );
          }
          const display =
            col.key === "title" || col.key === "location_str"
              ? truncate(raw)
              : raw;
          return (
            <td
              key={col.key}
              className={`min-w-0 overflow-hidden px-3 py-2 text-ellipsis ${
                col.key === "title" ? "font-medium text-ink" : "text-ink-secondary"
              }`}
              title={raw !== display ? raw : undefined}
            >
              <span className="block truncate">{display || "—"}</span>
            </td>
          );
        })}
      </tr>
      {qrModal && (
        <EventQrModal
          eventId={qrModal.eventId}
          eventTitle={qrModal.eventTitle}
          attendanceToken={qrModal.attendanceToken}
          onClose={() => setQrModal(null)}
        />
      )}
    </>
  );
}
