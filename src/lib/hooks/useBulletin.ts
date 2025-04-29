import { createContext, useContext, useEffect, useState } from "react";

import { fetchOrgs } from "@services/organization";
import { editRSVP, fetchRSVPAndAttended } from "@services/user";
import supabase from "@server/supabase";
import { queryEventsBySearchAndFilters } from "@services/event";
import UserContext, { User } from "@lib/UserContext";
import { Event } from "@lib/constants";

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

  // fetch list of organizations
  useEffect(() => {
    const getOrgs = async () => {
      const { events, error } = await fetchOrgs();
      if (events) {
        setOrgs(events);
      } else if (error) {
        console.log(error);
      }
    };
    getOrgs();
  }, []);

  // fetch events (with any searches and filters)
  useEffect(() => {
    const fetchEvents = async () => {
      const { events, error } = await queryEventsBySearchAndFilters(search, tagFilters, orgFilters);
      if (events) {
        setData(events as unknown as Event[]);
      } else {
        console.log(error);
      }
    };
    fetchEvents();
  }, [search, tagFilters, orgFilters]);

  // fetch RSVP and attended events
  useEffect(() => {
    const fetchRSVPAndAttendedEvents = async () => {
      if (User?.id) {
        const { rsvp, attended, error } = await fetchRSVPAndAttended(User.email);
        if (rsvp && attended) {
          setRSVP(rsvp);
          setAttendance(attended);
        } else if (error) {
          console.log(error);
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
        console.log(error);
      } else {
        setRSVP(currRSVP);
      }
    }
  };

  const handleAttendance = async (remove: boolean, selection: number) => {
    // if user is not logged in, show login modal
    if (!User?.id) {
      setShowLoginModal(true);
    } else {
      if (remove) {
        const { data, error } = await supabase
          .from("Users")
          .select("points, attended")
          .eq("email", User?.email);
        if (data) {
          console.log(data);
          const { error } = await supabase
            .from("Users")
            .update({
              points: data[0].points - 1,
              attended: attendance.filter((item) => item != selection)
            })
            .eq("email", User?.email);
          if (error) {
            console.log(error);
            return;
          } else {
            setAttendance(attendance.filter((item) => item != selection));
            return;
          }
        }
        if (error) {
          console.log(error);
        }
        return;
      }
      const userInput = prompt("Please enter password:", "password");
      const filtered = data?.filter((daton) => daton.id === selection)[0];
      if (!filtered) {
        console.log("empty");
        return;
      }
      {
        const id = User.id;
        console.log(id);
        const { data, error } = await supabase.rpc("validate_attendance", {
          event_id: selection,
          input: userInput,
          user_id: id
        });
        if (error) {
          console.error(error);
          return;
        } else {
          console.log(data);
          setAttendance([...attendance, selection]);
          console.log([...attendance, selection]);
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
    orgs
  };
}

export interface BulletinContextProps {
  data: Event[] | undefined;
  tagFilters: string[];
  RSVP: number[];
  attendance: number[];
  handleAttendance: (remove: boolean, selection: number) => void;
  handleRSVP: (selection: number, remove: boolean) => void;
  setTagFilters: (tags: string[]) => void;
  setSearch: (search: string) => void;
  orgFilters: string[];
  setOrgFilters: (orgs: string[]) => void;
  orgs: string[];
}

export const BulletinContext = createContext<BulletinContextProps>({} as BulletinContextProps);
