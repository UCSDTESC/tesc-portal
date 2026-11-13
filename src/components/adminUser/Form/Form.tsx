import { useEffect, useRef, useState, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { Event, EventSlot, formdata, RECURRING_RATES } from "@lib/constants";
import { getFormDataDefault, initializeFormData, toLocalDatetimeInput } from "@lib/utils";
import { validateEventQuestions } from "@lib/eventQuestions";
import EventInfo from "@components/Bulletin/EventInfo";
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
import {
  AlertCircle,
  AlignLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  QrCode,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PageHeader from "@components/shell/PageHeader";
import EventSlotsEditor from "./EventSlotsEditor";
import EventQuestionsEditor from "./EventQuestionsEditor";
import EventQrModal from "./EventQrModal";
import ProfileAdminTables from "../Profile/ProfileAdminTables";

/** Shared field styling for the redesigned form. */
const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
const selectClass =
  "h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
const labelClass = "mb-1.5 block text-sm font-semibold text-ink";

/** Navy/brand checked state for the MUI switches. */
const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#0f2440" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#2f7fc1",
  },
};

/** A white card grouping one logical section of the form. */
function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card-shadow rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

// TODO: refactor label and input components into an individual component
export default function Form({
  formdata,
  id,
  editEvent = false,
  inModal = false,
  onSuccess,
}: {
  formdata?: formdata;
  id: string;
  editEvent?: boolean;
  // True when rendered inside an edit modal (Bulletin / DataTable). The
  // modal floats over the page, so the form needs its white panel there;
  // on the /form page it is the page itself and stays panel-less.
  inModal?: boolean;
  onSuccess: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  // const { User, activeOrgName } = useContext(UserContext);
  const { User, activeOrgName, myOrgs } = useContext(UserContext);
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
  const [orgPfpStr, setOrgPfpStr] = useState("");
  const activeOrgId = useMemo(
    () => myOrgs.find((org) => org.name === activeOrgName)?.id,
    [myOrgs, activeOrgName],
  );

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
    if (!activeOrgName) {
      setOrgPfpStr("");
      return;
    }

    let cancelled = false;
    const loadOrgPfp = async () => {
      const { data, error } = await supabase
        .from("orgs")
        .select("pfp_str")
        .eq("name", activeOrgName)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data?.pfp_str) {
        setOrgPfpStr("");
        return;
      }
      setOrgPfpStr(data.pfp_str);
    };
    loadOrgPfp();

    return () => {
      cancelled = true;
    };
  }, [activeOrgName]);

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

    const questionsError = validateEventQuestions(formData.questions);
    if (!isForum && questionsError) {
      setError(questionsError);
      DisplayToast(questionsError, "error");
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

  const previewEvent = useMemo((): Event => {
    const slots: EventSlot[] = (formData.slots ?? [])
      .filter((slot) => slot.starts_at && slot.ends_at)
      .map((slot, index) => ({
        id: slot.id ?? `preview-slot-${index}`,
        event_id: id || "preview",
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
        capacity: slot.capacity ?? null,
        rsvp_count: 0,
        attended_count: 0,
      }));
    return {
      id: id || "preview",
      UID: User?.id ?? "",
      created_at: "",
      title: formData.title || (isForum ? "Untitled post" : "Untitled event"),
      content: formData.content || "",
      location_str: formData.location_str,
      location: formData.location,
      start_date: slots[0]?.starts_at ?? formData.start_date ?? "",
      end_date: slots[slots.length - 1]?.ends_at ?? formData.end_date ?? "",
      attendance: 0,
      dependent_on: formData.dependent_on ?? "",
      rsvp: 0,
      orgs: {
        name: activeOrgName || "Your organization",
        pfp_str: orgPfpStr,
      },
      poster: formData.poster,
      attendance_cap: formData.attendance_cap,
      org_id: activeOrgId ?? "",
      track_attendance: formData.track_attendance,
      food_provided: formData.food_provided ?? "",
      as_funding: formData.as_funding ?? false,
      type: formData.type,
      tags: (formData.tags ?? []).filter(Boolean),
      slots,
      questions: formData.questions ?? [],
    };
  }, [formData, id, User?.id, activeOrgName, activeOrgId, isForum, orgPfpStr]);

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
    <div
      className={
        editEvent || inModal
          ? "relative z-[101] mx-auto my-5 w-[95%] max-w-7xl rounded-2xl bg-white p-4 shadow-xl sm:p-6"
          : "mx-auto w-full max-w-7xl"
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          <PageHeader
            eyebrow={isForum ? "Forum" : "Events"}
            title={
              isForum
                ? editEvent
                  ? "Edit Forum Post"
                  : "Post to the Forum"
                : editEvent
                  ? "Edit Event"
                  : "New Event"
            }
            subtitle={
              isForum
                ? "Share an update with the community."
                : editEvent
                  ? "Update the details for this event."
                  : "Submit a new event to be displayed on the Bulletin."
            }
          />
          <form
            className="flex w-full flex-col gap-5"
            ref={form}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <FormSection
              icon={FileText}
              title="Basics"
              description="The title and type shown on the bulletin."
            >
              <div>
                <label htmlFor="title" className={labelClass}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  placeholder={isForum ? "Forum post title" : "Title"}
                  className={inputClass}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, ["title"]: e.target.value })}
                  autoFocus
                  required
                />
              </div>
              {(formData.track_attendance ?? false) && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <label htmlFor="Password" className="text-sm font-semibold text-ink">
                      Event Code
                    </label>
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
                      <Info className="h-4 w-4 text-ink-muted" />
                    </Tooltip>
                  </div>
                  <input
                    name="Password"
                    placeholder="Code"
                    className={inputClass}
                    value={formData.password}
                    onChange={(e) => handleChange(e.target.value, ["password"])}
                    autoFocus
                    required
                  />
                </div>
              )}
              {!isForum && (
                <div>
                  <label htmlFor="event-type" className={labelClass}>
                    Event type
                  </label>
                  <select
                    id="event-type"
                    className={selectClass}
                    value={formData.type ?? "external"}
                    onChange={(e) =>
                      handleChange(e.target.value as "internal" | "external", ["type"])
                    }
                  >
                    <option value="internal">internal</option>
                    <option value="external">external</option>
                  </select>
                </div>
              )}
            </FormSection>

            {!isForum && (
              <FormSection
                icon={CalendarDays}
                title="Schedule"
                description="Add one or more time slots. The event's overall start and end times come from your slots."
              >
                <EventSlotsEditor
                  slots={formData.slots ?? []}
                  onChange={(slots) => setFormData((prev) => ({ ...prev, slots }))}
                  showCapacity={formData.track_attendance ?? false}
                />
                {!editEvent && (
                  <>
                    <div>
                      <label htmlFor="recurring" className={labelClass}>
                        Recurring
                      </label>
                      <select
                        id="recurring"
                        className={selectClass}
                        value={formData.recurring_rate ?? "none"}
                        onChange={(e) =>
                          handleChange(
                            e.target.value as
                              | "none"
                              | "daily"
                              | "weekly"
                              | "biweekly"
                              | "monthly",
                            ["recurring_rate"],
                          )
                        }
                      >
                        {RECURRING_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate === "none"
                              ? "None"
                              : rate.charAt(0).toUpperCase() + rate.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(formData.recurring_rate ?? "none") !== "none" && (
                      <div>
                        <label htmlFor="recurrence_end" className={labelClass}>
                          Recurrence end date
                        </label>
                        <input
                          id="recurrence_end"
                          type="date"
                          className={inputClass}
                          value={formData.recurrence_end_date ?? ""}
                          min={firstSlotStart?.slice(0, 10)}
                          onChange={(e) => handleChange(e.target.value, ["recurrence_end_date"])}
                        />
                      </div>
                    )}
                  </>
                )}
              </FormSection>
            )}

            {!isForum && (
              <FormSection
                icon={ClipboardList}
                title="Registration & attendance"
                description="Control RSVPs, attendance tracking, and the questions attendees answer."
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.track_attendance ?? false}
                        onChange={(_, checked) => handleChange(checked, ["track_attendance"])}
                        color="primary"
                        sx={switchSx}
                      />
                    }
                    label="Track attendance on the portal"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rsvp_required ?? false}
                        onChange={(_, checked) => handleChange(checked, ["rsvp_required"])}
                        color="primary"
                        sx={switchSx}
                      />
                    }
                    label="Require RSVP before the day of the event"
                  />
                </div>

                {!(formData.track_attendance ?? false) && (
                  <>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.track_attendance ?? false}
                            onChange={(_, checked) =>
                              handleChange(checked, ["track_attendance"])
                            }
                            color="primary"
                            sx={switchSx}
                          />
                        }
                        label="Track attendance on the portal"
                      />
                      <div className="flex items-center gap-2">
                        <label htmlFor="event-type" className="text-sm font-medium text-ink">
                          Event type
                        </label>
                        <select
                          id="event-type"
                          className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          value={formData.type ?? "external"}
                          onChange={(e) =>
                            handleChange(e.target.value as "internal" | "external", ["type"])
                          }
                        >
                          <option value="internal">internal</option>
                          <option value="external">external</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="manual_attendance" className={labelClass}>
                        Manual attendance
                      </label>
                      <input
                        id="manual_attendance"
                        name="manual_attendance"
                        type="number"
                        min={0}
                        placeholder="Enter attendance count"
                        className={inputClass}
                        value={formData.manual_attendance ?? ""}
                        onChange={(e) => handleChange(e.target.value, ["manual_attendance"])}
                      />
                    </div>
                  </>
                )}

                <EventQuestionsEditor
                  questions={formData.questions ?? []}
                  onChange={(questions) => setFormData((prev) => ({ ...prev, questions }))}
                />
              </FormSection>
            )}

            {!isForum && (
              <FormSection
                icon={MapPin}
                title="Location & food"
                description="Where the event happens and what attendees can expect to eat."
              >
                <div>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.has_parent}
                        onChange={(_, checked) => {
                          handleChange(checked, ["has_parent"]);
                          if (!checked) handleChange(null, ["dependent_on"]);
                        }}
                        color="primary"
                        sx={switchSx}
                      />
                    }
                    label="Dependent on another event?"
                  />
                  {formData.has_parent && (
                    <div
                      className="mt-2 flex min-w-0 flex-wrap items-center gap-3"
                      onClick={(e) => e.preventDefault()}
                    >
                      <h2 className="text-base font-semibold text-ink">Select parent event</h2>
                      <ProfileAdminTables
                        orgName={activeOrgName === "super_org" ? undefined : activeOrgName}
                        orgId={activeOrgId}
                        showUserAdmin={false}
                        showOrgMembers={false}
                        cols={["title", "start_date", "end_date"]}
                        onRowClick={(e) => {
                          handleChange(e.id, ["dependent_on"]);
                        }}
                        focusId={formData.dependent_on}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Event Location</label>
                  <Dropdown formData={formData} handleChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="food_provided" className={labelClass}>
                    What food is provided <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="food_provided"
                    name="food_provided"
                    placeholder="e.g. Pizza, snacks, or None"
                    className={inputClass}
                    value={formData.food_provided ?? ""}
                    onChange={(e) => handleChange(e.target.value, ["food_provided"])}
                    required
                  />
                </div>
                <div>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.as_funding ?? false}
                        onChange={(_, checked) => handleChange(checked, ["as_funding"])}
                        color="primary"
                        sx={switchSx}
                      />
                    }
                    label="AS funding will be used"
                  />
                </div>
              </FormSection>
            )}

            {/* Forum posts have no poster (and tags are hidden for forum), so the
                Media section would contain only the meaningless poster upload. */}
            {(formData.type ?? "external") !== "internal" && !isForum && (
              <FormSection
                icon={ImageIcon}
                title="Media"
                description="Tags help students discover the event; the poster is shown at the top of the listing."
              >
                {!isForum && (
                  <div>
                    <label className={labelClass}>Tags</label>
                    <MultipleSelectChip formData={formData} handleChange={handleChange} />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Event Poster</label>
                  <label
                    htmlFor="event-poster-upload"
                    className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
                    title="Upload poster image"
                  >
                    <Upload className="h-5 w-5 text-navy-900" />
                    <span className="text-sm font-semibold text-navy-900">
                      Upload poster image
                    </span>
                    <span className="text-xs text-ink-secondary">PNG or JPG, up to 2 MB</span>
                    <input
                      id="event-poster-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handlePosterUpload(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {uploadingPoster && (
                    <p className="mt-2 text-sm text-ink-secondary">Uploading poster…</p>
                  )}
                  {formData.poster && !uploadingPoster && (
                    <img
                      src={formData.poster}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="mt-3 max-w-[220px] rounded-xl border border-line"
                    />
                  )}
                </div>
              </FormSection>
            )}

            <FormSection icon={AlignLeft} title="Description">
              <Editor
                content={formData.content}
                setEditorContent={(e) => handleChange(e, ["content"])}
              />
            </FormSection>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <QrCode className="h-4 w-4" />
                  {loadingQr ? "Loading QR…" : "Show QR Code"}
                </button>
              )}
            </div>
          </form>
        </div>
        <aside className="min-w-0 lg:w-1/2 lg:sticky lg:top-24 lg:self-start">
          <div className="card-shadow max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-line bg-white p-4">
            <EventInfo event={previewEvent} preview />
          </div>
        </aside>
      </div>
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
