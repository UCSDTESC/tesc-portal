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
  attendance: number;
  rsvp: number;
  Users?: { uuid: string; email: string; pfp_str: string };
  org_emails?: { email: string; org_name: string };
  poster:string
  
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
  poster: string
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

export const locations : string[] =  [
  "Ballroom East (L2, Room 220)",
  "Ballroom West A (L2, Room 215)",
  "Ballroom West B (L2, Room 216)",
  "Ballroom West AB",
  "Price Center Theater (L1, Room 101)",
  "The Forum (L4, Room 404)",
  "Dance Studio (L2, Room 219)",
  "Governance Chambers (L4, Room 405)",
  "Senate Chambers (L4, Room 400)",
  "Warren College Room (L3, Room 302)",
  "Sixth College Room (L3, Room 310)",
  "Revelle College Room (L2, Room 214)",
  "Eleanor Roosevelt College Room (L2, Room 212)",
  "Marshall College Room (L2, Room 213)",
  "John Muir College Room (L2, Room 221)",
  "Port of Ensenada Room (L2, Room 223)",
  "Port of San Diego Room (L2, Room 224)",
  "Port of Long Beach Room (L2, Room 225)",
  "Comunidad Room (L2, Room 222)",
  "Green Table Room (L2, Room 206)",
  "Red Shoe Room (L2, Room 203)",
  "Bear Room (L2, Room 202)",
  "Study Rooms 1–8 (L1, Room 121)",
  "Work Station 1 – Private Office (L2, Room 201)",
  "Work Stations 2–5 (L2, Room 201)",
  "Nap Nook (L2, Room 201)",
  "The Loft (Level 2, Price Center East)",
  "Student Center",
  "Stage Room",
  "Dolores Huerta / Phillip Vera Cruz Meeting Room",
  "Thich Nhat Hanh Room",
  "Student Center Courtyard",
  "Student Services Center",
  "Multipurpose Room",
  "Conference Room 260",
  "Conference Room 300",
  "Conference Room 350",
  "Conference Room 400",
  "Conference Room 450",
  "Conference Room 554",
  "Conference Room 554A",
  "Town Square (adjacent outdoor/indoor flexible use)",
  "Jacobs School of Engineering",
  "Qualcomm Conference Center (Jacobs Hall)",
  "Franklin Antonio Hall (Atriums and conference rooms)",
  "ASML Conference Center",
  "Design Studio (Structural Engineering building)",
  "EnVision Maker Studio",
  "Qualcomm Institute (Atkinson Hall)",
  "Auditorium",
  "Breakout Rooms & Conference Rooms",
  "International House (ERC)",
  "Great Hall",
  "Asante Classrooms A/B",
  "Asante Lounge",
  "Sixth College",
  "Climate Action Lab (Public Engagement Building)",
  "RIMAC & Recreation Facilities",
  "LionTree Arena (RIMAC Arena)",
  "Auxiliary Gym",
  "RIMAC Annex (conference rooms, lounges)",
  "Main Gym",
  "Activity Rooms",
  "Performing Arts Spaces",
  "Mandell Weiss Theatre",
  "Mandell Weiss Forum",
  "Sheila and Hughes Potiker Theatre",
  "Theodore and Adele Shank Theatre",
  "Arthur Wagner Theatre (Galbraith Hall)",
  "Molli and Arthur Wagner Dance Building",
  "Mandeville Auditorium",
  "Conrad Prebys Concert Hall (Music Center)",
  "CPMC Recital Hall",
  "Studio Theatre (Theatre District)",
  "Library Walk",
  "Library Walk Lawn (East & West)",
  "Price Center Plaza",
  "Triton Landing",
  "Student Center Courtyard",
  "Town Square",
  "Matthews Quad",
  "Sun God Lawn",
  "Warren Mall",
  "The Hump",
  "RIMAC Field",
  "ERC Green",
  "NPHC Plaza (Student Center L2)",
  "Revelle Plaza",
  "Muir Quad",
  "Marshall Field",
  "Sixth College Lawn",
  "Scripps Seaside Forum Courtyard",
  "Ché Café",
  "Epstein Family Amphitheater",
  "The Loft",
  "Old Student Center Stages",
  "Visual Arts Presentation Lab (VAF 201)"
];
