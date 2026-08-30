import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { formdata, RECURRING_RATES } from "@lib/constants";
import { getFormDataDefault, initializeFormData, toLocalDatetimeInput } from "@lib/utils";
import {
  createEvent,
  updateEvent,
  fetchEventAttendanceToken,
  type CreateEventSuccess,
} from "@services/event";
import supabase from "@server/supabase";

import Editor from "./Editor";
import { MultipleSelectChip, Dropdown } from "./Dropdowns";
import DisplayToast from "@lib/hooks/useToast";
import { Tooltip, Switch, FormControlLabel } from "@mui/material";
import { IoCloudUploadOutline, IoInformationCircleOutline } from "react-icons/io5";
import EventSlotsEditor from "./EventSlotsEditor";
import EventQrModal from "./EventQrModal";

// TODO: refactor label and input components into an individual component
export default function Form({
  formdata,
  id,
  editEvent = false,
  onSuccess,
}: {
  formdata?: formdata;
  id: string;
  editEvent?: boolean;
  onSuccess: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const { User, activeOrgName } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<formdata>(() => initializeFormData(formdata));
  const isForum = (formData.type ?? "external") === "forum";
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [qrModal, setQrModal] = useState<{
    eventId: string;
    eventTitle: string;
    attendanceToken: string;
  } | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const isCreateEventSuccess = (result: unknown): result is CreateEventSuccess =>
    typeof result === "object" &&
    result !== null &&
    "eventId" in result &&
    typeof (result as CreateEventSuccess).eventId === "string";

  const handlePosterUpload = async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Event poster must be 2MB or smaller.");
      DisplayToast("File size exceeds 2MB limit.", "error");
      return;
    }
    if (!activeOrgName) {
      setError("No active organization selected for event poster upload.");
      return;
    }

    try {
      setUploadingPoster(true);
      setError("");

      const safeOrgName = activeOrgName.replace(/[^\w-]+/g, "_");
      const filePath = `${safeOrgName}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("event.images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        console.error("Failed to upload event poster:", uploadError);
        setError("Failed to upload event poster. Please try again.");
        return;
      }

      const { data: publicData } = supabase.storage.from("event.images").getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl ?? "";

      setFormData((prev) => ({
        ...prev,
        poster: publicUrl,
      }));
    } finally {
      setUploadingPoster(false);
    }
  };

  useEffect(() => {
    document.title = "New Event | TESC Portal";
  }, []);

  useEffect(() => {
    if (!editEvent || !id || isForum) return;
    if (formdata?.slots && formdata.slots.length > 0) return;

    const loadSlots = async () => {
      const { data, error } = await supabase
        .from("event_slot_stats")
        .select("slot_id, starts_at, ends_at, capacity")
        .eq("event_id", id)
        .order("starts_at", { ascending: true });
      if (error) {
        console.error(error.message);
        return;
      }
      if (data?.length) {
        setFormData((prev) => ({
          ...prev,
          slots: data.map((slot) => ({
            id: String(slot.slot_id),
            starts_at: toLocalDatetimeInput(String(slot.starts_at)),
            ends_at: toLocalDatetimeInput(String(slot.ends_at)),
            capacity: slot.capacity,
          })),
        }));
      }
    };
    loadSlots();
  }, [editEvent, id, isForum, formdata?.slots]);
  // handle change to form
  const handleChange = <T,>(value: T, cols: string[]): void => {
    setFormData((prev) => {
      let next = prev;
      for (const col of cols) {
        next = { ...next, [col]: value };
      }
      return next;
    });
  };

  // update event or create new event
  const handleSubmit = async () => {
    const recurringRate = formData.recurring_rate ?? "none";
    const firstSlotStart = formData.slots?.[0]?.starts_at ?? "";
    if (!editEvent && !isForum && recurringRate !== "none") {
      const recurrenceEnd = formData.recurrence_end_date ?? "";
      if (!recurrenceEnd.trim()) {
        setError("Please select a recurrence end date for recurring events.");
        DisplayToast("Recurrence end date is required", "error");
        return;
      }
      if (!firstSlotStart) {
        setError("Add at least one time slot before setting recurrence.");
        DisplayToast("Add a time slot first", "error");
        return;
      }
      const startDate = new Date(firstSlotStart);
      const endDate = new Date(recurrenceEnd);
      if (endDate < startDate) {
        setError("Recurrence end date must be on or after the first time slot.");
        DisplayToast("Invalid recurrence end date", "error");
        return;
      }
    }

    if (!isForum && (!formData.slots || formData.slots.length === 0)) {
      setError("Add at least one time slot.");
      DisplayToast("Add at least one time slot", "error");
      return;
    }

    if (editEvent && formdata && User?.id) {
      const error = await updateEvent(id, formData);
      if (error) {
        setError(error.message);
        DisplayToast("Unable to update event", "error");
      } else {
        onSuccess();
        DisplayToast("Succesfully updated event", "success");
      }
    } else if (User?.id) {
      const result = await createEvent(formData, activeOrgName);
      if (isCreateEventSuccess(result)) {
        if (isForum) {
          onSuccess();
          DisplayToast("Succesfully created forum post", "success");
        } else {
          const createdTitle = formData.title;
          form.current?.reset();
          setFormData(getFormDataDefault());
          DisplayToast("Succesfully created event", "success");
          if (result.attendanceToken && (formData.track_attendance ?? false)) {
            setQrModal({
              eventId: result.eventId,
              eventTitle: createdTitle,
              attendanceToken: result.attendanceToken,
            });
          } else {
            navigate("/");
          }
        }
      } else {
        const message =
          (result as { message?: string } | null)?.message ?? "Unable to create event";
        console.log(result);
        setError(message);
        DisplayToast("Unable to create event", "error");
      }
    }
  };

  const firstSlotStart = formData.slots?.[0]?.starts_at ?? "";

  const openQrModal = async () => {
    if (!editEvent || !id) return;
    setLoadingQr(true);
    try {
      const { token, error } = await fetchEventAttendanceToken(id);
      if (error || !token) {
        DisplayToast("QR code is not available for this event", "error");
        return;
      }
      setQrModal({
        eventId: id,
        eventTitle: formData.title,
        attendanceToken: token,
      });
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <div className={`w-1/2 flex flex-col m-auto bg-white z-101 ${editEvent ? "mt-5" : "mt-20"}`}>
      {!editEvent && (
        <>
          {isForum ? (
            <>
              <div className="p-5">
                <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]">
                  Post something to the Forum!
                </h1>
                <p className="font-DM text-xl w-3/4 text-balance text-[#262626] hidden md:block">
                  Share an update with the community.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-5">
                <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]">
                  Create a new Event!
                </h1>
                <p className="font-DM text-xl w-3/4 text-balance text-[#262626] hidden md:block">
                  Submit a <strong>New Event</strong> to be displayed on the Bulletin
                </p>
              </div>
            </>
          )}
        </>
      )}
      <form
        className=" p-5 flex flex-col gap-2 w-full h-min"
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <p className="text-red-500">{error}</p>

        <label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          placeholder={isForum ? "Forum post title" : "Title"}
          className="border-black border rounded-lg px-3 h-12"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, ["title"]: e.target.value })}
          autoFocus
          required
        />
        {(formData.track_attendance ?? false) && (
          <>
            <div className="flex items-center gap-1">
              <label htmlFor="Password">Event Code </label>
              <Tooltip
                title={
                  "This code is used for Event attendance validation for participants, show this code at your event to track attendance"
                }
                placement="bottom"
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: "offset",
                        options: {
                          offset: [0, -14],
                        },
                      },
                    ],
                  },
                }}
              >
                <IoInformationCircleOutline className="text-sm" />
              </Tooltip>
            </div>
            <input
              name="Password"
              placeholder="Code"
              className="border-black border rounded-lg px-3 h-12"
              value={formData.password}
              onChange={(e) => handleChange(e.target.value, ["password"])}
              autoFocus
              required
            />
          </>
        )}
        {!isForum && (
          <EventSlotsEditor
            slots={formData.slots ?? []}
            onChange={(slots) => setFormData((prev) => ({ ...prev, slots }))}
            showCapacity={formData.track_attendance ?? false}
          />
        )}

        {!editEvent && !isForum && (
          <>
            <label htmlFor="recurring">Recurring</label>
            <select
              id="recurring"
              className="border-black border rounded-lg px-3 h-12"
              value={formData.recurring_rate ?? "none"}
              onChange={(e) =>
                handleChange(
                  e.target.value as "none" | "daily" | "weekly" | "biweekly" | "monthly",
                  ["recurring_rate"],
                )
              }
            >
              {RECURRING_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate === "none" ? "None" : rate.charAt(0).toUpperCase() + rate.slice(1)}
                </option>
              ))}
            </select>
            {(formData.recurring_rate ?? "none") !== "none" && (
              <>
                <label htmlFor="recurrence_end">Recurrence end date</label>
                <input
                  id="recurrence_end"
                  type="date"
                  className="border-black border rounded-lg px-3 h-12"
                  value={formData.recurrence_end_date ?? ""}
                  min={firstSlotStart?.slice(0, 10)}
                  onChange={(e) => handleChange(e.target.value, ["recurrence_end_date"])}
                />
              </>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-6">
          {!isForum && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.track_attendance ?? false}
                    onChange={(_, checked) => handleChange(checked, ["track_attendance"])}
                    color="primary"
                  />
                }
                label="Track attendance on the portal"
              />
              <div className="flex items-center gap-2">
                <label htmlFor="event-type">Event type</label>
                <select
                  id="event-type"
                  className="border-black border rounded-lg px-3 h-10"
                  value={formData.type ?? "external"}
                  onChange={(e) =>
                    handleChange(e.target.value as "internal" | "external", ["type"])
                  }
                >
                  <option value="internal">internal</option>
                  <option value="external">external</option>
                </select>
              </div>
            </>
          )}
        </div>

        {!isForum && !(formData.track_attendance ?? false) && (
          <>
            <label htmlFor="manual_attendance">Manual attendance</label>
            <input
              id="manual_attendance"
              name="manual_attendance"
              type="number"
              min={0}
              placeholder="Enter attendance count"
              className="border-black border rounded-lg px-3 h-12"
              value={formData.manual_attendance ?? ""}
              onChange={(e) => handleChange(e.target.value, ["manual_attendance"])}
            />
          </>
        )}

        {!isForum && (
          <>
            <label>Event Location</label>
            <Dropdown formData={formData} handleChange={handleChange} />
          </>
        )}
        {(formData.type ?? "external") !== "internal" && (
          <>
            {!isForum && (
              <>
                <label>Tags</label>
                <MultipleSelectChip formData={formData} handleChange={handleChange} />
              </>
            )}
            <label>Event Poster</label>
            <label
              htmlFor="event-poster-upload"
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black border-dashed cursor-pointer hover:bg-gray-100 transition-colors"
              title="Upload poster image"
            >
              <IoCloudUploadOutline className="w-6 h-6 text-navy" />
              <input
                id="event-poster-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handlePosterUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            {uploadingPoster && <p className="text-sm text-gray-600">Uploading poster…</p>}
            {formData.poster && !uploadingPoster && (
              <img src={formData.poster} alt="" className="rounded-2xl max-w-[220px]" />
            )}
          </>
        )}
        <Editor content={formData.content} setEditorContent={(e) => handleChange(e, ["content"])} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="bg-[#6A97BD] border border-[#6A97BD] text-white w-fit rounded-lg px-5 py-2 cursor-pointer"
          >
            {isForum
              ? editEvent
                ? "Edit Forum Post"
                : "Post to the Forum"
              : editEvent
                ? "Edit Event"
                : "Submit New Event"}
          </button>
          {editEvent && !isForum && (formData.track_attendance ?? false) && (
            <button
              type="button"
              onClick={openQrModal}
              disabled={loadingQr}
              className="border border-navy text-navy w-fit rounded-lg px-5 py-2 cursor-pointer disabled:opacity-50"
            >
              {loadingQr ? "Loading QR…" : "Show QR Code"}
            </button>
          )}
        </div>
      </form>
      {qrModal && (
        <EventQrModal
          eventId={qrModal.eventId}
          eventTitle={qrModal.eventTitle}
          attendanceToken={qrModal.attendanceToken}
          onClose={() => {
            setQrModal(null);
            if (!editEvent) {
              navigate(`/bulletin/${qrModal.eventId}`);
            }
          }}
        />
      )}
    </div>
  );
}
