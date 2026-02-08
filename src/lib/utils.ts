import {
  DATA_TABLE_COLUMNS,
  DATA_TABLE_DEFAULT_HIDDEN_COLUMNS,
  DATA_TABLE_COLUMNS_STORAGE_KEY,
  formdata,
} from "./constants";
import type {
  DataTableColumnFilter,
  DataTableDateFilter,
  DataTableFilterType,
  DataTableNumericFilter,
} from "./constants";
import type { Event } from "./constants";

/** Normalizes date string for Google Calendar. Used in: formatGoogleCalendarEvent. */
export const formatDate = (date: string) => {
  return date.replaceAll(":", "").replaceAll("-", "").split("+")[0];
};

/** Current local time as YYYY-MM-DDTHH:MM. Used in: getFormDataDefault. */
export const getCurrentTime = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOString = new Date(Date.now() - tzoffset).toISOString().slice(0, -1);
  // convert to YYYY-MM-DDTHH:MM
  const currTime = localISOString.substring(0, ((localISOString.indexOf("T") | 0) + 6) | 0);
  return currTime;
};

/** Default form values with current time. Used in: Form init. */
export const getFormDataDefault = (): formdata => {
  const currTime = getCurrentTime();
  return {
    title: "",
    password: "",
    start_date: currTime,
    end_date: currTime,
    location: [0, 0],
    location_str: "",
    content: "",
    tags: [],
    poster: "https://placehold.co/600x400",
    track_attendance: false,
    manual_attendance: "",
    internal: false,
    recurring_rate: "none",
    recurrence_end_date: "",
  };
};

/** Short month names for DateParser. */
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parses and displays date/time as stored (no timezone conversion). Expects YYYY-MM-DDTHH:mm or similar. Used in: DataTable getCellValue, event display. */
export const DateParser = (date: string) => {
  if (!date || date === "N/A") return date;
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return date;
  const [, year, month, day, hour, min, sec] = match;
  const monthNum = parseInt(month, 10) - 1;
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 || 12;
  const timeStr = sec
    ? `${hour12}:${min}:${sec} ${ampm}`
    : `${hour12}:${min} ${ampm}`;
  return `${MONTH_NAMES[monthNum]} ${parseInt(day, 10)}, ${year}, ${timeStr}`;
};

/** Truncates date to YYYY-MM-DDTHH:MM. Used in: form date inputs. */
export const toISO = (date: string) => {
  return date.substring(0, ((date.indexOf("T") | 0) + 6) | 0);
};
/** Builds Google Maps directions URL. Used in: event details/location links. */
export const formatGoogleMapsLocation = (location: string) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${location
    .replace(" ", "+")
    .replace(",", "%2C")}&travelmode=walking`;
};

export const formatGoogleCalendarEvent = (
  title: string,
  location: string,
  start_date: string,
  end_date: string,
) => {
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title.replace(
    " ",
    "+",
  )}&details=More+details+see:+${window.location.href}&location=${location}&dates=${formatDate(
    start_date,
  )}/${formatDate(end_date)}&ctz=America/Los_Angeles`;
};

