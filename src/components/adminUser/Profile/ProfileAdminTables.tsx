import { useMemo, useState } from "react";
import { NavLink } from "react-router";
import DataTable from "../Data/DataTable";
import UserAdminPanel from "./UserAdminPanel";
import OrgMembersPanel from "./OrgMembersPanel";
import { Event } from "@lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import type { TablePaginationProps } from "@lib/constants";

type AdminTableView = "events" | "users" | "members";

type Props = {
  orgName?: string;
  orgId?: string;
  showUserAdmin: boolean;
  showOrgMembers: boolean;
  cols?: string[];
  onRowClick?: (daton: Event) => void;
  focusId?: string | null;
};

export default function ProfileAdminTables({
  orgName,
  orgId,
  showUserAdmin,
  showOrgMembers,
  cols,
  onRowClick,
  focusId,
}: Props) {
  const [view, setView] = useState<AdminTableView>("events");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo<TablePaginationProps>(
    () => ({
      pageSize,
      currentPage,
      onPageSizeChange: setPageSize,
      onCurrentPageChange: setCurrentPage,
    }),
    [pageSize, currentPage],
  );

  const hasViewSwitcher = showUserAdmin || showOrgMembers;

  const handleViewChange = (value: string) => {
    setView(value as AdminTableView);
    setCurrentPage(1);
  };

  const renderTable = () => {
    if (view === "users" && showUserAdmin) {
      return <UserAdminPanel pagination={pagination} embedded />;
    }
    if (view === "members" && showOrgMembers && orgId) {
      return <OrgMembersPanel orgId={Number(orgId)} pagination={pagination} embedded />;
    }
    return (
      <DataTable
        orgName={orgName}
        pagination={pagination}
        cols={cols}
        onRowClick={onRowClick}
        focusId={focusId}
        embedded
      />
    );
  };

  return (
    <div className="grid w-full gap-4 px-4 pb-4 pt-0">
      {!onRowClick && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {hasViewSwitcher ? (
              <Select value={view} onValueChange={handleViewChange}>
                <SelectTrigger className="w-[min(100%,240px)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">Posted Events</SelectItem>
                  {showOrgMembers && <SelectItem value="members">Org Members</SelectItem>}
                  {showUserAdmin && <SelectItem value="users">User Management</SelectItem>}
                </SelectContent>
              </Select>
            ) : (
              <h2 className="text-xl font-semibold">My Posted Events</h2>
            )}
          </div>
          {view === "events" && (
            <NavLink
              to="/form"
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              New Event
            </NavLink>
          )}
        </div>
      )}
      {renderTable()}
    </div>
  );
}
