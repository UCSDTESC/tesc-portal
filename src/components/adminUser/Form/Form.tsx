import { useRef, useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { formdata } from "@lib/constants";
import { getFormDataDefault } from "@lib/utils";
import { createEvent, updateEvent } from "@services/event";

import Editor from "./Editor";
import { MultipleSelectChip, Dropdown } from "./Dropdowns";
import DisplayToast from "@lib/hooks/useToast";
import { Tooltip } from "@mui/material";
import { IoInformationCircleOutline } from "react-icons/io5";

// TODO: refactor label and input components into an individual component
export default function Form({
  formdata,
  id,
  editEvent = false,
  onSuccess,
}: {
  formdata?: formdata;
  id: number;
  editEvent?: boolean;
  onSuccess: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const { User } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<formdata>(formdata ? formdata : getFormDataDefault());

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
    if (formdata && User?.id) {
      const error = await updateEvent(id, User.id, formData);
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
    <div className="w-1/2 mt-20 flex flex-col m-auto bg-white z-101">
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

        <label htmlFor="title">Event Title </label>
        <input
          name="title"
          placeholder="Title"
          className="border-black border rounded-lg px-3 h-12"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, ["title"]: e.target.value })}
          autoFocus
          required
        />
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
        <label htmlFor="StartTime">Start Time (date and time)</label>
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
          <label htmlFor="EndTime">End Time (date and time)</label>
          <Tooltip
            title={"Event end must be in the future and also after event start"}
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
            min={Math.max(new Date(formData.start_date).getTime(), Date.now())}
            value={formData.end_date}
            onChange={(e) => {
              if (
                new Date(e.target.value).getTime() <
                Math.max(new Date(formData.start_date).getTime(), Date.now())
              ) {
                return;
              } else {
                handleChange(e.target.value, ["end_date"]);
              }
            }}
          ></input>
        </div>

        <label>Event Location</label>
        <Dropdown formData={formData} handleChange={handleChange} />
        <label>Tags</label>
        <MultipleSelectChip formData={formData} handleChange={handleChange} />
        <label>Event Poster</label>
        <input
          name="poster"
          placeholder="https://www.placeholderImage.png"
          className="border-black border rounded-lg px-3 h-12"
          value={formData.poster}
          onChange={(e) => setFormData({ ...formData, ["poster"]: e.target.value })}
          autoFocus
        />
        {formData.poster && <img src={formData.poster} alt="" className="rounded-2xl" />}
        <Editor content={formData.content} setEditorContent={(e) => handleChange(e, ["content"])} />
        <button
          type="submit"
          className="bg-[#6A97BD] border border-[#6A97BD] text-white w-fit rounded-lg px-5 cursor-pointer"
        >
          Submit New Event
        </button>
      </form>
    </div>
  );
}
