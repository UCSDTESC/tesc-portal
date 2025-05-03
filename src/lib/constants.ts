export const tags = ["fundraiser", "social", "workshop", "GBM", "panels/talks", "other"];

export type Event = {
  password: string | number;
  tags: string[];
  id: number;
  UID: string;
  created_at: string;
  title: string;
  content: string;
  location_str: string;
  location?: number[];
  start_date: string;
  end_date: string;
  attendance?: number;
  rsvp?: number;
  Users?: { uuid: string; email: string; pfp_str: string };
  org_emails?: { email: string; org_name: string };
};

export interface formdata {
  title: string;
  start_date: string;
  end_date: string;
  location: number[];
  location_str: string;
  content: string;
  password: string;
  tags: string[];
}

export const eventFormDataDefault = {
  title: "",
  password: "",
  start_date: "",
  end_date: "",
  location: [],
  location_str: "",
  content: "",
  tags: [""]
};
