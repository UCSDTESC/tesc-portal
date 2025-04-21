import { useRef, useState } from "react";
import { useContext } from "react";
import UserContext from "../../../UserContext";
import Editor from "./Editor";
import { useNavigate } from "react-router";
import { MultipleSelectChip, Dropdown } from "./Dropdowns";
import { formdata } from "../../../lib/constants";
import { createEvent, updateEvent } from "../../../services/event";
import { getCurrentTime, getFormDataDefault } from "../../../lib/utils";

// TODO: refactor label and input components into an individual component
export default function Form({
  formdata,
  id,
  onSuccess
}: {
  formdata?: formdata;
  id: number;
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
      } else {
        onSuccess();
      }
    } else if (User?.id) {
      const error = await createEvent(User?.id, formData);
      if (error) {
        setError(error.message);
      } else {
        form.current?.reset();
        setFormData(getFormDataDefault());
        navigate("/");
      }
    }
  };

  return (
    <div className="w-1/2 flex m-auto bg-white z-101">
      <form
        className="border border-black p-5 flex flex-col gap-2 w-full h-min"
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <p className="text-red-500">{error}</p>

        <label htmlFor="title">Title: </label>
        <input
          name="title"
          placeholder="Title"
          className="border-black border rounded-lg px-3 h-12"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, ["title"]: e.target.value });
          }}
          autoFocus
          required
        />
        <label htmlFor="Password">Password: </label>
        <input
          name="Password"
          placeholder="Password"
          className="border-black border rounded-lg px-3 h-12"
          value={formData.password}
          onChange={(e) => {
            handleChange(e.target.value, ["password"]);
          }}
          autoFocus
          required
        />
        <label htmlFor="StartTime">Start Time (date and time):</label>
        <div className="border-black border rounded-lg px-3 h-12 flex items-center">
          <input
            type="datetime-local"
            name="StartTime"
            min={formdata ? "" : getCurrentTime()}
            value={formData.start_date}
            required
            onChange={(e) => {
              handleChange(e.target.value, ["start_date", "end_date"]);
            }}
          ></input>
        </div>
        <label htmlFor="EndTime">End Time (date and time): </label>
        <div className="border-black border rounded-lg px-3 h-12 flex items-center scroll-smooth">
          <input
            type="datetime-local"
            name="EndTime"
            required
            min={formData.start_date}
            value={formData.end_date}
            onChange={(e) => {
              if (e.target.value < formData.start_date) {
                return;
              } else {
                handleChange(e.target.value, ["end_date"]);
              }
            }}
          ></input>
        </div>

        <label>Location: </label>
        <Dropdown formData={formData} handleChange={handleChange} />
        <label>Tags: </label>
        <MultipleSelectChip formData={formData} handleChange={handleChange} />
        <Editor
          content={formData.content}
          setEditorContent={(e) => {
            handleChange(e, ["content"]);
          }}
        />
        <button
          type="submit"
          className="border border-black bg-red-400 hover:bg-red-500 w-fit rounded-lg px-5 cursor-pointer"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
