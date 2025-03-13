import GoogleMap, { PlaceAutocomplete } from "./Map";
import { APIProvider } from "@vis.gl/react-google-maps";
import { FormEvent, useRef, useState } from "react";
import supabase from "../supabase/supabase";
import { useContext } from "react";
import UserContext from "../UserContext";
import Editor from "./Editor";
import { useNavigate } from "react-router";
console.log(
  new Date(
    new Date()
      .toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
      .toString()
  ).toISOString()
);
const currTime = new Date(Date.now())
  .toISOString()
  .split(":")
  .slice(0, 2)
  .toString()
  .replace(",", ":");
export default function Form() {
  const form = useRef<HTMLFormElement>(null);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const { User } = useContext(UserContext);
  const navigate = useNavigate();
  const [StartDate, setStartDate] = useState(currTime);
  const [EndDate, setEndDate] = useState(currTime);
  const [error, setError] = useState("");
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const location = [
      selectedPlace?.geometry?.location?.lat(),
      selectedPlace?.geometry?.location?.lng()
    ];

    const { error } = await supabase.from("Events").insert({
      UID: User,
      Title: data.title,
      Start_Date: data.StartTime,
      End_Date: data.EndTime,
      Location: location,
      Location_Str: data.location,
      Content: editorContent
    });
    if (error) {
      setError(error.message);
    } else {
      navigate("/User/");
    }
  };

  return (
    <div className="w-1/2 flex mt-[15vh] ">
      <form
        className="border border-black p-5 flex flex-col gap-2 w-full h-min"
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
          form.current?.reset();
        }}
      >
        <p className="text-red-500">{error}</p>

        <label htmlFor="title">Title: </label>
        <input
          name="title"
          placeholder="Title"
          className="border-black border rounded-lg px-3 h-12"
          autoFocus
          required
        ></input>
        <label htmlFor="StartTime">Start Time (date and time):</label>
        <div className="border-black border rounded-lg px-3 h-12 flex items-center">
          <input
            type="datetime-local"
            name="StartTime"
            min={currTime}
            value={StartDate}
            required
            onChange={(e) => {
              setStartDate(e.target.value);
              setEndDate(e.target.value);
            }}
          ></input>
        </div>
        <label htmlFor="EndTime">End Time (date and time): </label>
        <div className="border-black border rounded-lg px-3 h-12 flex items-center scroll-smooth">
          <input
            type="datetime-local"
            name="EndTime"
            required
            min={StartDate}
            value={EndDate}
            onChange={(e) => {
              if (e.target.value < StartDate) {
                return;
              } else {
                setEndDate(e.target.value);
              }
            }}
          ></input>
        </div>

        <label>Location: </label>
        <APIProvider
          apiKey={import.meta.env.VITE_MAPS_API}
          solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
        >
          <PlaceAutocomplete onPlaceSelect={setSelectedPlace} />
        </APIProvider>
        <GoogleMap selectedPlace={selectedPlace}></GoogleMap>

        <Editor setEditorContent={setEditorContent} />
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
