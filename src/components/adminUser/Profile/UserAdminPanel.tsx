import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  Columns2,
  FilterIcon,
  Search,
} from "lucide-react";

import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import {
  DATA_TABLE_NUMERIC_OPS,
  DATA_TABLE_PAGE_SIZE_OPTIONS,
  USER_ADMIN_COLUMNS_STORAGE_KEY,
  USER_ADMIN_TABLE_COLUMNS,
} from "@lib/constants";
import type {
  DataTableColumnFilter,
  DataTableFilterType,
  DataTableNumericFilter,
  TablePaginationProps,
} from "@lib/constants";
import DisplayToast from "@lib/hooks/useToast";
import { useMediaQuery } from "@lib/hooks/useMediaQuery";
import { useOutsideClicks } from "@lib/hooks/useOutsideClick";
import {
  getInitialUserAdminHiddenColumnKeys,
  getUserAdminCellValue,
  getUserAdminSortValue,
  matchesUserAdminColumnFilter,
} from "@lib/utils";
import type { AdminUserRow } from "@services/adminUsers";
import { listAllUsersAdmin } from "@services/adminUsers";
import UserDetailDrawer from "./UserDetailDrawer";

function formatName(row: AdminUserRow) {
  const name = getUserAdminCellValue(row, "name");
  return name || "—";
}

