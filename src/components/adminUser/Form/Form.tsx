import { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { formdata, profile_picture_src, RECURRING_RATES } from "@lib/constants";
import { getFormDataDefault } from "@lib/utils";
import { createEvent, updateEvent } from "@services/event";

import Editor from "./Editor";
import { MultipleSelectChip, Dropdown } from "./Dropdowns";
import DisplayToast from "@lib/hooks/useToast";
import { Tooltip, Switch, FormControlLabel } from "@mui/material";
import { IoInformationCircleOutline } from "react-icons/io5";

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
  const { User } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<formdata>(formdata ? formdata : getFormDataDefault());

  useEffect(() => {
    document.title = "New Event | TESC Portal";
  }, []);
  // handle change to form
  const handleChange = <T,>(value: T, cols: string[]): void => {
    let currform = formData;
    cols.map((col) => {
      currform = { ...currform, [col]: value };
    });
    setFormData(currform);
  };

  // update event or create new event
  const handleSubmit = async () => {
    const recurringRate = formData.recurring_rate ?? "none";
    if (!editEvent && recurringRate !== "none") {
      const recurrenceEnd = formData.recurrence_end_date ?? "";
      if (!recurrenceEnd.trim()) {
        setError("Please select a recurrence end date for recurring events.");
        DisplayToast("Recurrence end date is required", "error");
        return;
      }
      const startDate = new Date(formData.start_date);
      const endDate = new Date(recurrenceEnd);
      if (endDate < startDate) {
        setError("Recurrence end date must be on or after the event start date.");
        DisplayToast("Invalid recurrence end date", "error");
        return;
      }
    }

    if (formdata && User?.id) {
      const error = await updateEvent(id, formData);
      if (error) {
        setError(error.message);
        DisplayToast("Unable to update event", "error");
      } else {
        onSuccess();
        DisplayToast("Succesfully updated event", "success");
      }
    } else if (User?.id) {
      const error = await createEvent(User, formData);
      if (error) {
        console.log(error);
        setError(error.message);
        DisplayToast("Unable to create event", "error");
      } else {
        form.current?.reset();
        setFormData(getFormDataDefault());
        navigate("/");
        DisplayToast("Succesfully created event", "success");
      }
    }
  };

  return (
    <div className={`w-1/2 flex flex-col m-auto bg-white z-101 ${editEvent ? "mt-5" : "mt-20"}`}>
      {!editEvent && (
        <>
          <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]">
            Create a new Event!
          </h1>
          <p className="font-DM text-xl w-3/4 text-balance text-[#262626] hidden md:block">
            Submit a <strong>New Event</strong> to be displayed on the Bulletin
          </p>
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
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          placeholder="Title"
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
        <label htmlFor="StartTime">
          Start Time (date and time) <span className="text-red-500">*</span>
        </label>
        <div className="border-black border rounded-lg px-3 h-12 flex items-center">
          <input
            type="datetime-local"
            name="StartTime"
            value={formData.start_date}
            required
            onChange={(e) => handleChange(e.target.value, ["start_date", "end_date"])}
          ></input>
        </div>
        <div className="flex items-center gap-1">
          <label htmlFor="EndTime">
            End Time (date and time) <span className="text-red-500">*</span>
          </label>
          <Tooltip
            title={"Event end must be after event start"}
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
        <div className="border-black border rounded-lg px-3 h-12 flex items-center scroll-smooth">
          <input
            type="datetime-local"
            name="EndTime"
            required
            min={formData.start_date}
            value={formData.end_date}
            onChange={(e) => {
              if (new Date(e.target.value).getTime() <= new Date(formData.start_date).getTime()) {
                return;
              }
              handleChange(e.target.value, ["end_date"]);
            }}
          ></input>
        </div>

        {!editEvent && (
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
                  min={formData.start_date?.slice(0, 10)}
                  onChange={(e) => handleChange(e.target.value, ["recurrence_end_date"])}
                />
              </>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-6">
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
          <FormControlLabel
            control={
              <Switch
                checked={formData.internal ?? false}
                onChange={(_, checked) => handleChange(checked, ["internal"])}
                color="primary"
              />
            }
            label="Internal event"
          />
        </div>

        {!(formData.track_attendance ?? false) && (
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

        <label>Event Location</label>
        <Dropdown formData={formData} handleChange={handleChange} />
        {!(formData.internal ?? false) && (
          <>
            <label htmlFor="StartTime">Attendance cap</label>
            <input
              value={formData.attendance_cap}
              className="border-black border rounded-lg px-3 h-12 flex items-center"
              onChange={(e) => handleChange(e.target.value, ["attendance_cap"])}
            />
            <label>Tags</label>
            <MultipleSelectChip formData={formData} handleChange={handleChange} />
            <label>Event Poster</label>
            <input
              name="poster"
              placeholder={profile_picture_src}
              className="border-black border rounded-lg px-3 h-12"
              value={formData.poster}
              onChange={(e) => setFormData({ ...formData, ["poster"]: e.target.value })}
              autoFocus
            />
            {formData.poster && <img src={formData.poster} alt="" className="rounded-2xl" />}
          </>
        )}
        <Editor content={formData.content} setEditorContent={(e) => handleChange(e, ["content"])} />
        <button
          type="submit"
          className="bg-[#6A97BD] border border-[#6A97BD] text-white w-fit rounded-lg px-5 cursor-pointer"
        >
          {editEvent ? "Edit Event" : "Submit New Event"}
        </button>
      </form>
    </div>
  );
}
