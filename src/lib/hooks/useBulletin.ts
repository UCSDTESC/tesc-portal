import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { fetchGradYears, fetchOrgs } from "@services/organization";
import { editRSVP, fetchRSVPAndAttended, logAttendance } from "@services/user";
import {
  fetchEventSlotStatsForEvent,
  queryEventsBySearchAndFilters,
  queryPeopleBySearchAndFilters,
} from "@services/event";
import UserContext, { User } from "@lib/UserContext";
import { Event, Member, PortalMode, canAccessRecruiterData } from "@lib/constants";
import { useDebouncedValue } from "@lib/hooks/useDebouncedValue";
import DisplayToast from "@lib/hooks/useToast";

// custom hook for bulletin component
export function useBulletin(User: User | null, portalMode: PortalMode) {
  const { setShowLoginModal, activeOrgName, userOrgIds } = useContext(UserContext);
  const [data, setData] = useState<Event[]>();
  const [People, setPeople] = useState<Member[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpByEvent, setRsvpByEvent] = useState<Record<string, string> | null>(null);
  const [attendedByEvent, setAttendedByEvent] = useState<Record<string, string> | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [orgs, setOrgs] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [orgFilters, setOrgFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [internalFilter, setInternalFilter] = useState<boolean>(false);
  const [sortMethod, setSortMethod] = useState<string>("");
  const [gradYears, setGradYears] = useState<string[]>([]);

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

  const patchEventSlotStats = useCallback(async (eventId: string) => {
    const { slots, error } = await fetchEventSlotStatsForEvent(eventId);
    if (error || !slots) return;
    setData((prev) =>
      prev?.map((event) => (String(event.id) === String(eventId) ? { ...event, slots } : event)),
    );
  }, []);

  const fetchData = useCallback(async () => {
    const recruiterView = portalMode === "recruiter";
    const recruiterAccess = recruiterView && canAccessRecruiterData(User?.role);

    if (!User) {
      setIsLoading(false);
      if (recruiterView) {
        setPeople(undefined);
      }
      return;
    }

    if (recruiterView && !recruiterAccess) {
      setIsLoading(false);
      setPeople(undefined);
      return;
    }

    setIsLoading(true);

    const isSuperOrg = activeOrgName === "super_org";
    if (recruiterAccess) {
      const { People, error } = await queryPeopleBySearchAndFilters(
        debouncedSearch,
        tagFilters,
        orgFilters,
        sortMethod,
      );
      if (People) {
        setPeople(People as unknown as Member[]);
      } else {
        console.error(error?.message);
      }
      setIsLoading(false);
    } else {
      const { events, error } = await queryEventsBySearchAndFilters(
        debouncedSearch,
        tagFilters,
        orgFilters,
        typeFilters,
        sortMethod,
        User?.id,
        { internalFilter, isSuperOrg, userOrgIds },
      );
      if (events) {
        setData(events as unknown as Event[]);
      } else {
        console.error(error?.message);
        DisplayToast("Error fetching events", "error");
      }
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    tagFilters,
    orgFilters,
    typeFilters,
    sortMethod,
    User,
    internalFilter,
    activeOrgName,
    portalMode,
    userOrgIds,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshUserEventStatus = useCallback(async () => {
    if (!User?.email) {
      setRsvpByEvent(null);
      setAttendedByEvent(null);
      return;
    }

    const { rsvpByEvent: rsvpMap, attendedByEvent: attendedMap, error } =
      await fetchRSVPAndAttended(User.email);
    if (rsvpMap && attendedMap) {
      setRsvpByEvent(rsvpMap);
      setAttendedByEvent(attendedMap);
    } else if (error) {
      console.error(error.message);
      DisplayToast("Error fetching user history", "error");
    }
  }, [User?.email]);

  useEffect(() => {
    refreshUserEventStatus();
  }, [refreshUserEventStatus]);

  const refreshEventView = useCallback(
    async (eventId?: string) => {
      await refreshUserEventStatus();
      if (eventId) {
        await patchEventSlotStats(eventId);
      }
    },
    [refreshUserEventStatus, patchEventSlotStats],
  );

  const applyUserRsvp = useCallback((eventId: string, slotId: string) => {
    setRsvpByEvent((prev) => ({ ...(prev ?? {}), [eventId]: slotId }));
  }, []);

  const applyUserAttendance = useCallback((eventId: string, slotId: string) => {
    setAttendedByEvent((prev) => ({ ...(prev ?? {}), [eventId]: slotId }));
  }, []);

  const handleRSVP = async (
    eventId: string,
    slotId: string,
    action: "rsvp" | "cancel" | "switch",
  ) => {
    if (!User?.id) {
      setShowLoginModal(true);
      return;
    }

    const error = await editRSVP(eventId, slotId, action);
    if (error) {
      console.error(error.message);
      DisplayToast(
        action === "cancel" ? "Unable to remove RSVP" : "Unable to RSVP for this slot",
        "error",
      );
      return;
    }

    setRsvpByEvent((prev) => {
      const next = { ...(prev ?? {}) };
      if (action === "cancel") {
        delete next[eventId];
      } else {
        next[eventId] = slotId;
      }
      return next;
    });
    await refreshEventView(eventId);
    DisplayToast(
      action === "cancel"
        ? "Succesfully removed RSVP"
        : action === "switch"
          ? "Succesfully switched time slot"
          : "Succesfully RSVP'd",
      "success",
    );
  };

  const handleAttendance = async (eventId: string, slotId?: string) => {
    if (!User?.id) {
      setShowLoginModal(true);
      return;
    }

    const userInput = prompt("Please enter password:", "password");
    if (!userInput) return;

    const error = await logAttendance(eventId, User.id, userInput, slotId);
    if (error) {
      console.error(error.message);
      DisplayToast("Error logging attendance", "error");
      return;
    }

    setAttendedByEvent((prev) => ({
      ...(prev ?? {}),
      [eventId]: slotId ?? "",
    }));
    await refreshEventView(eventId);
    DisplayToast("Succesfully logged attendance", "success");
  };

  return {
    data,
    People,
    isLoading,
    tagFilters,
    gradYears,
    rsvpByEvent,
    attendedByEvent,
    handleAttendance,
    handleRSVP,
    setTagFilters,
    setSearch,
    orgFilters,
    setOrgFilters,
    typeFilters,
    setTypeFilters,
    orgs,
    internalFilter,
    setInternalFilter,
    sortMethod,
    setSortMethod,
    fetchData,
    refreshEventView,
    applyUserRsvp,
    applyUserAttendance,
    activeOrgName,
  };
}

export interface BulletinContextProps {
  data: Event[] | undefined;
  People: Member[] | undefined;
  isLoading?: boolean;
  tagFilters: string[];
  gradYears: string[];
  rsvpByEvent: Record<string, string> | null;
  attendedByEvent: Record<string, string> | null;
  handleAttendance: (eventId: string, slotId?: string) => void;
  handleRSVP: (eventId: string, slotId: string, action: "rsvp" | "cancel" | "switch") => void;
  setTagFilters: (tags: string[]) => void;
  setSearch: (search: string) => void;
  orgFilters: string[];
  setOrgFilters: (orgs: string[]) => void;
  typeFilters: string[];
  setTypeFilters: (types: string[]) => void;
  orgs: string[];
  internalFilter: boolean;
  setInternalFilter: (value: boolean) => void;
  sortMethod: string;
  setSortMethod: (sortMethod: string) => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  eventTimeFilter?: "current" | "past";
  forumMode?: boolean;
  openEditModal?: (event: Event) => void;
  showEditModal?: boolean;
  setShowEditModal?: (show: boolean) => void;
  isSuperOrg?: boolean;
  activeOrgName?: string;
  qrBanner?: { type: "success" | "info" | "error"; message: string } | null;
}

export const BulletinContext = createContext<BulletinContextProps>({
  data: [],
  People: [],
  isLoading: false,
  tagFilters: [],
  gradYears: [],
  rsvpByEvent: {},
  attendedByEvent: {},
  handleAttendance: () => {},
  handleRSVP: () => {},
  setTagFilters: () => {},
  setSearch: () => {},
  orgFilters: [],
  setOrgFilters: () => {},
  typeFilters: [],
  setTypeFilters: () => {},
  orgs: [],
  internalFilter: false,
  setInternalFilter: () => {},
  sortMethod: "",
  setSortMethod: () => {},
  portalMode: "events",
  setPortalMode: () => {},
  eventTimeFilter: "current",
  forumMode: false,
  openEditModal: () => {},
  showEditModal: false,
  setShowEditModal: () => {},
  isSuperOrg: false,
  activeOrgName: "",
  qrBanner: null,
} as BulletinContextProps);
