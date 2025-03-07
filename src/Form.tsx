import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import GoogleMap, { PlaceAutocomplete } from "./Map";
import { APIProvider } from "@vis.gl/react-google-maps";
import { FormEvent, useRef, useState } from "react";
import supabase from "./supabase/supabase";
import { useContext } from "react";
import UserContext from "./UserContext";
import Editor from "./Editor";
export default function Form() {
  const form = useRef<HTMLFormElement>(null);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [editorContent, setEditorContent] = useState("");
  const { User } = useContext(UserContext);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log(data);
    console.log();
    const location = [
      selectedPlace?.geometry?.location?.lat(),
      selectedPlace?.geometry?.location?.lng()
    ];
    console.log(editorContent);
    const { error } = await supabase.from("Events").insert({
      UID: User,
      Title: data.title,
      Date: data.date,
      Location: location,
      Location_Str: data.location,
      Content: editorContent
    });
    if (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-1/2 flex mt-[15vh] ">
      <form
        className="border border-black p-5 flex flex-col gap-5 w-full h-min"
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
          form.current?.reset();
          setStartDate(new Date());
        }}
      >
        <input
          name="title"
          placeholder="title"
          className="border-black border rounded-lg px-3 h-12"
          autoFocus
        ></input>
        <div className="border-black border rounded-lg px-3 h-12 flex items-center">
          <DatePicker
            className="focus:outline-none "
            name="date"
            selected={startDate}
            onChange={(date) => {
              if (date) {
                setStartDate(date);
              }
            }}
            showTimeSelect
            dateFormat="Pp"
          />
        </div>
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
      <form className=" flex "></form>
    </div>
  );
}
