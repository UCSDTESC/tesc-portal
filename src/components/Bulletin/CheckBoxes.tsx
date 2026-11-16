import { tags, canAccessRecruiterData } from "@lib/constants";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { useContext, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  Download,
  Filter,
  Search,
  Tags,
} from "lucide-react";
import { useOutsideClicks } from "@lib/hooks/useOutsideClick";
import UserContext from "@lib/UserContext";
import { majors } from "@lib/constants";
import { CSVLink } from "react-csv";
import { cn } from "@components/lib/utils";

type FilterMenuKey = "Category" | "Organization" | "Type" | "Sort" | "";

function FilterDropdown({
  label,
  icon,
  activeCount,
  open,
  onToggle,
  menuRef,
  panelClassName,
  children,
}: {
  label: string;
  icon: ReactNode;
  activeCount?: number;
  open: boolean;
  onToggle: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
  panelClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink-secondary shadow-sm transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
        {activeCount != null && activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "card-shadow absolute left-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-line bg-white p-2",
          panelClassName,
          open ? "block" : "hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function CheckBoxes() {
  const { setSearch, People, typeFilters, setTypeFilters, portalMode, tagFilters, orgFilters } =
    useContext(BulletinContext);
  const { User, activeOrgRole } = useContext(UserContext);
  const userRole = User?.role;
  const isRecruiterPortal = portalMode === "recruiter";
  const hasRecruiterAccess = isRecruiterPortal && canAccessRecruiterData(userRole);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const orgsRef = useRef<HTMLDivElement | null>(null);
  const typesRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [filterMenu, setFilterMenu] = useState<FilterMenuKey>("");
  useOutsideClicks([filterRef, orgsRef, typesRef, sortRef], () => setFilterMenu(""));
  const toggleMenu = (menu: Exclude<FilterMenuKey, "">) =>
    setFilterMenu(filterMenu === menu ? "" : menu);

  return (
    <form
      className="card-shadow flex flex-col gap-2 rounded-2xl border border-line bg-white p-2 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(e) => e.preventDefault()}
    >
      {!isRecruiterPortal || hasRecruiterAccess ? (
        <>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="Search"
              placeholder={hasRecruiterAccess ? "Search candidates..." : "Search events..."}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Category"
              icon={<Tags className="h-4 w-4" />}
              activeCount={tagFilters.length}
              open={filterMenu === "Category"}
              onToggle={() => toggleMenu("Category")}
              menuRef={filterRef}
              panelClassName="w-64 max-h-72 overflow-y-auto scrollbar-thin"
            >
              {hasRecruiterAccess ? <GradCheckboxes /> : <TagsCheckboxes />}
            </FilterDropdown>
            <FilterDropdown
              label={hasRecruiterAccess ? "Major" : "Organization"}
              icon={<Building2 className="h-4 w-4" />}
              activeCount={orgFilters.length}
              open={filterMenu === "Organization"}
              onToggle={() => toggleMenu("Organization")}
              menuRef={orgsRef}
              panelClassName="w-64 max-h-72 overflow-y-auto scrollbar-thin"
            >
              {hasRecruiterAccess ? <MajorsCheckboxes /> : <OrgsCheckboxes />}
            </FilterDropdown>
            {!hasRecruiterAccess && activeOrgRole != "" && (
              <FilterDropdown
                label="Type"
                icon={<Filter className="h-4 w-4" />}
                activeCount={typeFilters.length}
                open={filterMenu === "Type"}
                onToggle={() => toggleMenu("Type")}
                menuRef={typesRef}
                panelClassName="w-48"
              >
                <TypesCheckboxes typeFilters={typeFilters} setTypeFilters={setTypeFilters} />
              </FilterDropdown>
            )}
            <FilterDropdown
              label="Sort"
              icon={<ArrowUpDown className="h-4 w-4" />}
              open={filterMenu === "Sort"}
              onToggle={() => toggleMenu("Sort")}
              menuRef={sortRef}
              panelClassName="w-56"
            >
              <SortCheckboxes
                sortMethodsList={
                  hasRecruiterAccess
                    ? ["Events attended", "First Name (A-Z)", "Last Name (A-Z)"]
                    : ["Most Recent", "Event Name (A-Z)"]
                }
              />
            </FilterDropdown>
          </div>
        </>
      ) : null}
      {hasRecruiterAccess && (
        <CSVLink
          data={People ? People : []}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:ml-auto"
        >
          <Download className="h-4 w-4" />
          Export csv
        </CSVLink>
      )}
    </form>
  );
}

function TypesCheckboxes({
  typeFilters,
  setTypeFilters,
}: {
  typeFilters: string[];
  setTypeFilters: (types: string[]) => void;
}) {
  const types = ["internal", "external"];

  return (
    <>
      {types.map((type) => (
        <label
          key={type}
          htmlFor={`type-${type}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm capitalize text-ink hover:bg-surface"
        >
          <input
            type="checkbox"
            id={`type-${type}`}
            className="h-4 w-4 shrink-0 accent-brand-600"
            checked={typeFilters.includes(type)}
            onChange={(e) => {
              if (e.target.checked) {
                setTypeFilters([...typeFilters, type]);
              } else {
                setTypeFilters(typeFilters.filter((t) => t !== type));
              }
            }}
          />
          {type}
        </label>
      ))}
    </>
  );
}

function TagsCheckboxes() {
  const { setTagFilters, tagFilters } = useContext(BulletinContext);
  return (
    <>
      {tags.map((tag: string) => {
        return (
          <label
            key={tag}
            htmlFor={tag}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm capitalize text-ink hover:bg-surface"
          >
            <input
              type="checkbox"
              id={tag}
              className="h-4 w-4 shrink-0 accent-brand-600"
              onChange={(e) => {
                if (e.target.checked) {
                  setTagFilters([...tagFilters, tag]);
                } else {
                  setTagFilters(tagFilters.filter((t) => t !== tag));
                }
              }}
            />
            {tag}
          </label>
        );
      })}
    </>
  );
}

function GradCheckboxes() {
  const { setTagFilters, tagFilters, gradYears } = useContext(BulletinContext);
  return (
    <>
      {gradYears.map((tag: string) => {
        return (
          <label
            key={tag}
            htmlFor={tag}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-surface"
          >
            <input
              type="checkbox"
              id={tag}
              className="h-4 w-4 shrink-0 accent-brand-600"
              onChange={(e) => {
                if (e.target.checked) {
                  setTagFilters([...tagFilters, tag]);
                } else {
                  setTagFilters(tagFilters.filter((t) => t !== tag));
                }
              }}
            />
            {tag}
          </label>
        );
      })}
    </>
  );
}

function OrgsCheckboxes() {
  const { orgs, orgFilters, setOrgFilters } = useContext(BulletinContext);
  return (
    <>
      {orgs.map((org: string) => {
        return (
          <label
            key={org}
            htmlFor={org}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-surface"
          >
            <input
              type="checkbox"
              id={org}
              className="h-4 w-4 shrink-0 accent-brand-600"
              onChange={(e) => {
                if (e.target.checked) {
                  setOrgFilters([...orgFilters, org]);
                } else {
                  setOrgFilters(orgFilters.filter((t) => t !== org));
                }
              }}
            />
            <span className="truncate">{org}</span>
          </label>
        );
      })}
    </>
  );
}

function MajorsCheckboxes() {
  const { orgFilters, setOrgFilters } = useContext(BulletinContext);
  return (
    <>
      {majors.map((org: string) => {
        return (
          <label
            key={org}
            htmlFor={org}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-surface"
          >
            <input
              type="checkbox"
              id={org}
              className="h-4 w-4 shrink-0 accent-brand-600"
              onChange={(e) => {
                if (e.target.checked) {
                  setOrgFilters([...orgFilters, org]);
                } else {
                  setOrgFilters(orgFilters.filter((t) => t !== org));
                }
              }}
            />
            <span className="truncate">{org}</span>
          </label>
        );
      })}
    </>
  );
}

function SortCheckboxes({ sortMethodsList }: { sortMethodsList: string[] }) {
  const { setSortMethod } = useContext(BulletinContext);
  return (
    <>
      {sortMethodsList.map((method) => (
        <label
          key={method}
          htmlFor={method}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-surface"
        >
          <input
            type="radio"
            id={method}
            name="sortMethod"
            className="h-4 w-4 shrink-0 accent-brand-600"
            onChange={(e) => {
              if (e.target.checked) {
                setSortMethod(method);
              }
            }}
          />
          {method}
        </label>
      ))}
    </>
  );
}
