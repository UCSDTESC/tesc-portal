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
      parseInt(parsedDate[4])
    )
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
  end_date: string
) => {
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title.replace(
    " ",
    "+"
  )}&details=More+details+see:+${window.location.href}&location=${location}&dates=${formatDate(
    start_date
  )}/${formatDate(end_date)}&ctz=America/Los_Angeles`;
};
