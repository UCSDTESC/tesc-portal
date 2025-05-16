import { createContext, useContext, useEffect, useState } from "react";

import { fetchOrgs } from "@services/organization";
import { editRSVP, fetchRSVPAndAttended, logAttendance } from "@services/user";
import { queryEventsBySearchAndFilters } from "@services/event";
import UserContext, { User } from "@lib/UserContext";
import { Event } from "@lib/constants";
import useToast from "@lib/hooks/useToast";

// custom hook for bulletin component
export function useBulletin(User: User | null) {
  const { setShowLoginModal } = useContext(UserContext);
  const [data, setData] = useState<Event[]>();
  const [RSVP, setRSVP] = useState<number[]>([]);
  const [attendance, setAttendance] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [orgFilters, setOrgFilters] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<string>('');

  // fetch list of organizations
  useEffect(() => {
    const getOrgs = async () => {
      const { events, error } = await fetchOrgs();
      if (events) {
        setOrgs(events);
      } else if (error) {
        console.error(error.message);
        useToast('Error fetching organizations', 'error')
      }
    };
    getOrgs();
  }, []);

  // fetch events (with any searches and filters)
  useEffect(() => {
    const fetchEvents = async () => {
      const { events, error } = await queryEventsBySearchAndFilters(search, tagFilters, orgFilters, sortMethod);
      if (events) {
        setData(events as unknown as Event[]);
      } else {
        console.error(error?.message);
        useToast('Error fetching events', 'error')
      }
    };
    fetchEvents();
  }, [search, tagFilters, orgFilters, sortMethod]);

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
          useToast('Error fetching user history', 'error')
        }
      }
    };
    fetchRSVPAndAttendedEvents();
  }, [User]);

  const handleRSVP = async (id: number, remove: boolean) => {
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
        useToast(remove === true ? 'Unable to remove RSVP' : 'Unable to RSVP', 'error')
      } else {
        setRSVP(currRSVP);
        useToast(remove === true ? 'Succesfully removed RSVP' : 'Succesfully RSVP\'d', 'success')
      }
    }
  };

  const handleAttendance = async (selection: number) => {
    // if user is not logged in, show login modal
    if (!User?.id) {
      setShowLoginModal(true);
    } else {
      //log attendance
      const userInput = prompt("Please enter password:", "password");
      const filtered = data?.filter((daton) => daton.id === selection)[0];
      if (filtered && userInput){
        const error = await logAttendance(selection, User.id, userInput);
        if (error) {
          console.error(error.message);
          useToast("Error logging attendance", 'error')
        } else {
          setAttendance([...attendance, selection]);
          useToast('Succesfully logged attendance', 'success')
        }
      }
    }
  };

  return {
    data,
    tagFilters,
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
  tagFilters: string[];
  RSVP: number[];
  attendance: number[];
  handleAttendance: (selection: number) => void;
  handleRSVP: (selection: number, remove: boolean) => void;
  setTagFilters: (tags: string[]) => void;
  setSearch: (search: string) => void;
  orgFilters: string[];
  setOrgFilters: (orgs: string[]) => void;
  orgs: string[];
  sortMethod: string;
  setSortMethod: (sortMethod: string) => void
}

export const BulletinContext = createContext<BulletinContextProps>(
  {
  data: [],
  tagFilters: [],
  RSVP: [],
  attendance: [],
  handleAttendance: () => {},
  handleRSVP: () => {},
  setTagFilters: () => {},
  setSearch: () => {},
  orgFilters: [],
  setOrgFilters: () => {},
  orgs: [],
  sortMethod: '',
  setSortMethod: () => {}
} as BulletinContextProps);