/** Resolves PDF preview URL (supports Drive, Dropbox, OneDrive). Used in: poster preview. */
export function getPdfPreviewUrl(url: string): { previewUrl: string | null; note?: string } {
  if (!url) return { previewUrl: null };
  try {
    const u = new URL(url);
    const href = u.href;

    if (/\.pdf($|\?|#)/i.test(href)) {
      return { previewUrl: href };
    }

    if (u.hostname.includes("drive.google.com")) {
      const fileIdMatch = href.match(/\/d\/([^/]+)/) || href.match(/[?&]id=([^&]+)/);
      const fileId = fileIdMatch?.[1];
      if (fileId) {
        return { previewUrl: `https://drive.google.com/file/d/${fileId}/preview` };
      }
      return {
        previewUrl: `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
          href,
        )}`,
      };
    }

    if (u.hostname.includes("dropbox.com")) {
      const raw = href.replace(/\?dl=0$/, "?raw=1");
      return { previewUrl: raw };
    }

    if (u.hostname.includes("onedrive.live.com")) {
      return { previewUrl: href.replace("redir?", "embed?") };
    }

    return { previewUrl: null };
  } catch {
    return { previewUrl: null };
  }
}

/** Current year. Used in: footer, forms. */
export function currentYear() {
  return new Date().getFullYear();
}

/** Checks if string is valid http(s) URL. Used in: form validation. */
/** Checks if string is valid http(s) URL. Used in: form validation. */
export function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/* ------------------------ DataTable ------------------------ */

/** Loads hidden column keys from localStorage, or returns default. Used in: DataTable useState init. */
export function getInitialHiddenColumnKeys(): Set<string> {
  if (typeof window === "undefined") {
    return new Set(DATA_TABLE_DEFAULT_HIDDEN_COLUMNS);
  }
  try {
    const stored = window.localStorage.getItem(DATA_TABLE_COLUMNS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const validKeys = new Set<string>(DATA_TABLE_COLUMNS.map((c) => c.key));
      return new Set(parsed.filter((k) => validKeys.has(k)));
    }
  } catch {
    // ignore parse errors
  }
  return new Set(DATA_TABLE_DEFAULT_HIDDEN_COLUMNS);
}

/** Returns display string for an Event cell by column key. Used in: DataTable, TableRow. */
export function getDataTableCellValue(daton: Event, key: string): string {
  switch (key) {
    case "title":
      return daton.title ?? "";
    case "password":
      return daton.password ?? "";
    case "created_at":
      return DateParser(daton.created_at ?? "");
    case "start_date":
      return daton.start_date ? DateParser(daton.start_date) : "";
    case "end_date":
      return daton.end_date ? DateParser(daton.end_date) : "";
    case "location_str":
      return daton.location_str ?? "";
    case "rsvp":
      return String(daton.rsvp ?? "");
    case "attendance_cap":
      return daton.attendance_cap != null ? String(daton.attendance_cap) : "";
    case "attendance":
      return String(daton.attendance ?? "");
    case "track_attendance":
      return daton.track_attendance ? "Yes" : "No";
    case "tags":
      return Array.isArray(daton.tags) ? daton.tags.join(", ") : "";
    case "actions":
      return "";
    default:
      return "";
  }
}

/** Checks if Event matches search query (title, location, tags). Used in: DataTable filteredData. */
export function matchesDataTableSearch(daton: Event, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const title = (daton.title ?? "").toLowerCase();
  const location = (daton.location_str ?? "").toLowerCase();
  const tagsStr = (Array.isArray(daton.tags) ? daton.tags.join(" ") : "").toLowerCase();
  return title.includes(q) || location.includes(q) || tagsStr.includes(q);
}

/** Checks if Event passes column filter. Used in: DataTable filteredData. */
export function matchesDataTableColumnFilter(
  daton: Event,
  key: string,
  filterType: DataTableFilterType | undefined,
  filterValue: DataTableColumnFilter | undefined,
  getCellValue: (d: Event, k: string) => string
): boolean {
  if (filterValue == null || filterValue === "") return true;
  if (Array.isArray(filterValue) && filterValue.length === 0) return true;
  if (typeof filterValue === "object" && !Array.isArray(filterValue)) {
    const df = filterValue as DataTableDateFilter;
    const nf = filterValue as DataTableNumericFilter;
    if (filterType === "date" && !df.from && !df.to) return true;
    if (filterType === "numeric" && (!nf.value || nf.value.trim() === "")) return true;
    if (filterType !== "date" && filterType !== "numeric" && Object.keys(filterValue).length === 0)
      return true;
  }

  if (filterType === "date" && typeof filterValue === "object" && !Array.isArray(filterValue)) {
    const { from, to } = filterValue as DataTableDateFilter;
    const val = daton[key as keyof Event] as string;
    if (!val) return true;
    const date = new Date(val).getTime();
    if (from && date < new Date(from).getTime()) return false;
    if (to && date > new Date(to + "T23:59:59").getTime()) return false;
    return true;
  }

  if (filterType === "location" && Array.isArray(filterValue)) {
    const loc = (daton.location_str ?? "").trim();
    if (filterValue.length === 0) return true;
    return filterValue.includes(loc);
  }

  if (filterType === "tags" && Array.isArray(filterValue)) {
    const eventTags = Array.isArray(daton.tags) ? daton.tags : [];
    if (filterValue.length === 0) return true;
    return filterValue.some((t) => eventTags.includes(t));
  }

  if (filterType === "numeric" && typeof filterValue === "object" && !Array.isArray(filterValue)) {
    const { op, value } = filterValue as DataTableNumericFilter;
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return true;
    const colVal =
      key === "rsvp"
        ? (daton.rsvp ?? 0)
        : key === "attendance"
          ? (daton.attendance ?? 0)
          : (daton.attendance_cap ?? 0);
    switch (op) {
      case "eq":
        return colVal === num;
      case "gt":
        return colVal > num;
      case "gte":
        return colVal >= num;
      case "lt":
        return colVal < num;
      case "lte":
        return colVal <= num;
      default:
        return true;
    }
  }

  if ((filterType === "text" || filterType === "textPopup") && typeof filterValue === "string") {
    const cell = getCellValue(daton, key).toLowerCase();
    const q = filterValue.trim().toLowerCase();
    return q === "" || cell.includes(q);
  }

  if (filterType === "yesno" && typeof filterValue === "string") {
    const val = filterValue.trim();
    if (val === "") return true;
    const eventVal = daton.track_attendance ? "Yes" : "No";
    return eventVal === val;
  }

  return true;
}

/** Returns sortable value for Event by column key. Used in: DataTable sortedData. */
export function getDataTableSortValue(daton: Event, key: string): string | number | boolean {
  switch (key) {
    case "rsvp":
      return daton.rsvp ?? 0;
    case "attendance":
      return daton.attendance ?? 0;
    case "attendance_cap":
      return daton.attendance_cap ?? 0;
    case "track_attendance":
      return daton.track_attendance ? 1 : 0;
    case "created_at":
    case "start_date":
    case "end_date":
      return new Date((daton[key as keyof Event] as string) || 0).getTime();
    default:
      return getDataTableCellValue(daton, key).toLowerCase();
  }
}
