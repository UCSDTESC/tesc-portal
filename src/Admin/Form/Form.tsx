// import GoogleMap, { PlaceAutocomplete } from "./Map";
// import { APIProvider } from "@vis.gl/react-google-maps";
import { useRef, useState } from "react";
import supabase from "../../supabase/supabase";
import { useContext } from "react";
import UserContext from "../../UserContext";
import Editor from "./Editor";
import { useNavigate } from "react-router";
import { MultipleSelectChip, Dropdown } from "./Dropdowns";
const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
const localISOString = new Date(Date.now() - tzoffset)
  .toISOString()
  .slice(0, -1);

// convert to YYYY-MM-DDTHH:MM
const currTime = localISOString.substring(
  0,
  ((localISOString.indexOf("T") | 0) + 6) | 0
);
export interface formdata {
  title: string;
  start_date: string;
  end_date: string;
  location: number[];
  location_str: string;
  content: string;
  password: string;
  tags: string[];
}

export default function Form({
  formdata,
  id,
  onSuccess,
}: {
  formdata?: formdata;
  id: number;
  onSuccess: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const { User } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<formdata>(
    formdata
      ? formdata
      : {
          title: "",
          password: "",
          start_date: currTime,
          end_date: currTime,
          location: [0, 0],
          location_str: "",
          content: "",
          tags: [],
        }
  );
  const handleChange = <T,>(value: T, cols: string[]): void => {
    let currform = formData;
    cols.map((col) => {
      currform = { ...currform, [col]: value };
    });
    setFormData(currform);
  };

  const handleSubmit = async () => {
    if (formdata) {
      const { error } = await supabase
        .from("Events")
        .update({
          UID: User?.id,
          title: formData.title,
          password: formData.password,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          location_str: formData.location_str,
          content: formData.content,
        })
        .eq("id", id);
      if (error) {
        setError(error.message);
      } else {
        onSuccess();
      }
    } else {
      const { error } = await supabase.from("Events").insert({
        UID: User?.id,
        title: formData.title,
        password: formData.password,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location,
        location_str: formData.location_str,
        content: formData.content,
      });
      if (error) {
        setError(error.message);
      } else {
        form.current?.reset();
        setFormData({
          title: "",
          password: "",
          start_date: currTime,
          end_date: currTime,
          location: [0, 0],
          location_str: "",
          content: "",
          tags: [],
        });
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
            min={formdata ? "" : currTime}
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
        {/* <APIProvider
          apiKey={import.meta.env.VITE_MAPS_API}
          solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
        >
          <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
        </APIProvider>
        <GoogleMap selectedPlace={selectedPlace}></GoogleMap> */}
        {/* <input
          name="location"
          placeholder="location"
          className="border-black border rounded-lg px-3 h-12"
          autoFocus
          required
          value={formData.location_str}
          onChange={(e) => {
            handleChange(e.target.value, ["location_str"]);
          }}
        ></input> */}
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
