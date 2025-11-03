import { createContext, useContext, useEffect, useState } from "react";

import { fetchGradYears, fetchOrgs } from "@services/organization";
import { editRSVP, fetchRSVPAndAttended, logAttendance } from "@services/user";
import { queryEventsBySearchAndFilters, queryPeopleBySearchAndFilters } from "@services/event";
import UserContext, { User } from "@lib/UserContext";
import { Event, Member } from "@lib/constants";
import DisplayToast from "@lib/hooks/useToast";

// custom hook for bulletin component
export function useBulletin(User: User | null) {
  const { setShowLoginModal } = useContext(UserContext);
  const [data, setData] = useState<Event[]>();
  const [People, setPeople] = useState<Member[]>();
  const [RSVP, setRSVP] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [orgFilters, setOrgFilters] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<string>("");
  const [gradYears, setGradYears] = useState<string[]>([]);
  // fetch list of organizations
  useEffect(() => {
    const getGradYears = async () => {
      const { gradYears, error } = await fetchGradYears();
      if (gradYears) {
        setGradYears(gradYears);
      } else {
        console.error(error?.message);
        DisplayToast("Error Fetching Grad Years", "error");
      }
    };
    const getOrgs = async () => {
      const { events, error } = await fetchOrgs();
      if (events) {
        setOrgs(events);
      } else if (error) {
        console.error(error.message);
        DisplayToast("Error fetching organizations", "error");
      }
    };
    getOrgs();
    getGradYears();
  }, []);

  // fetch events (with any searches and filters)
  useEffect(() => {
    const fetchEvents = async () => {
      if (User?.role === "company") {
        const { People, error } = await queryPeopleBySearchAndFilters(
          search,
          tagFilters,
          orgFilters,
          sortMethod
        );
        if (People) {
          setPeople(People as unknown as Member[]);
        } else {
          console.error(error?.message);
        }
      } else {
        const { events, error } = await queryEventsBySearchAndFilters(
          search,
          tagFilters,
          orgFilters,
          sortMethod
        );
        if (events) {
          setData(events as unknown as Event[]);
        } else {
          console.error(error?.message);
          DisplayToast("Error fetching events", "error");
        }
      }
    };
    fetchEvents();
  }, [search, tagFilters, orgFilters, sortMethod, User]);

  // fetch RSVP and attended events
  useEffect(() => {
    const fetchRSVPAndAttendedEvents = async () => {
      if (User?.id) {
        const { rsvp, attended, error } = await fetchRSVPAndAttended(User.email);
        if (rsvp && attended) {
          setRSVP(rsvp);
          setAttendance(attended);
        } else if (error) {
          console.error(error.message);
          DisplayToast("Error fetching user history", "error");
        }
      }
    };
    fetchRSVPAndAttendedEvents();
  }, [User]);

  const handleRSVP = async (id: string, remove: boolean) => {
    // if user is not logged in, show login modal
    if (!User?.id) {
      setShowLoginModal(true);
    } else {
      // update rsvp array
      let currRSVP = RSVP;
      if (remove) {
        currRSVP = currRSVP.filter((item) => item !== id);
      } else {
        currRSVP = [...currRSVP, id];
      }
      // edit database rsvp array and count
      const error = await editRSVP(id, User.email, remove, currRSVP);
      if (error) {
        console.error(error.message);
        DisplayToast(remove === true ? "Unable to remove RSVP" : "Unable to RSVP", "error");
      } else {
        setRSVP(currRSVP);
        DisplayToast(
          remove === true ? "Succesfully removed RSVP" : "Succesfully RSVP'd",
          "success"
        );
      }
    }
  };

  const handleAttendance = async (selection: string) => {
    // if user is not logged in, show login modal

    if (!User?.id) {
      setShowLoginModal(true);
    } else {
      //log attendance
      const userInput = prompt("Please enter password:", "password");
      const filtered = data?.filter((daton) => daton.id === selection)[0];
      if (filtered && userInput) {
        const error = await logAttendance(selection, User.id, userInput);
        if (error) {
          console.error(error.message);
          DisplayToast("Error logging attendance", "error");
        } else {
          setAttendance([...attendance, selection]);
          DisplayToast("Succesfully logged attendance", "success");
        }
      }
    }
  };

  return {
    data,
    People,
    tagFilters,
    gradYears,
    RSVP,
    attendance,
    handleAttendance,
    handleRSVP,
    setTagFilters,
    setSearch,
    orgFilters,
    setOrgFilters,
    orgs,
    sortMethod,
    setSortMethod
  };
}

export interface BulletinContextProps {
  data: Event[] | undefined;
  People: Member[] | undefined;
  tagFilters: string[];
  gradYears: string[];
  RSVP: string[];
  attendance: string[];
  handleAttendance: (selection: string) => void;
  handleRSVP: (selection: string, remove: boolean) => void;
  setTagFilters: (tags: string[]) => void;
  setSearch: (search: string) => void;
  orgFilters: string[];
  setOrgFilters: (orgs: string[]) => void;
  orgs: string[];
  sortMethod: string;
  setSortMethod: (sortMethod: string) => void;
}

export const BulletinContext = createContext<BulletinContextProps>({
  data: [],
  People: [],
  tagFilters: [],
  gradYears: [],
  RSVP: [],
  attendance: [],
  handleAttendance: () => {},
  handleRSVP: () => {},
  setTagFilters: () => {},
  setSearch: () => {},
  orgFilters: [],
  setOrgFilters: () => {},
  orgs: [],
  sortMethod: "",
  setSortMethod: () => {}
} as BulletinContextProps);
