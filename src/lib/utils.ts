import { useCallback, useEffect, useState } from "react";
import { deleteEvent, fetchEventByOrg } from "../services/event";
import { User } from "../UserContext";
import { Event, eventFormDataDefault, formdata } from "../lib/constants";
export const formatDate = (date: string) => {
  return date.replaceAll(":", "").replaceAll("-", "").split("+")[0];
};

export const getCurrentTime = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOString = new Date(Date.now() - tzoffset).toISOString().slice(0, -1);
  // convert to YYYY-MM-DDTHH:MM
  const currTime = localISOString.substring(0, ((localISOString.indexOf("T") | 0) + 6) | 0);
  return currTime;
};

export const getFormDataDefault = () => {
  const currTime = getCurrentTime();
  return {
    title: "",
    password: "",
    start_date: currTime,
    end_date: currTime,
    location: [0, 0],
    location_str: "",
    content: "",
    tags: []
  };
};

export const DateParser = (date: string) => {
  const parsedDate = date.split(/-|T|:/);
  console.log(parsedDate);
  const correctDate = new Date(
    Date.UTC(
      parseInt(parsedDate[0]),
      parseInt(parsedDate[1]) - 1,
      parseInt(parsedDate[2]),
      parseInt(parsedDate[3]),
      parseInt(parsedDate[4])
    )
  );
  return correctDate.toUTCString();
};

export const toISO = (date: string) => {
  return date.substring(0, ((date.indexOf("T") | 0) + 6) | 0);
};

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
    }
  }, [User]);

  // fetch events posted by user on component render
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // delete event
  const handleDelete = async (id: number) => {
    const error = await deleteEvent(id);
    if (error) {
      setError(error.message);
    } else {
      setData(data ? data.filter((daton) => daton.id != id) : null);
      setError("");
    }
  };

  return { data, loading, error, handleDelete, fetchData };
}

// custom hook managing the edit modal in the DataTable component
export function useEditModal() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [curID, setCurrID] = useState(0);
  const [currEdit, setCurrEdit] = useState<formdata>(eventFormDataDefault);

  // Open the Edit Modal with the corresponding data inserted in
  const openEditModal = (daton: Event) => {
    setShowEditModal(true);
    setCurrID(daton.id);
    setCurrEdit({
      title: daton.title,
      password: daton.password,
      start_date: toISO(daton.start_date),
      end_date: toISO(daton.end_date),
      location: [],
      location_str: daton.location_str,
      content: daton.content,
      tags: daton.tags
    });
  };

  return { showEditModal, setShowEditModal, curID, currEdit, openEditModal };
}
