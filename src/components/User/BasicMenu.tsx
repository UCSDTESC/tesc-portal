import { useContext, useRef, useState } from "react";
import { NavLink } from "react-router";
import { Building2, LogOut, PlusCircle, User as UserIcon } from "lucide-react";
import UserContext from "@lib/UserContext";
import { canManageOrgProfile } from "@lib/constants";
import { useOutsideClicks } from "@lib/hooks/useOutsideClick";
import { cn } from "@components/lib/utils";

/**
 * Avatar menu in the topbar. Same items and handlers as before, restyled:
 * Profile / Org Management / New Event (permission-gated) / Logout, or Log in.
 */
export default function BasicMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { User, handleSignOut, setShowLoginModal, activeOrgRole, myOrgs } =
    useContext(UserContext);
  const isLoggedIn = Boolean(User?.id);
  const inAnOrg = myOrgs.length > 0;

  useOutsideClicks([containerRef], () => setOpen(false));

  const initial = (User?.email?.[0] ?? "T").toUpperCase();

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => setShowLoginModal(true)}
        className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
      >
        Log in
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white transition-all",
          "hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          open && "ring-2 ring-brand-500 ring-offset-2",
        )}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-xl"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{User?.email}</p>
            <p className="mt-0.5 text-xs capitalize text-ink-muted">
              {User?.role || "member"}
            </p>
          </div>
          {User?.role !== "company" && (
            <>
              <NavLink
                to="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
              >
                <UserIcon className="h-4 w-4 text-brand-600" />
                Profile
              </NavLink>
              {inAnOrg && (
                <NavLink
                  to="/org-management"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
                >
                  <Building2 className="h-4 w-4 text-brand-600" />
                  Org Management
                </NavLink>
              )}
            </>
          )}
          {canManageOrgProfile(activeOrgRole) && (
            <NavLink
              to="/form"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
            >
              <PlusCircle className="h-4 w-4 text-brand-600" />
              New Event
            </NavLink>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              handleSignOut();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
