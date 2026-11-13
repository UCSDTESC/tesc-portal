import { useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { createPortal } from "react-dom";
import {
  Building2,
  CalendarCheck,
  Compass,
  History,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Twitter,
  User as UserIcon,
  X,
} from "lucide-react";
import { cn } from "@components/lib/utils";
import UserContext from "@lib/UserContext";
import { canManageOrgProfile } from "@lib/constants";
import supabase from "@server/supabase";
import { FaDiamond } from "react-icons/fa6";
import TESC from "/TESC.png";
import LoginModal from "../../pageRoot/LoginModal";
import BasicMenu from "@components/User/BasicMenu";
import { OrgDropdown } from "@components/components/ui/org-dropdown";

const SIDEBAR_COLLAPSED_KEY = "tesc-sidebar-collapsed";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Compass;
  match: (pathname: string) => boolean;
  show: boolean;
};

function pageTitleFor(pathname: string): string {
  if (pathname.startsWith("/bulletin")) return "Discover";
  if (pathname.startsWith("/my-events")) return "My Events";
  if (pathname.startsWith("/profile/attendance-history")) return "Attendance History";
  if (pathname.startsWith("/profile")) return "My Profile";
  if (pathname.startsWith("/org-management") || pathname.startsWith("/organization"))
    return "Organizations";
  if (pathname.startsWith("/form")) return "New Event";
  return "TESC Portal";
}

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { User, myOrgs, activeOrgRole } = useContext(UserContext);
  const isLoggedIn = Boolean(User?.id);
  const isCompany = User?.role === "company";
  const inAnOrg = myOrgs.length > 0;

  const items: NavItem[] = useMemo(
    () => [
      {
        to: "/bulletin/-1",
        label: "Discover",
        icon: Compass,
        match: (p) => p.startsWith("/bulletin"),
        show: true,
      },
      {
        to: "/my-events",
        label: "My Events",
        icon: CalendarCheck,
        match: (p) => p.startsWith("/my-events"),
        show: isLoggedIn && !isCompany,
      },
      {
        to: "/profile/attendance-history",
        label: "Attendance History",
        icon: History,
        match: (p) => p.startsWith("/profile/attendance-history"),
        show: isLoggedIn && !isCompany,
      },
      {
        to: "/profile",
        label: "Profile",
        icon: UserIcon,
        match: (p) => p === "/profile",
        show: isLoggedIn && !isCompany,
      },
      {
        to: "/org-management",
        label: "Organizations",
        icon: Building2,
        match: (p) => p.startsWith("/org-management") || p.startsWith("/organization"),
        show: isLoggedIn && inAnOrg,
      },
      {
        to: "/form",
        label: "New Event",
        icon: PlusCircle,
        match: (p) => p.startsWith("/form"),
        show: isLoggedIn && canManageOrgProfile(activeOrgRole),
      },
    ],
    [isLoggedIn, isCompany, inAnOrg, activeOrgRole],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <NavLink to="/" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          {collapsed ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-lg font-bold text-white">
              T
            </span>
          ) : (
            <>
              {/* The TESC logo is white artwork (built for the old navy navbar),
                  so it sits on a navy tile for contrast on the white sidebar. */}
              <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 px-1.5">
                <img src={TESC} alt="TESC" className="h-auto w-full" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[15px] font-bold tracking-tight text-navy-900">
                  TESC Portal
                </span>
                <span className="block truncate text-[11px] font-medium text-ink-muted">
                  Triton Engineering
                </span>
              </span>
            </>
          )}
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {!collapsed && (
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Menu
          </p>
        )}
        <ul className="space-y-1">
          {items
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive || item.match(window.location.pathname)
                          ? "bg-brand-50 text-navy-900"
                          : "text-ink-secondary hover:bg-surface hover:text-ink",
                        collapsed && "justify-center px-0",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {(isActive || item.match(window.location.pathname)) && (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />
                        )}
                        <Icon className="h-[18px] w-[18px] shrink-0 text-brand-600" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Sidebar footer */}
      <div className="shrink-0 border-t border-line p-3">
        {!collapsed ? (
          <div>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Connect
            </p>
            <div className="mt-2 flex items-center gap-1 px-1">
              <a
                href="mailto:contact@tesc.ucsd.edu"
                aria-label="Email TESC"
                className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface hover:text-navy-900"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/tesc.at.ucsd"
                target="_blank"
                rel="noreferrer"
                aria-label="TESC on Instagram"
                className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface hover:text-navy-900"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/ucsdtesc"
                target="_blank"
                rel="noreferrer"
                aria-label="TESC on LinkedIn"
                className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface hover:text-navy-900"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/UCSDTESC/"
                target="_blank"
                rel="noreferrer"
                aria-label="TESC on X"
                className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface hover:text-navy-900"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://tescucsd.org/discord"
                target="_blank"
                rel="noreferrer"
                aria-label="TESC Discord"
                className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface hover:text-navy-900"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfVzJQ8li2d8is_hpj3btZbfrYGp1FZR00_OojU5uG5YZ4yuA/viewform?usp=dialog"
              target="_blank"
              rel="noreferrer"
              className="mt-1 block px-2 text-xs text-ink-muted underline-offset-2 hover:text-navy-900 hover:underline"
            >
              Give feedback
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            <a
              href="mailto:contact@tesc.ucsd.edu"
              aria-label="Email TESC"
              className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-surface hover:text-navy-900"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children?: ReactNode }) {
  const {
    User,
    myOrgs,
    activeOrgName,
    handleOrgSwitch,
    showLoginModal,
    setShowLoginModal,
    setLoginRecruiterMode,
    pendingProfileSetup,
    setPendingProfileSetup,
  } = useContext(UserContext);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const isLoggedIn = Boolean(User?.id);
  const isCompany = User?.role === "company";

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // storage unavailable — collapse state just won't persist
    }
  }, [collapsed]);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Points chip — same source as the old bulletin header (users.points by email).
  useEffect(() => {
    const loadPoints = async () => {
      if (!User?.id || !User?.email || isCompany) {
        setUserPoints(null);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("points")
        .eq("email", User.email);
      if (!error && data?.[0]) setUserPoints(data[0].points ?? 0);
    };
    loadPoints();
  }, [User?.id, User?.email, isCompany]);

  const title = pageTitleFor(location.pathname);

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-white transition-all duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white text-ink-secondary shadow-sm transition-colors hover:text-navy-900"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-ink-secondary hover:bg-surface hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className={cn("flex min-h-screen flex-col transition-all duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink-secondary hover:bg-surface hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-navy-900">
            {title}
          </h1>

          {isLoggedIn && myOrgs.length > 0 && (
            <div className="hidden w-48 sm:block md:w-56">
              <OrgDropdown
                organizations={myOrgs}
                value={activeOrgName}
                onValueChange={handleOrgSwitch}
                placeholder="Select Club"
              />
            </div>
          )}

          {isLoggedIn && !isCompany && userPoints !== null && (
            <span
              className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-navy-900 sm:flex"
              title="TESC participation points"
            >
              <FaDiamond className="text-sm text-brand-500" />
              {userPoints}
            </span>
          )}

          {isLoggedIn ? (
            <BasicMenu />
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginRecruiterMode(false);
                setShowLoginModal(true);
              }}
              className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              Log in
            </button>
          )}
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {showLoginModal &&
        createPortal(
          <LoginModal
            initialProfileSetup={pendingProfileSetup}
            onclose={() => {
              setShowLoginModal(false);
              setLoginRecruiterMode(false);
              setPendingProfileSetup(false);
            }}
          />,
          document.body,
        )}
    </div>
  );
}
