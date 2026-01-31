import { formdata } from "./constants";

export const formatDate = (date: string) => {
  return date.replaceAll(":", "").replaceAll("-", "").split("+")[0];
};

export const getCurrentTime = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOString = new Date(Date.now() - tzoffset).toISOString().slice(0, -1);
  // convert to YYYY-MM-DDTHH:MM
  const currTime = localISOString.substring(0, ((localISOString.indexOf("T") | 0) + 6) | 0);
  return currTime;
};

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

export const DateParser = (date: string) => {
  const parsedDate = date.split(/-|T|:/);
  const correctDate = new Date(
    Date.UTC(
      parseInt(parsedDate[0]),
      parseInt(parsedDate[1]) - 1,
      parseInt(parsedDate[2]),
      parseInt(parsedDate[3]),
      parseInt(parsedDate[4]),
    ),
  );
  return correctDate.toUTCString();
};

export const toISO = (date: string) => {
  return date.substring(0, ((date.indexOf("T") | 0) + 6) | 0);
};
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

export function currentYear() {
  return new Date().getFullYear();
}

export function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
