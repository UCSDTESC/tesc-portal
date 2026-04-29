import { eventFormDataDefault, formdata } from "@lib/constants";
import { useState } from "react";
import { Event } from "@lib/constants";
import { toISO } from "@lib/utils";

// custom hook managing the edit modal in the DataTable component
export function useEditModal() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [curID, setCurrID] = useState("");
  const [currEdit, setCurrEdit] = useState<formdata>(eventFormDataDefault);

  // Open the Edit Modal with the corresponding data inserted in
  const openEditModal = (daton: Event) => {
    setShowEditModal(true);
    setCurrID(daton.id);
    setCurrEdit({
      title: daton.title,
      password: daton.password,
      start_date: daton.start_date ? toISO(daton.start_date) : "",
      end_date: daton.end_date ? toISO(daton.end_date) : "",
      location: [],
      location_str: daton.location_str,
      content: daton.content,
      tags: daton.tags,
      poster: daton.poster,
      attendance_cap: daton.attendance_cap,
      track_attendance: daton.track_attendance ?? false,
      type: daton.type ?? "external",
      manual_attendance: daton.manual_attendance != null ? String(daton.manual_attendance) : "",
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
