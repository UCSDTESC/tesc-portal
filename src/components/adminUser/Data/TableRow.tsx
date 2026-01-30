import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Event } from "@lib/constants";
import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { CSVLink } from "react-csv";
import { IoMdDownload } from "react-icons/io";
import supabase from "@server/supabase";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

type ColumnDef = { key: string; label: string };

type Props = {
  daton: Event;
  columns: readonly ColumnDef[];
  getCellValue: (daton: Event, key: string) => string;
  onDelete: (id: string) => Promise<void>;
  onEdit: (daton: Event) => void;
};

export default function TableRow({ daton, columns, getCellValue, onDelete, onEdit }: Props) {
  const [attendees, setAttendees] = useState<
    {
      user_id: string;
      users: { email: string; first_name: string; last_name: string; major: string };
    }[]
  >([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    const { data } = await supabase
      .from("events_log")
      .select("user_id, users (email, first_name, last_name, major)")
      .eq("event_id", daton.id)
      .eq("attended", true);
    if (data) {
      setAttendees(
        data as unknown as {
          user_id: string;
          users: { email: string; first_name: string; last_name: string; major: string };
        }[],
      );
    }
  };

  const truncate = (s: string, max = 40) => (s.length <= max ? s : s.slice(0, max) + "…");

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
      {columns.map((col) => {
        if (col.key === "actions") {
          return (
            <td
              key={col.key}
              className="px-3 py-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                  onClick={() => onEdit(daton)}
                  title="Edit"
                >
                  <EditOutlined />
                </button>
                <DeleteConfirmationModal
                  itemName={daton.title}
                  isDeleting={isDeleting}
                  onConfirm={handleDelete}
                  trigger={
                    <button
                      type="button"
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete"
                    >
                      <DeleteOutlined />
                    </button>
                  }
                />
                {daton.track_attendance && (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      className="p-1.5 rounded text-slate-600 hover:bg-slate-200 cursor-pointer"
                      onClick={toggleAttendees}
                      title={showAttendees ? "Hide attendees" : "View attendees"}
                    >
                      {showAttendees ? (
                        <FaRegEye className="inline" />
                      ) : (
                        <FaRegEyeSlash className="inline" />
                      )}
                    </button>
                    {showAttendees && (
                      <div className="absolute right-0 top-full mt-1 z-10 min-w-[200px] max-h-48 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg py-2">
                        <div className="px-2 py-1 text-xs font-semibold text-slate-500 border-b border-slate-100 flex items-center justify-between">
                          Attendees
                          <CSVLink
                            data={attendees.map((a) => ({
                              user_id: a.user_id,
                              email: a.users.email,
                              first_name: a.users.first_name,
                              last_name: a.users.last_name,
                              major: a.users.major,
                            }))}
                            className="text-blue-600 hover:underline"
                            filename={`attendees-${daton.title?.replace(/\s+/g, "-") || daton.id}.csv`}
                          >
                            <IoMdDownload className="inline" />
                          </CSVLink>
                        </div>
                        <ul className="text-xs text-slate-700 divide-y divide-slate-100">
                          {attendees.length === 0 ? (
                            <li className="px-2 py-2 text-slate-500">Loading…</li>
                          ) : (
                            attendees.map((a) => (
                              <li key={a.user_id} className="px-2 py-1.5">
                                {a.users.email}
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
        const raw = getCellValue(daton, col.key);
        const display =
          col.key === "title" || col.key === "location_str" || col.key === "tags"
            ? truncate(raw)
            : raw;
        return (
          <td
            key={col.key}
            className="px-3 py-2 border-r border-slate-200 last:border-r-0 text-slate-700 max-w-[200px]"
            title={raw !== display ? raw : undefined}
          >
            {display || "—"}
          </td>
        );
      })}
    </tr>
  );
}
