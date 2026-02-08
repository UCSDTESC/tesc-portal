import { forwardRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import UserContext from "@lib/UserContext";
import { useEditModal } from "@lib/hooks/useEditModal";
import { useData } from "@lib/hooks/useData";
import {
  DATA_TABLE_COLUMNS,
  DATA_TABLE_COLUMNS_STORAGE_KEY,
  DATA_TABLE_NUMERIC_OPS,
  DATA_TABLE_PAGE_SIZE_OPTIONS,
  formdata,
  tags as TAGS_CONST,
} from "@lib/constants";
import type {
  DataTableColumnFilter,
  DataTableDateFilter,
  DataTableFilterType,
  DataTableNumericFilter,
} from "@lib/constants";
import {
  getDataTableCellValue,
  getDataTableSortValue,
  getInitialHiddenColumnKeys,
  matchesDataTableColumnFilter,
} from "@lib/utils";
import { useMediaQuery } from "@lib/hooks/useMediaQuery";

import Form from "../Form/Form";
import TableRow from "./TableRow";
import { Button } from "@components/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, Columns2, FilterIcon } from "lucide-react";
import { useOutsideClicks } from "@lib/hooks/useOutsideClick";

export default function DataTable() {
  const { User } = useContext(UserContext);
  const { data, handleDelete, fetchData } = useData(User);
  const { showEditModal, curID, currEdit, setShowEditModal, openEditModal } = useEditModal();
  const isLgOrSmaller = useMediaQuery("(max-width: 1024px)");

  const [columnFilters, setColumnFilters] = useState<Record<string, DataTableColumnFilter>>({});
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeFilterKey, setActiveFilterKey] = useState<string | null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const columnsPopupRef = useRef<HTMLDivElement>(null);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(getInitialHiddenColumnKeys);
  const [showColumnsPopup, setShowColumnsPopup] = useState(false);

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
    window.localStorage.setItem(
      DATA_TABLE_COLUMNS_STORAGE_KEY,
        JSON.stringify(Array.from(hiddenColumnKeys))
      );
    } catch {
      // ignore quota / disabled storage
    }
  }, [hiddenColumnKeys]);

  const visibleColumns = useMemo(
    () => DATA_TABLE_COLUMNS.filter((col) => !hiddenColumnKeys.has(col.key)),
    [hiddenColumnKeys]
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((daton) => {
      for (const col of DATA_TABLE_COLUMNS) {
        if (col.key === "actions" || !("filterType" in col)) continue;
        const filterVal = columnFilters[col.key];
        const filterType = "filterType" in col ? col.filterType : undefined;
        if (
          filterVal != null &&
          !matchesDataTableColumnFilter(daton, col.key, filterType, filterVal, getDataTableCellValue)
        )
          return false;
      }
      return true;
    });
  }, [data, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = getDataTableSortValue(a, sortColumn);
      const bVal = getDataTableSortValue(b, sortColumn);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredData, sortColumn, sortDirection]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedData.length / pageSize)),
    [sortedData.length, pageSize],
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (key === "actions") return;
    if (sortColumn === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value) as (typeof DATA_TABLE_PAGE_SIZE_OPTIONS)[number]);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [columnFilters, sortColumn, sortDirection]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const setColumnFilter = (key: string, value: DataTableColumnFilter) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openFilterPopup = (key: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveFilterKey((prev) => (prev === key ? null : key));
    setFilterAnchorRect({ top: rect.bottom + 4, left: rect.left });
  };

  useOutsideClicks([filterPopupRef], (e) => {
    if ((e.target as Element).closest("[data-filter-trigger]")) return;
    setActiveFilterKey(null);
  });

  useOutsideClicks([columnsPopupRef], () => setShowColumnsPopup(false));

  const uniqueLocations = useMemo(() => {
    if (!data) return [];
    const locs = new Set<string>();
    data.forEach((e) => {
      const l = (e.location_str ?? "").trim();
      if (l) locs.add(l);
    });
    return Array.from(locs).sort();
  }, [data]);

  if (!data) {
    return (
      <main className="grid w-full gap-4 px-4 pb-4 pt-0">
        <div className="text-slate-500">Loading events…</div>
      </main>
    );
  }

  return (
    <main className="grid w-full gap-4 px-4 pb-4 pt-0">
      {/* Toolbar: columns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative" ref={columnsPopupRef}>
          <button
            type="button"
            onClick={() => setShowColumnsPopup((p) => !p)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
              hiddenColumnKeys.size > 0
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            title="Toggle columns"
          >
            <Columns2 className="size-4" />
            Columns
          </button>
          {showColumnsPopup && (
            <div
              className="absolute left-0 top-full mt-1 z-20 min-w-[180px] max-h-64 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg py-2"
              role="menu"
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 border-b border-slate-100">
                Show columns
              </div>
              {(DATA_TABLE_COLUMNS as readonly { key: string; label: string }[]).map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenColumnKeys.has(col.key)}
                    onChange={() => toggleColumnVisibility(col.key)}
                    className="rounded cursor-pointer"
                  />
                  <span>{col.label || col.key}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Database-style table */}
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className={isLgOrSmaller ? "overflow-x-auto" : ""}>
          <table
            className={
              isLgOrSmaller
                ? "w-[100%] min-w-max border-collapse text-sm"
                : "w-full table-fixed border-collapse text-sm"
            }
          >
            <colgroup>
              {visibleColumns.map((col) => (
                <col
                  key={col.key}
                  style={
                    isLgOrSmaller
                      ? {
                          width: `${col.widthPx}px`,
                          minWidth: `${col.widthPx}px`,
                        }
                      : { width: col.width }
                  }
                />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-[#114675] border-b border-[#114675]/80">
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left font-semibold text-white px-2 py-2 border-r border-white/20 last:border-r-0 align-top"
                  >
                    <div className="inline-flex items-center gap-1 whitespace-nowrap">
                      {col.label}
                      {col.key !== "actions" &&
                        "filterType" in col &&
                        (col.filterType === "date" ||
                          col.filterType === "location" ||
                          col.filterType === "numeric" ||
                          col.filterType === "tags" ||
                          col.filterType === "textPopup" ||
                          col.filterType === "yesno") && (
                          <button
                            type="button"
                            onClick={(e) => openFilterPopup(col.key, e)}
                            className={`p-0.5 rounded hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white shrink-0 ${
                              columnFilters[col.key] != null &&
                              ((typeof columnFilters[col.key] === "string" &&
                                (columnFilters[col.key] as string).trim() !== "") ||
                                (typeof columnFilters[col.key] === "object" &&
                                  !Array.isArray(columnFilters[col.key]) &&
                                  Object.keys(columnFilters[col.key] as object).length > 0) ||
                                (Array.isArray(columnFilters[col.key]) &&
                                  (columnFilters[col.key] as string[]).length > 0))
                                ? "text-blue-200"
                                : "text-white/70"
                            }`}
                            title={`Filter ${col.label}`}
                            data-filter-trigger
                          >
                            <FilterIcon className="size-3.5 shrink-0" />
                          </button>
                        )}
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          col.key !== "actions" ? "cursor-pointer select-none hover:opacity-90" : ""
                        }`}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.key !== "actions" &&
                          sortColumn === col.key &&
                          sortDirection === "asc" && <ArrowUpIcon className="size-3.5 shrink-0" />}
                        {col.key !== "actions" &&
                          sortColumn === col.key &&
                          sortDirection === "desc" && (
                            <ArrowDownIcon className="size-3.5 shrink-0" />
                          )}
                        {col.key !== "actions" && sortColumn !== col.key && (
                          <ArrowUpDownIcon className="size-3.5 shrink-0 opacity-50" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="px-3 py-6 text-center text-slate-500 border-b border-slate-200"
                  >
                    {data.length === 0
                      ? "No events yet."
                      : "No events match your search or filters."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((daton) => (
                  <TableRow
                    key={daton.id}
                    daton={daton}
                    columns={visibleColumns}
                    getCellValue={getDataTableCellValue}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-600">
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {activeFilterKey &&
        filterAnchorRect &&
        createPortal(
          <FilterPopup
            ref={filterPopupRef}
            anchorRect={filterAnchorRect}
            columnKey={activeFilterKey}
            columnLabel={DATA_TABLE_COLUMNS.find((c) => c.key === activeFilterKey)?.label ?? ""}
            filterType={
              DATA_TABLE_COLUMNS.find((c) => c.key === activeFilterKey && "filterType" in c) as
                | { filterType?: DataTableFilterType }
                | undefined
            }
            columnFilters={columnFilters}
            setColumnFilter={setColumnFilter}
            uniqueLocations={uniqueLocations}
            tagsOptions={TAGS_CONST}
            NUMERIC_OPS={DATA_TABLE_NUMERIC_OPS}
          />,
          document.body,
        )}

      {showEditModal &&
        createPortal(
          <EditModal {...{ setShowEditModal, fetchData, currEdit, curID }} />,
          document.body,
        )}
    </main>
  );
}

const FilterPopup = forwardRef<
  HTMLDivElement,
  {
    anchorRect: { top: number; left: number };
    columnKey: string;
    columnLabel: string;
    filterType: { filterType?: DataTableFilterType } | undefined;
    columnFilters: Record<string, DataTableColumnFilter>;
    setColumnFilter: (key: string, value: DataTableColumnFilter) => void;
    uniqueLocations: string[];
    tagsOptions: readonly string[];
    NUMERIC_OPS: readonly { value: string; label: string }[];
  }
>(function FilterPopup(
  {
    anchorRect,
    columnKey,
    columnLabel,
    filterType,
    columnFilters,
    setColumnFilter,
    uniqueLocations,
    tagsOptions,
    NUMERIC_OPS,
  },
  ref,
) {
  const content =
    filterType?.filterType === "date" ? (
      <div className="flex flex-col gap-2 p-3 min-w-[160px]">
        <span className="text-xs font-medium text-slate-600">{columnLabel}</span>
        <label className="text-xs text-slate-500">From</label>
        <input
          type="date"
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={(columnFilters[columnKey] as DataTableDateFilter)?.from ?? ""}
          onChange={(e) =>
            setColumnFilter(columnKey, {
              ...((columnFilters[columnKey] as DataTableDateFilter) ?? {}),
              from: e.target.value || undefined,
            })
          }
        />
        <label className="text-xs text-slate-500">To</label>
        <input
          type="date"
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={(columnFilters[columnKey] as DataTableDateFilter)?.to ?? ""}
          onChange={(e) =>
            setColumnFilter(columnKey, {
              ...((columnFilters[columnKey] as DataTableDateFilter) ?? {}),
              to: e.target.value || undefined,
            })
          }
        />
      </div>
    ) : filterType?.filterType === "location" ? (
      <div className="flex flex-col gap-2 p-3 min-w-[200px] max-h-64">
        <span className="text-xs font-medium text-slate-600">{columnLabel}</span>
        <select
          multiple
          title="Ctrl+click to select multiple"
          className="w-full px-2 py-2 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
          value={(columnFilters[columnKey] as string[]) ?? []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            setColumnFilter(columnKey, selected);
          }}
        >
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>
    ) : filterType?.filterType === "tags" ? (
      <div className="flex flex-col gap-2 p-3 min-w-[200px] max-h-64">
        <span className="text-xs font-medium text-slate-600">{columnLabel}</span>
        <select
          multiple
          title="Ctrl+click to select multiple"
          className="w-full px-2 py-2 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
          value={(columnFilters[columnKey] as string[]) ?? []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) => o.value);
            setColumnFilter(columnKey, selected);
          }}
        >
          {tagsOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
    ) : filterType?.filterType === "textPopup" ? (
      <div className="flex flex-col gap-2 p-3 min-w-[200px]">
        <span className="text-xs font-medium text-slate-600">{columnLabel}</span>
        <input
          type="text"
          placeholder={`Filter ${columnLabel}…`}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={(columnFilters[columnKey] as string) ?? ""}
          onChange={(e) => setColumnFilter(columnKey, e.target.value)}
        />
      </div>
    ) : filterType?.filterType === "yesno" ? (
      <div className="flex flex-col gap-2 p-3 min-w-[140px]">
        <span className="text-xs font-medium text-slate-600">{columnLabel}</span>
        <select
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={(columnFilters[columnKey] as string) ?? ""}
          onChange={(e) => setColumnFilter(columnKey, e.target.value === "" ? "" : e.target.value)}
        >
          <option value="">All</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
    ) : filterType?.filterType === "numeric" ? (
      <div className="flex flex-col gap-2 p-3 min-w-[160px]">
        <span className="text-xs font-medium text-slate-600">{columnLabel}</span>
        <div className="flex gap-2">
          <select
            className="px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={(columnFilters[columnKey] as DataTableNumericFilter)?.op ?? "eq"}
            onChange={(e) =>
              setColumnFilter(columnKey, {
                op: e.target.value as DataTableNumericFilter["op"],
                value: (columnFilters[columnKey] as DataTableNumericFilter)?.value ?? "",
              })
            }
          >
            {NUMERIC_OPS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#"
            value={(columnFilters[columnKey] as DataTableNumericFilter)?.value ?? ""}
            onChange={(e) =>
              setColumnFilter(columnKey, {
                op: (columnFilters[columnKey] as DataTableNumericFilter)?.op ?? "eq",
                value: e.target.value,
              })
            }
          />
        </div>
      </div>
    ) : null;

  return (
    <div
      ref={ref}
      className="fixed z-50 rounded-lg border border-slate-200 bg-white shadow-lg"
      style={{
        top: anchorRect.top,
        left: anchorRect.left,
      }}
    >
      {content}
    </div>
  );
});

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
