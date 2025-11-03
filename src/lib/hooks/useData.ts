import { deleteEvent, fetchEventByOrg } from "@services/event";
import { useCallback, useEffect, useState } from "react";
import { User } from "@lib/UserContext";
import { Event } from "@lib/constants";
import DisplayToast from "@lib/hooks/useToast";
// useData custom hook used in DataTable component
export function useData(User: User | null) {
  const [data, setData] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fetch events posted by user, wrapped in useCallback so that data will
  // update when User changes (when they log out)
  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!User) {
      return;
    }
    const { data, error } = await fetchEventByOrg(User.id);
    if (data) {
      setData(data);
      setError("");
      setLoading(false);
    } else if (error) {
      setError(error.message);
      setLoading(false);
      DisplayToast("Unable to fetch your posted events", "error");
    }
  }, [User]);

  // fetch events posted by user on component render
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // delete event
  const handleDelete = async (id: string) => {
    const error = await deleteEvent(id);
    if (error) {
      setError(error.message);
      DisplayToast("Unable to delete event", "error");
    } else {
      setData(data ? data.filter((daton) => daton.id != id) : null);
      setError("");
      DisplayToast("Succesfully deleted event", "success");
    }
  };

  return { data, loading, error, handleDelete, fetchData };
}
