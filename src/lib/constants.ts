/** Event category tags for filtering/display. Used in: DataTable, Form, event services, Bulletin. */
export const tags = ["fundraiser", "social", "workshop", "GBM", "panels/talks", "other"];

/** Default org profile picture (base64). Used in: org/profile display. */
export const profile_picture_src =
  "data:image/jpeg;base64,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";
/** Event record from DB. Used in: DataTable, TableRow, useEditModal, Bulletin, event services. */
export type Event = {
  password: string;
  tags: string[];
  id: string;
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
  orgs: {
    name: string;
    pfp_str: string;
  };
  poster: string;
  attendance_cap?: number;
  track_attendance?: boolean;
  manual_attendance?: number | null;
  internal?: boolean;
};

/** Member record. Used in: Bulletin (people tab). */
export type Member = {
  uuid: string;
  email: string;
  created_at: string;
  points: number;
  resume_link: string;
  expected_grad: number;
  major: string;
  first_name: string;
  last_name: string;
};

/** Form payload for create/edit event. Used in: Form, useEditModal, event services. */
export type formdata = {
  title: string;
  start_date: string;
  end_date: string;
  location: number[];
  location_str: string;
  content: string;
  password: string;
  tags: string[];
  poster: string;
  attendance_cap?: number;
  track_attendance?: boolean;
  manual_attendance?: string | number;
  internal?: boolean;
  recurring_rate?: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  recurrence_end_date?: string;
};

/** Recurrence options for event form. Used in: Form. */
export const RECURRING_RATES = ["none", "daily", "weekly", "biweekly", "monthly"] as const;

/** Default empty form values. Used in: useEditModal, Form reset. */
export const eventFormDataDefault: formdata = {
  title: "",
  password: "",
  start_date: "",
  end_date: "",
  location: [],
  location_str: "",
  content: "",
  tags: [""],
  poster: "",
  track_attendance: false,
  manual_attendance: "",
  internal: false,
  recurring_rate: "none",
  recurrence_end_date: "",
};

/** Venue options for event location. Used in: Form, DataTable filter. */
export const locations: string[] = [
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
  "Powell-Focht Bioengineering Hall",
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
  "Visual Arts Presentation Lab (VAF 201)",
];
/** Major options for member profile. Used in: member forms, Bulletin. */
export const majors: string[] = [
  "Anthropology",
  "Archaeology",
  "Artificial Intelligence",
  "Biological Anthropology",
  "Climate Change and Human Solutions",
  "Sociocultural Anthropology",
  "Bioengineering",
  "Bioengineering: Biotechnology",
  "Bioengineering: Bioinformatics",
  "Bioengineering: BioSystems",
  "General Biology",
  "Biology with a Specialization in Bioinformatics",
  "Ecology Behavior and Evolution",
  "Human Biology",
  "Microbiology",
  "Molecular and Cell Biology",
  "Neurobiology",
  "Chemistry",
  "Chemistry with Specialization in Earth Sciences",
  "Biochemistry",
  "Environmental Chemistry",
  "Molecular Synthesis",
  "Pharmacological Chemistry",
  "Bioinformatics",
  "Cognitive Science",
  "Cognitive Science—Clinical Aspects of Cognition",
  "Cognitive Science—Design and Interaction",
  "Cognitive Science—Machine Learning and Neural Computation",
  "Cognitive Science—Neuroscience",
  "Cognitive Science—Language and Culture",
  "Communication",
  "Computer Science",
  "Computer Engineering",
  "Computer Science with Specialization in Bioinformatics",
  "Business Economics",
  "Economics",
  "Economics–Public Policy",
  "Joint Economics–Mathematics",
  "Education Sciences",
  "Computer Engineering (ECE)",
  "Electrical Engineering",
  "Electrical Engineering and Society",
  "Engineering Physics",
  "Ethnic Studies",
  "Data Science",
  "History",
  "Linguistics (Cognition and Language)",
  "Linguistics (Language and Society)",
  "Linguistics (Speech and Language Sciences)",
  "Language Studies",
  "Linguistics",
  "Literatures in English",
  "Literatures in Spanish",
  "Literature/Writing",
  "World Literature and Culture",
  "Mathematics",
  "Mathematics (Applied)",
  "Mathematics–Computer Science",
  "Mathematics–Applied Science",
  "Joint Mathematics–Economics",
  "Mathematics–Secondary Education",
  "Probability and Statistics",
  "Aerospace Engineering",
  "Mechanical Engineering",
  "Mechanical Engineering—Controls and Robotics",
  "Mechanical Engineering—Fluid Mechanics and Thermal Systems",
  "Mechanical Engineering—Materials Science and Engineering",
  "Mechanical Engineering—Mechanics of Materials",
  "Mechanical Engineering—Renewable Energy and Environmental Flows",
  "Interdisciplinary Computing and the Arts",
  "Music",
  "Music/Humanities",
  "Chemical Engineering",
  "Nanoengineering",
  "Philosophy",
  "General Physics",
  "General Physics/Secondary Education",
  "Physics",
  "Physics/Biophysics",
  "Physics—Computational Physics",
  "Physics—Earth Sciences",
  "Physics—Materials Physics",
  "Physics—Astrophysics",
  "Political Science",
  "Political Science—American Politics",
  "Political Science—Comparative Politics",
  "Political Science—International Relations",
  "Political Science—International Affairs",
  "Political Science—Political Theory",
  "Political Science—Public Law",
  "Political Science—Public Policy",
  "Political Science—Race Ethnicity and Politics",
  "Business Psychology",
  "Cognitive and Behavioral Neuroscience",
  "Psychology",
  "Psychology—Clinical Psychology",
  "Psychology—Cognitive Psychology",
  "Psychology—Developmental Psychology",
  "Psychology—Human Health",
  "Psychology—Sensation and Perception",
  "Psychology—Social Psychology",
  "Public Health",
  "Public Health—Biostatistics",
  "Public Health—Climate and Environmental Sciences",
  "Public Health—Community Health Sciences",
  "Public Health—Epidemiology",
  "Public Health—Health Policy and Management Sciences",
  "Public Health—Medicine Sciences",
  "Geosciences",
  "Marine Biology",
  "Oceanic and Atmospheric Sciences",
  "Sociology",
  "Sociology—International Studies",
  "Sociology—American Studies",
  "Sociology—Science and Medicine",
  "Sociology—Economy and Society",
  "Sociology—Culture and Communication",
  "Sociology—Social Inequity",
  "Sociology—Law and Society",
  "Structural Engineering",
];

