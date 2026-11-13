import {
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Event } from "@lib/constants";
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
import type { TablePaginationProps } from "@lib/constants";
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

export default function DataTable({
  orgName,
  pagination,
  embedded = false,
  cols,
  onRowClick,
  focusId,
}: {
  orgName?: string;
  pagination?: TablePaginationProps;
  embedded?: boolean;
  cols?: string[];
  onRowClick?: (daton: Event) => void;
  focusId?: string | null;
}) {
  const { User } = useContext(UserContext);
  const { data, handleDelete, fetchData } = useData(User, orgName);
  const { showEditModal, curID, currEdit, setShowEditModal, openEditModal } = useEditModal();
  const isLgOrSmaller = useMediaQuery("(max-width: 1024px)");

  const [columnFilters, setColumnFilters] = useState<Record<string, DataTableColumnFilter>>({});
  const [internalPageSize, setInternalPageSize] = useState<number>(10);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const pageSize = pagination?.pageSize ?? internalPageSize;
  const currentPage = pagination?.currentPage ?? internalCurrentPage;
  const setCurrentPage = pagination?.onCurrentPageChange ?? setInternalCurrentPage;
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
        JSON.stringify(Array.from(hiddenColumnKeys)),
      );
    } catch {
      // ignore quota / disabled storage
    }
  }, [hiddenColumnKeys]);

  const visibleColumns = useMemo(
    () =>
      DATA_TABLE_COLUMNS.filter((col) => {
        // Hide org_name column when viewing a specific org (not super_org)
        if (cols) {
          return cols.includes(col.key);
        }
        if (col.key === "org_name" && orgName !== undefined) {
          return false;
        }
        return !hiddenColumnKeys.has(col.key);
      }),
    [cols, hiddenColumnKeys, orgName],
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((daton) => {
      if (onRowClick && daton.type !== "external") return false;
      for (const col of DATA_TABLE_COLUMNS) {
        if (col.key === "actions" || !("filterType" in col)) continue;
        // Skip org_name filtering when viewing a specific org (not super_org)
        if (col.key === "org_name" && orgName !== undefined) continue;
        const filterVal = columnFilters[col.key];
        const filterType = "filterType" in col ? col.filterType : undefined;
        if (
          filterVal != null &&
          !matchesDataTableColumnFilter(
            daton,
            col.key,
            filterType,
            filterVal,
            getDataTableCellValue,
          )
        )
          return false;
      }
      return true;
    });
  }, [data, onRowClick, orgName, columnFilters]);

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
    const size = Number(value) as (typeof DATA_TABLE_PAGE_SIZE_OPTIONS)[number];
    if (pagination) {
      pagination.onPageSizeChange(size);
      pagination.onCurrentPageChange(1);
    } else {
      setInternalPageSize(size);
      setInternalCurrentPage(1);
    }
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
      <Wrapper embedded={embedded}>
        <div className="text-sm text-ink-muted">Loading events…</div>
      </Wrapper>
    );
  }

  return (
    <Wrapper embedded={embedded}>
      {/* Toolbar: columns */}
      {!cols && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={columnsPopupRef}>
            <button
              type="button"
              onClick={() => setShowColumnsPopup((p) => !p)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                hiddenColumnKeys.size > 0
                  ? "border-brand-500/40 bg-brand-50 text-brand-600"
                  : "border-line bg-white text-ink-secondary hover:bg-surface"
              }`}
              title="Toggle columns"
            >
              <Columns2 className="size-4" />
              Columns
            </button>
            {showColumnsPopup && (
              <div
                className="card-shadow absolute top-full left-0 z-20 mt-1 max-h-64 min-w-[180px] overflow-auto rounded-2xl border border-line bg-white py-2"
                role="menu"
              >
                <div className="border-b border-line px-3 py-1.5 text-xs font-semibold text-ink-muted">
                  Show columns
                </div>
                {(DATA_TABLE_COLUMNS as readonly { key: string; label: string }[])
                  .filter((col) => {
                    // Hide org_name checkbox for non-super_org accounts
                    if (col.key === "org_name" && orgName !== undefined) {
                      return false;
                    }
                    return true;
                  })
                  .map((col) => (
                    <label
                      key={col.key}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-brand-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenColumnKeys.has(col.key)}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="cursor-pointer rounded accent-brand-600"
                      />
                      <span>{col.label || col.key}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database-style table */}
      <div className="card-shadow max-h-[640px] overflow-auto rounded-2xl border border-line bg-white">
        <table
          className={
            isLgOrSmaller
              ? "w-full min-w-max border-collapse text-sm"
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
            <tr className="border-b border-line bg-surface">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="sticky top-0 z-10 bg-surface px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
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
                          className={`rounded p-0.5 transition-colors hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                            columnFilters[col.key] != null &&
                            ((typeof columnFilters[col.key] === "string" &&
                              (columnFilters[col.key] as string).trim() !== "") ||
                              (typeof columnFilters[col.key] === "object" &&
                                !Array.isArray(columnFilters[col.key]) &&
                                Object.keys(columnFilters[col.key] as object).length > 0) ||
                              (Array.isArray(columnFilters[col.key]) &&
                                (columnFilters[col.key] as string[]).length > 0))
                              ? "bg-brand-50 text-brand-600"
                              : "text-ink-muted"
                          }`}
                          title={`Filter ${col.label}`}
                          data-filter-trigger
                        >
                          <FilterIcon className="size-3.5 shrink-0" />
                        </button>
                      )}
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        col.key !== "actions" ? "cursor-pointer select-none hover:text-ink" : ""
                      } ${sortColumn === col.key ? "text-brand-600" : ""}`}
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
                  className="px-3 py-8 text-center text-sm text-ink-muted"
                >
                  {data.length === 0
                    ? "No events yet."
                    : "No events match your search or filters."}
                </td>
              </tr>
            ) : (
              paginatedData.map((daton) =>
                onRowClick ? (
                  <>
                    <TableRow
                      key={daton.id}
                      daton={daton}
                      columns={visibleColumns}
                      getCellValue={getDataTableCellValue}
                      onDelete={handleDelete}
                      onEdit={onRowClick}
                      focusId={focusId}
                    />
                  </>
                ) : (
                  <TableRow
                    key={daton.id}
                    daton={daton}
                    columns={visibleColumns}
                    getCellValue={getDataTableCellValue}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                  />
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-secondary">Rows per page</span>
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
            <span className="text-sm text-ink-secondary">
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-ink-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
    </Wrapper>
  );
}

function Wrapper({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  if (embedded) {
    return <div className="grid w-full gap-4">{children}</div>;
  }
  return <main className="grid w-full gap-4 px-4 pb-4 pt-0">{children}</main>;
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
  const inputClass =
    "w-full rounded-xl border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:outline-none";
  const content =
    filterType?.filterType === "date" ? (
      <div className="flex min-w-[160px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <label className="text-xs text-ink-muted">From</label>
        <input
          type="date"
          className={inputClass}
          value={(columnFilters[columnKey] as DataTableDateFilter)?.from ?? ""}
          onChange={(e) =>
            setColumnFilter(columnKey, {
              ...((columnFilters[columnKey] as DataTableDateFilter) ?? {}),
              from: e.target.value || undefined,
            })
          }
        />
        <label className="text-xs text-ink-muted">To</label>
        <input
          type="date"
          className={inputClass}
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
      <div className="flex max-h-64 min-w-[200px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <select
          multiple
          title="Ctrl+click to select multiple"
          className={`${inputClass} overflow-y-auto py-2`}
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
      <div className="flex max-h-64 min-w-[200px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <select
          multiple
          title="Ctrl+click to select multiple"
          className={`${inputClass} overflow-y-auto py-2`}
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
      <div className="flex min-w-[200px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <input
          type="text"
          placeholder={`Filter ${columnLabel}…`}
          className={inputClass}
          value={(columnFilters[columnKey] as string) ?? ""}
          onChange={(e) => setColumnFilter(columnKey, e.target.value)}
        />
      </div>
    ) : filterType?.filterType === "yesno" ? (
      <div className="flex min-w-[140px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <select
          className={inputClass}
          value={(columnFilters[columnKey] as string) ?? ""}
          onChange={(e) => setColumnFilter(columnKey, e.target.value === "" ? "" : e.target.value)}
        >
          <option value="">All</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
    ) : filterType?.filterType === "numeric" ? (
      <div className="flex min-w-[160px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <div className="flex gap-2">
          <select
            className="rounded-xl border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
            className={`${inputClass} flex-1`}
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
      className="card-shadow fixed z-50 rounded-2xl border border-line bg-white"
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
  // Same sidebar offset as BulletinEditModal: this modal is portaled to
  // document.body, so without it the panel centers on the full viewport and
  // slides underneath the AppShell sidebar.
  const sidebarCollapsed =
    typeof window !== "undefined" &&
    window.localStorage.getItem("tesc-sidebar-collapsed") === "true";
  return (
    <div
      className={`fixed inset-0 z-100 flex items-start justify-center overflow-y-auto py-5 ${
        sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
      }`}
    >
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
        inModal
      />
    </div>
  );
}
