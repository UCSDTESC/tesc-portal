import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import {
  DATA_TABLE_PAGE_SIZE_OPTIONS,
  ORG_MEMBER_TABLE_COLUMNS,
  type TablePaginationProps,
} from "@lib/constants";
import DisplayToast from "@lib/hooks/useToast";
import { useMediaQuery } from "@lib/hooks/useMediaQuery";
import { formatRoleLabel } from "@lib/roles";
import type { OrgMemberRow, OrgRoleOption } from "@services/orgMembers";
import {
  assignOrgRoleByEmail,
  fetchOrgLeaderRoleOptions,
  listOrgMembers,
  removeOrgMemberByEmail,
} from "@services/orgMembers";

type Props = {
  orgId: number;
  pagination?: TablePaginationProps;
  embedded?: boolean;
};

function memberName(row: OrgMemberRow) {
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return name || "—";
}

export default function OrgMembersPanel({ orgId, pagination, embedded = false }: Props) {
  const isLgOrSmaller = useMediaQuery("(max-width: 1024px)");
  const [members, setMembers] = useState<OrgMemberRow[]>([]);
  const [roles, setRoles] = useState<OrgRoleOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  const [internalPageSize, setInternalPageSize] = useState(10);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const pageSize = pagination?.pageSize ?? internalPageSize;
  const currentPage = pagination?.currentPage ?? internalCurrentPage;
  const setCurrentPage = pagination?.onCurrentPageChange ?? setInternalCurrentPage;

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { members: rows, error } = await listOrgMembers(
      orgId,
      search,
      currentPage - 1,
      pageSize,
    );
    setLoading(false);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    setMembers(rows);
    setTotalCount(rows[0]?.total_count ?? 0);
  }, [orgId, search, currentPage, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, setCurrentPage]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    fetchOrgLeaderRoleOptions().then(({ roles: roleOptions, error }) => {
      if (error) {
        DisplayToast(error.message, "error");
        return;
      }
      setRoles(roleOptions);
      if (roleOptions.length > 0) {
        setAssignRoleId((prev) => prev || String(roleOptions[0].id));
      }
    });
  }, [orgId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

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

  const handleAssign = async () => {
    if (!assignEmail.trim() || !assignRoleId) {
      DisplayToast("Enter an email and role", "error");
      return;
    }
    setAssigning(true);
    const { error } = await assignOrgRoleByEmail(orgId, assignEmail, Number(assignRoleId));
    setAssigning(false);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    DisplayToast("Role assigned", "success");
    setAssignEmail("");
    loadMembers();
  };

  const handleRoleChange = async (row: OrgMemberRow, nextRoleId: string) => {
    setSavingEmail(row.email);
    const { error } = await assignOrgRoleByEmail(orgId, row.email, Number(nextRoleId));
    setSavingEmail(null);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    DisplayToast("Role updated", "success");
    loadMembers();
  };

  const handleRemove = async (row: OrgMemberRow) => {
    if (!window.confirm(`Remove ${row.email} from this organization?`)) return;
    setSavingEmail(row.email);
    const { error } = await removeOrgMemberByEmail(orgId, row.email);
    setSavingEmail(null);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    DisplayToast("Member removed", "success");
    loadMembers();
  };

  const wrapperClass = embedded ? "grid w-full gap-4" : "grid w-full gap-4 px-4 pb-4 pt-0";

  return (
    <div className={wrapperClass}>
      <div className="card-shadow rounded-2xl border border-line bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <UserPlus className="h-4 w-4 text-brand-500" />
          Assign role by email
        </h3>
        <div className="mt-3 grid items-end gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="grid gap-2">
            <Label htmlFor="assign-email">Email</Label>
            <Input
              id="assign-email"
              type="email"
              placeholder="member@ucsd.edu"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={assignRoleId} onValueChange={setAssignRoleId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {formatRoleLabel(role.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="rounded-xl bg-navy-900 text-white hover:bg-navy-800"
            disabled={assigning}
            onClick={handleAssign}
          >
            Assign
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search org members"
          className="pl-9"
        />
      </div>

      <div
        className={`card-shadow max-h-[560px] overflow-auto rounded-2xl border border-line bg-white transition-opacity ${
          loading && members.length > 0 ? "opacity-60" : ""
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
            {ORG_MEMBER_TABLE_COLUMNS.map((col) => (
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
              {ORG_MEMBER_TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="sticky top-0 z-10 bg-surface px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && members.length === 0 ? (
              <tr>
                <td colSpan={ORG_MEMBER_TABLE_COLUMNS.length} className="px-3 py-8 text-center text-sm text-ink-muted">
                  Loading members…
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={ORG_MEMBER_TABLE_COLUMNS.length} className="px-3 py-8 text-center text-sm text-ink-muted">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((row) => (
                <tr
                  key={row.uuid}
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-brand-50/40"
                >
                  <td className="px-3 py-2.5 font-medium text-ink">{memberName(row)}</td>
                  <td className="truncate px-3 py-2.5 text-ink-secondary">{row.email}</td>
                  <td className="px-3 py-2.5 text-ink-secondary">{row.major || "—"}</td>
                  <td className="px-3 py-2.5 text-ink-secondary">{row.expected_grad || "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-secondary">{row.points ?? 0}</td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={String(row.role_id)}
                      onValueChange={(value) => handleRoleChange(row, value)}
                      disabled={savingEmail === row.email}
                    >
                      <SelectTrigger className="max-w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {formatRoleLabel(role.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-red-50 hover:text-destructive"
                      disabled={savingEmail === row.email}
                      onClick={() => handleRemove(row)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
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
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of{" "}
              {totalCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || loading}
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
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
