import { fetchEventById } from "@services/event";
import { eventFormDataDefault, formdata } from "@lib/constants";
import { useState } from "react";
import { Event } from "@lib/constants";
import { toISO, toLocalDatetimeInput } from "@lib/utils";

// custom hook managing the edit modal in the DataTable component
export function useEditModal() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [curID, setCurrID] = useState("");
  const [currEdit, setCurrEdit] = useState<formdata>(eventFormDataDefault);

  // Open the Edit Modal with the corresponding data inserted in
  const openEditModal = async (daton: Event) => {
    let source = daton;
    if (source.content == null || source.password == null) {
      const { event } = await fetchEventById(daton.id);
      if (event) source = event as unknown as Event;
    }

    setShowEditModal(true);
    setCurrID(source.id);
    setCurrEdit({
      title: source.title,
      password: source.password ?? "",
      start_date: source.start_date ? toISO(source.start_date) : "",
      end_date: source.end_date ? toISO(source.end_date) : "",
      location: [],
      location_str: source.location_str,
      content: source.content ?? "",
      tags: source.tags,
      poster: source.poster,
      attendance_cap: source.attendance_cap,
      track_attendance: source.track_attendance ?? false,
      type: source.type ?? "external",
      manual_attendance: source.manual_attendance != null ? String(source.manual_attendance) : "",
      slots:
        source.slots?.map((slot) => ({
          id: slot.id,
          starts_at: toLocalDatetimeInput(slot.starts_at),
          ends_at: toLocalDatetimeInput(slot.ends_at),
          capacity: slot.capacity,
        })) ?? [],
    });
  };

  const openCreateForumPostModal = () => {
    setShowEditModal(true);
    setCurrID("");
    setCurrEdit({
      ...eventFormDataDefault,
      title: "Forum Post",
      type: "forum",
      // forum posts do not have start/end; backend will store NULLs
      start_date: "",
      end_date: "",
      location: [],
      location_str: "",
      tags: [],
      poster: "",
      track_attendance: false,
      attendance_cap: undefined,
      manual_attendance: "",
      recurring_rate: "none",
      recurrence_end_date: "",
      password: "",
      content: "",
    });
  };

  return { showEditModal, setShowEditModal, curID, currEdit, openEditModal, openCreateForumPostModal };
}
