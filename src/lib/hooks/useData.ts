import { deleteEvent, fetchEventByOrg } from "@services/event";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@lib/UserContext";
import { Event } from "@lib/constants";
import { applyEventCountUpdate } from "@lib/eventCountUpdate";
import {
  loadCountSamples,
  noteEventCounts,
  saveCountSamples,
  type CountSampleLog,
} from "@lib/hourCountDelta";
import DisplayToast from "@lib/hooks/useToast";
import supabase from "@server/supabase";
// useData custom hook used in DataTable component
export function useData(User: User | null, orgName?: string) {
  const [data, setData] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const channelName = useRef(`posted-events-${crypto.randomUUID()}`);
  const samplesRef = useRef<CountSampleLog>(loadCountSamples());

  const stamp = useCallback((events: Event[]) => {
    const noted = noteEventCounts(samplesRef.current, events);
    if (noted.log !== samplesRef.current) {
      samplesRef.current = noted.log;
      saveCountSamples(noted.log);
    }
    return noted.events;
  }, []);

  // fetch events posted by user, wrapped in useCallback so that data will
  // update when User changes (when they log out)
  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!User) {
      return;
    }
    const shouldFetchAllEvents = orgName === undefined;
    const { data, error } = await fetchEventByOrg(User.id, shouldFetchAllEvents);
    if (data) {
      const typedEvents = data as unknown as Event[];
      const filteredData = orgName
        ? typedEvents.filter((event: Event) => String(event.orgs?.name) === String(orgName))
        : typedEvents;

      setData(stamp(filteredData));
      setError("");
      setLoading(false);
    } else if (error) {
      setError(error.message);
      setLoading(false);
      DisplayToast("Unable to fetch your posted events", "error");
    }
  }, [User, orgName, stamp]);

  // fetch events posted by user on component render
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const userId = User?.id ?? "";

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events" },
        (payload) => {
          const next = payload.new as { id?: string | number; rsvp?: unknown; attendance?: unknown };
          setData((current) => {
            const updated = applyEventCountUpdate(current, next);
            if (!updated || updated === current) return current;
            return stamp(updated);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, stamp]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((current) => (current ? stamp(current) : current));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [stamp]);

  // delete event
  const handleDelete = async (id: string) => {
    const error = await deleteEvent(id);
    if (error) {
      setError(error.message);
      DisplayToast("Unable to delete event", "error");
    } else {
      const nextSamples = { ...samplesRef.current };
      delete nextSamples[String(id)];
      samplesRef.current = nextSamples;
      saveCountSamples(nextSamples);
      setData(data ? data.filter((daton) => daton.id != id) : null);
      setError("");
      DisplayToast("Succesfully deleted event", "success");
    }
  };

  return { data, loading, error, handleDelete, fetchData };
}
