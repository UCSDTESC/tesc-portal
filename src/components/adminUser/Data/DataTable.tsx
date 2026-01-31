import { useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import UserContext from "@lib/UserContext";
import { useEditModal } from "@lib/hooks/useEditModal";
import { useData } from "@lib/hooks/useData";
import { formdata } from "@lib/constants";
import { Event } from "@lib/constants";
import { DateParser } from "@lib/utils";

import Form from "../Form/Form";
import TableRow from "./TableRow";

const COLUMNS = [
  { key: "title", label: "Title", width: "10%" },
  { key: "password", label: "Code", width: "4%" },
  { key: "created_at", label: "Created", width: "7%" },
  { key: "start_date", label: "Start", width: "7%" },
  { key: "end_date", label: "End", width: "7%" },
  { key: "location_str", label: "Location", width: "16%" },
  { key: "rsvp", label: "RSVP", width: "7%" },
  { key: "attendance_cap", label: "Max RSVP", width: "8%" },
  { key: "attendance", label: "Attendance", width: "9%" },
  { key: "track_attendance", label: "Track attendance?", width: "11%" },
  { key: "tags", label: "Tags", width: "9%" },
  { key: "actions", label: "Actions", width: "5%" },
] as const;

function getCellValue(daton: Event, key: string): string {
  switch (key) {
    case "title":
      return daton.title ?? "";
    case "password":
      return daton.password ?? "";
    case "created_at":
      return DateParser(daton.created_at ?? "");
    case "start_date":
      return daton.start_date ? DateParser(daton.start_date) : "";
    case "end_date":
      return daton.end_date ? DateParser(daton.end_date) : "";
    case "location_str":
      return daton.location_str ?? "";
    case "rsvp":
      return String(daton.rsvp ?? "");
    case "attendance_cap":
      return daton.attendance_cap != null ? String(daton.attendance_cap) : "";
    case "attendance":
      return String(daton.attendance ?? "");
    case "track_attendance":
      return daton.track_attendance ? "Yes" : "No";
    case "tags":
      return Array.isArray(daton.tags) ? daton.tags.join(", ") : "";
    case "actions":
      return "";
    default:
      return "";
  }
}

function matchesSearch(daton: Event, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const title = (daton.title ?? "").toLowerCase();
  const location = (daton.location_str ?? "").toLowerCase();
  const tagsStr = (Array.isArray(daton.tags) ? daton.tags.join(" ") : "").toLowerCase();
  return title.includes(q) || location.includes(q) || tagsStr.includes(q);
}

function matchesColumnFilter(daton: Event, key: string, filterValue: string): boolean {
  if (!filterValue.trim()) return true;
  const cell = getCellValue(daton, key).toLowerCase();
  const q = filterValue.trim().toLowerCase();
  return cell.includes(q);
}

export default function DataTable() {
  const { User } = useContext(UserContext);
  const { data, handleDelete, fetchData } = useData(User);
  const { showEditModal, curID, currEdit, setShowEditModal, openEditModal } = useEditModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((daton) => {
      if (!matchesSearch(daton, searchQuery)) return false;
      for (const col of COLUMNS) {
        if (col.key === "actions") continue;
        const filterVal = columnFilters[col.key];
        if (filterVal != null && !matchesColumnFilter(daton, col.key, filterVal)) return false;
      }
      return true;
    });
  }, [data, searchQuery, columnFilters]);

  const setColumnFilter = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (!data) {
    return (
      <main className="grid w-full gap-4 px-4 pb-4 pt-0">
        <div className="text-slate-500">Loading events…</div>
      </main>
    );
  }

  return (
    <main className="grid w-full gap-4 px-4 pb-4 pt-0">
      {/* Toolbar: search */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Search events</label>
        <input
          type="search"
          placeholder="Search by title, location, or tags…"
          className="border border-slate-300 rounded-md px-3 py-2 text-sm w-72 max-w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Database-style table */}
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              {COLUMNS.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-[#114675] border-b border-[#114675]/80">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="text-left font-semibold text-white px-3 py-2 whitespace-nowrap border-r border-white/20 last:border-r-0"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-[#114675]/95 border-b border-slate-200">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="p-1 border-r border-white/20 last:border-r-0">
                    {col.key === "actions" ? (
                      <span className="block w-8" />
                    ) : (
                      <input
                        type="text"
                        placeholder={`Filter ${col.label}`}
                        className="w-full min-w-0 px-2 py-1 text-xs border border-white/30 rounded bg-white/95 text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-white focus:border-white"
                        value={columnFilters[col.key] ?? ""}
                        onChange={(e) => setColumnFilter(col.key, e.target.value)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-3 py-6 text-center text-slate-500 border-b border-slate-200"
                  >
                    {data.length === 0
                      ? "No events yet."
                      : "No events match your search or filters."}
                  </td>
                </tr>
              ) : (
                filteredData.map((daton) => (
                  <TableRow
                    key={daton.id}
                    daton={daton}
                    columns={COLUMNS}
                    getCellValue={getCellValue}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal &&
        createPortal(
          <EditModal {...{ setShowEditModal, fetchData, currEdit, curID }} />,
          document.body,
        )}
    </main>
  );
}

function EditModal({
  setShowEditModal,
  fetchData,
  currEdit,
  curID,
}: {
  setShowEditModal: (show: boolean) => void;
  currEdit: formdata;
  fetchData: () => void;
  curID: string;
}) {
  return (
    <div className="w-screen h-screen fixed top-0 flex justify-center items-center z-100 overflow-scroll">
      <div
        className="fixed top-0 w-full h-full bg-black opacity-35 cursor-pointer"
        onClick={() => setShowEditModal(false)}
      />
      <Form
        formdata={currEdit}
        id={curID}
        onSuccess={() => {
          setShowEditModal(false);
          fetchData();
        }}
        editEvent={true}
      />
    </div>
  );
}
