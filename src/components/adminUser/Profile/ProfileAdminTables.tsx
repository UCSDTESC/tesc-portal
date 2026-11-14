import { useMemo, useState } from "react";
import { CalendarDays, Plus, ShieldCheck, Users } from "lucide-react";
import { NavLink } from "react-router";
import DataTable from "../Data/DataTable";
import UserAdminPanel from "./UserAdminPanel";
import OrgMembersPanel from "./OrgMembersPanel";
import { Event } from "@lib/constants";
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

const VIEW_TABS: { value: AdminTableView; label: string; icon: typeof CalendarDays }[] = [
  { value: "events", label: "Posted Events", icon: CalendarDays },
  { value: "members", label: "Org Members", icon: Users },
  { value: "users", label: "User Management", icon: ShieldCheck },
];

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

  const visibleTabs = VIEW_TABS.filter((tab) => {
    if (tab.value === "members") return showOrgMembers;
    if (tab.value === "users") return showUserAdmin;
    return true;
  });

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
    <div className="grid w-full gap-4">
      {!onRowClick && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {hasViewSwitcher ? (
              <div
                role="tablist"
                aria-label="Admin views"
                className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1"
              >
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = view === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleViewChange(tab.value)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-white text-navy-900 shadow-sm"
                          : "text-ink-secondary hover:text-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="text-xl font-semibold tracking-tight text-ink">My Posted Events</h2>
            )}
          </div>
          {view === "events" && (
            <NavLink
              to="/form"
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              <Plus className="h-4 w-4" />
              New Event
            </NavLink>
          )}
        </div>
      )}
      {renderTable()}
    </div>
  );
}