/** Framer stagger container animation. Used in: Bulletin/animations. */
export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};
/** Framer stagger for login. Used in: login page animations. */
export const container_login = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

/** Framer stagger child item. Used in: Bulletin/animations. */
export const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

/* ------------------------ DataTable ------------------------ */

/** Pagination size options (rows per page). Used in: DataTable. */
export const DATA_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

/** Column keys hidden by default. Used in: DataTable, getInitialHiddenColumnKeys. */
export const DATA_TABLE_DEFAULT_HIDDEN_COLUMNS = [
  "created_at",
  "attendance_cap",
  "track_attendance",
  "actions",
] as const;

/** localStorage key for persisted hidden columns. Used in: DataTable, getInitialHiddenColumnKeys. */
export const DATA_TABLE_COLUMNS_STORAGE_KEY = "dataTable-hiddenColumns";

/** Numeric filter operators for DataTable. Used in: DataTable FilterPopup. */
export const DATA_TABLE_NUMERIC_OPS = [
  { value: "eq", label: "=" },
  { value: "gt", label: ">" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "<" },
  { value: "lte", label: "≤" },
] as const;

/** Filter type for each column. Used in: DataTable COLUMNS, matchesColumnFilter. */
export type DataTableFilterType =
  | "text"
  | "textPopup"
  | "date"
  | "location"
  | "numeric"
  | "tags"
  | "yesno";

/** Date range filter value. Used in: DataTable FilterPopup, matchesColumnFilter. */
export type DataTableDateFilter = { from?: string; to?: string };

/** Numeric filter value (op + value). Used in: DataTable FilterPopup, matchesColumnFilter. */
export type DataTableNumericFilter = {
  op: "eq" | "gt" | "gte" | "lt" | "lte";
  value: string;
};

/** Union of all column filter value types. Used in: DataTable columnFilters state, matchesColumnFilter. */
export type DataTableColumnFilter =
  | string
  | DataTableDateFilter
  | string[]
  | DataTableNumericFilter;

/** Column definitions for DataTable. Used in: DataTable, TableRow, utils. */
export const DATA_TABLE_COLUMNS = [
  {
    key: "title",
    label: "Title",
    width: "14%",
    widthPx: 120,
    filterType: "textPopup" as DataTableFilterType,
  },
  {
    key: "created_at",
    label: "Created",
    width: "10%",
    widthPx: 90,
    filterType: "date" as DataTableFilterType,
  },
  {
    key: "start_date",
    label: "Start",
    width: "9%",
    widthPx: 90,
    filterType: "date" as DataTableFilterType,
  },
  {
    key: "end_date",
    label: "End",
    width: "9%",
    widthPx: 90,
    filterType: "date" as DataTableFilterType,
  },
  {
    key: "location_str",
    label: "Location",
    width: "12%",
    widthPx: 100,
    filterType: "location" as DataTableFilterType,
  },
  {
    key: "rsvp",
    label: "RSVP",
    width: "8%",
    widthPx: 100,
    filterType: "numeric" as DataTableFilterType,
  },
  {
    key: "attendance_cap",
    label: "Max RSVP",
    width: "11%",
    widthPx: 70,
    filterType: "numeric" as DataTableFilterType,
  },
  {
    key: "attendance",
    label: "Attendance",
    width: "12%",
    widthPx: 75,
    filterType: "numeric" as DataTableFilterType,
  },
  {
    key: "track_attendance",
    label: "Track attendance?",
    width: "16%",
    widthPx: 95,
    filterType: "yesno" as DataTableFilterType,
  },
  {
    key: "tags",
    label: "Tags",
    width: "9%",
    widthPx: 80,
    filterType: "tags" as DataTableFilterType,
  },
  { key: "actions", label: "Actions", width: "6%", widthPx: 75 },
] as const;
