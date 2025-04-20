export const tags = [
    "fundraiser",
    "social",
    "workshop",
    "GBM",
    "panels/talks",
    "other",
  ];

  export type Event = {
    tags: string[];
    id: number;
    UID: string;
    password: string;
    created_at: string;
    title: string;
    content: string;
    location: string;
    location_str: string;
    start_date: string;
    end_date: string;
    attendance: number;
    rsvp: number;
  }

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
    tags: [""],
}