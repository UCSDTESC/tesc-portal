import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@components/lib/utils"


// dropdown option in navbar where user that is part of multiple organizations
// can easily switch between orgs.
// ui component


export interface Organization {
  id?: string;
  name: string;
  pfp_str?: string;
}

interface OrgDropdownProps extends React.ComponentProps<"div"> {
  organizations: Organization[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
}

function OrgDropdown({
  organizations,
  value,
  onValueChange,
  placeholder = "Select organization...",
  className,
  ...props
}: OrgDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // get label for currently selected value
  const selectedLabel = React.useMemo(() => {
    return organizations.find((org) => org.name === value)?.name
  }, [organizations, value])

  // dropdown automatically close if user clicks outside of obj
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div
      ref={containerRef}
      data-slot="org-dropdown"
      className={cn("relative inline-block w-full", className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        data-slot="org-dropdown-trigger"
        className={cn(
          "bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          data-slot="org-dropdown-content"
          className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border shadow-md w-full"
        >
          <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
            {organizations.length === 0 ? (
              <div className="text-muted-foreground px-2 py-4 text-center text-xs">
                No organizations found.
              </div>
            ) : (
              organizations.map((org) => (
                <button
                  key={org.id || org.name}
                  type="button"
                  onClick={() => {
                    onValueChange?.(org.name)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors justify-between group",
                    value === org.name && "bg-accent/50 font-medium text-accent-foreground"
                  )}
                >
                  <span className="truncate">{org.name}</span>
                  {value === org.name && (
                    <Check className="size-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrgDropdownLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="org-dropdown-label"
      className={cn("text-sm font-medium leading-none mb-2 block", className)}
      {...props}
    />
  )
}

export { OrgDropdown, OrgDropdownLabel }