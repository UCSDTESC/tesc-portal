import { useCallback, useEffect, useMemo, useState } from "react";
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
      <div className="rounded-lg border p-4 flex flex-col gap-3 bg-slate-50/50">
        <h3 className="font-medium">Assign role by email</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
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
          <Button type="button" className="bg-navy" disabled={assigning} onClick={handleAssign}>
            Assign
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search org members"
          className="max-w-sm"
        />
      </div>

      <div
        className={`border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm transition-opacity ${
          loading && members.length > 0 ? "opacity-60" : ""
        }`}
      >
        <div className={isLgOrSmaller ? "overflow-x-auto" : ""}>
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
              <tr className="bg-[#114675] border-b border-[#114675]/80">
                {ORG_MEMBER_TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="text-left font-semibold text-white px-2 py-2 border-r border-white/20 last:border-r-0"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={ORG_MEMBER_TABLE_COLUMNS.length} className="px-3 py-6 text-center text-slate-500">
                    Loading members…
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={ORG_MEMBER_TABLE_COLUMNS.length} className="px-3 py-6 text-center text-slate-500">
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((row) => (
                  <tr key={row.uuid} className="border-b border-slate-200 hover:bg-slate-50/80">
                    <td className="px-3 py-2 border-r border-slate-200">{memberName(row)}</td>
                    <td className="px-3 py-2 border-r border-slate-200 truncate">{row.email}</td>
                    <td className="px-3 py-2 border-r border-slate-200">{row.major || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-200">{row.expected_grad || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-200">{row.points ?? 0}</td>
                    <td className="px-3 py-2 border-r border-slate-200">
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
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
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
      </div>

      {totalCount > 0 && (
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
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of{" "}
              {totalCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
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