export default function UserAdminPanel({
  pagination,
  embedded = false,
}: {
  pagination?: TablePaginationProps;
  embedded?: boolean;
}) {
  const isLgOrSmaller = useMediaQuery("(max-width: 1024px)");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(
    getInitialUserAdminHiddenColumnKeys,
  );
  const [showColumnsPopup, setShowColumnsPopup] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { users: rows, error } = await listAllUsersAdmin(search);
    setLoading(false);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    setUsers(rows ?? []);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, setCurrentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        USER_ADMIN_COLUMNS_STORAGE_KEY,
        JSON.stringify(Array.from(hiddenColumnKeys)),
      );
    } catch {
      // ignore
    }
  }, [hiddenColumnKeys]);

  const visibleColumns = useMemo(
    () => USER_ADMIN_TABLE_COLUMNS.filter((col) => !hiddenColumnKeys.has(col.key)),
    [hiddenColumnKeys],
  );

  const filteredData = useMemo(() => {
    return users.filter((row) => {
      for (const col of USER_ADMIN_TABLE_COLUMNS) {
        if (col.key === "actions" || !("filterType" in col)) continue;
        const filterVal = columnFilters[col.key];
        const filterType = "filterType" in col ? col.filterType : undefined;
        if (
          filterVal != null &&
          !matchesUserAdminColumnFilter(row, col.key, filterType, filterVal)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = getUserAdminSortValue(a, sortColumn);
      const bVal = getUserAdminSortValue(b, sortColumn);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
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

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useOutsideClicks([filterPopupRef], (e) => {
    if ((e.target as Element).closest("[data-filter-trigger]")) return;
    setActiveFilterKey(null);
  });

  useOutsideClicks([columnsPopupRef], () => setShowColumnsPopup(false));

  const isFilterActive = (key: string) => {
    const filter = columnFilters[key];
    if (filter == null) return false;
    if (typeof filter === "string") return filter.trim() !== "";
    if (Array.isArray(filter)) return filter.length > 0;
    if (typeof filter === "object") {
      const nf = filter as DataTableNumericFilter;
      if ("value" in nf) return Boolean(nf.value?.trim());
      return Object.keys(filter).length > 0;
    }
    return false;
  };

  if (loading && users.length === 0) {
    return (
      <div className={embedded ? "grid w-full gap-4" : "grid w-full gap-4 px-4 pb-4 pt-0"}>
        {!embedded && <h2 className="text-xl font-semibold tracking-tight text-ink">User Management</h2>}
        <div className="text-sm text-ink-muted">Loading users…</div>
      </div>
    );
  }

  return (
    <div className={embedded ? "grid w-full gap-4" : "grid w-full gap-4 px-4 pb-4 pt-0"}>
      {!embedded && <h2 className="text-xl font-semibold tracking-tight text-ink">User Management</h2>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users"
            className="w-full pl-9"
          />
        </div>
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
              {USER_ADMIN_TABLE_COLUMNS.map((col) => (
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

      <div
        className={`card-shadow max-h-[560px] overflow-auto rounded-2xl border border-line bg-white transition-opacity ${
          loading && users.length > 0 ? "opacity-60" : ""
        }`}
      >
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
                    ? { width: `${col.widthPx}px`, minWidth: `${col.widthPx}px` }
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
                  className="sticky top-0 z-10 bg-surface px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
                >
                  <div className="inline-flex items-center gap-1 whitespace-nowrap">
                    {col.label}
                    {col.key !== "actions" &&
                      "filterType" in col &&
                      (col.filterType === "numeric" || col.filterType === "textPopup") && (
                        <button
                          type="button"
                          onClick={(e) => openFilterPopup(col.key, e)}
                          className={`rounded p-0.5 transition-colors hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                            isFilterActive(col.key) ? "bg-brand-50 text-brand-600" : "text-ink-muted"
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
                      {col.key !== "actions" && sortColumn === col.key && sortDirection === "asc" && (
                        <ArrowUpIcon className="size-3.5 shrink-0" />
                      )}
                      {col.key !== "actions" && sortColumn === col.key && sortDirection === "desc" && (
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
                  {users.length === 0
                    ? "No users yet."
                    : "No users match your filters."}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.uuid}
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-brand-50/40"
                >
                  {visibleColumns.map((col) => {
                    if (col.key === "actions") {
                      return (
                        <td
                          key={col.key}
                          className="px-3 py-2 whitespace-nowrap"
                        >
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setSelectedUserId(row.uuid)}
                          >
                            View
                          </Button>
                        </td>
                      );
                    }
                    const raw = getUserAdminCellValue(row, col.key);
                    const display =
                      col.key === "name" ? formatName(row) : raw || "—";
                    return (
                      <td
                        key={col.key}
                        className={`min-w-0 overflow-hidden px-3 py-2.5 text-ellipsis ${
                          col.key === "name" ? "font-medium text-ink" : "text-ink-secondary"
                        }`}
                        title={raw !== display ? raw : undefined}
                      >
                        <span className="block truncate">{display}</span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {users.length > 0 && (
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
          <UserAdminFilterPopup
            ref={filterPopupRef}
            anchorRect={filterAnchorRect}
            columnKey={activeFilterKey}
            columnLabel={
              USER_ADMIN_TABLE_COLUMNS.find((c) => c.key === activeFilterKey)?.label ?? ""
            }
            filterType={
              USER_ADMIN_TABLE_COLUMNS.find((c) => c.key === activeFilterKey && "filterType" in c) as
                | { filterType?: DataTableFilterType }
                | undefined
            }
            columnFilters={columnFilters}
            setColumnFilter={setColumnFilter}
          />,
          document.body,
        )}

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onRolesChanged={loadUsers}
      />
    </div>
  );
}

const UserAdminFilterPopup = forwardRef<
  HTMLDivElement,
  {
    anchorRect: { top: number; left: number };
    columnKey: string;
    columnLabel: string;
    filterType: { filterType?: DataTableFilterType } | undefined;
    columnFilters: Record<string, DataTableColumnFilter>;
    setColumnFilter: (key: string, value: DataTableColumnFilter) => void;
  }
>(function UserAdminFilterPopup(
  { anchorRect, columnKey, columnLabel, filterType, columnFilters, setColumnFilter },
  ref,
) {
  const content =
    filterType?.filterType === "textPopup" ? (
      <div className="flex min-w-[200px] flex-col gap-2 p-3">
        <span className="text-xs font-medium text-ink-secondary">{columnLabel}</span>
        <input
          type="text"
          placeholder={`Filter ${columnLabel}…`}
          className="w-full rounded-xl border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          value={(columnFilters[columnKey] as string) ?? ""}
          onChange={(e) => setColumnFilter(columnKey, e.target.value)}
        />
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
            {DATA_TABLE_NUMERIC_OPS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            className="flex-1 rounded-xl border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
      className="card-shadow fixed z-[1400] rounded-2xl border border-line bg-white"
      style={{ top: anchorRect.top, left: anchorRect.left }}
    >
      {content}
    </div>
  );
});
