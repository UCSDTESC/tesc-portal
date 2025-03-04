import { FormEvent, useEffect, useRef, useState } from "react";
import supabase from "./supabase/supabase";
import { useNavigate } from "react-router";
import DataTable from "./DataTable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
export default function User() {
  const [user, setUser] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data.user?.id) {
        setUser(data.user.id.toString());
      }
      if (error) {
        console.log(error.message);
      }
    };
    fetchUser();
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut().then(
      () => {
        navigate("/LogIn");
      },
      (error) => {
        console.log(error);
      }
    );
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    await supabase
      .from("Events")
      .insert({
        UID: user,
        Title: event.target[0].value,
        Date: event.target[1].value,
        location: event.target[2].value,
        Content: event.target[3].value
      })
      .then(
        () => {
          console.log("Data inserted successfully");
        },
        (error) => {
          console.log(error);
        }
      );
  };
  return (
    <>
      {user && (
        <div className="w-full flex justify-center items-center flex-col p-5">
          {/* header */}
          <span className="w-full h-[10vh] bg-green-200 text-[3vh] flex justify-between items-center px-10 absolute top-0">
            Logged in: {user}
            <button
              className="rounded-lg border border-black px-5 cursor-pointer h-1/2 right-10 bg-red-400 hover:bg-red-500"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </span>

          <form
            className="border border-black p-5 flex flex-col gap-5 w-1/2 h-[50vh] max-w-[800px] mt-[20vh]"
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
            <div className="border-black border rounded-lg px-3 h-12">
              <DatePicker
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

            <input
              name="Location"
              placeholder="Location"
              className="border-black border rounded-lg h-fit  overflow-y-auto p-3"
              autoFocus
            ></input>
            <textarea
              name="content"
              placeholder="content"
              className="border-black border rounded-lg min-h-1/3 overflow-y-auto p-3"
              autoFocus
            ></textarea>

            <button
              type="submit"
              className="border border-black bg-red-400 hover:bg-red-500 w-fit rounded-lg px-5 cursor-pointer"
            >
              Submit
            </button>
          </form>
          <DataTable userID={user} />
        </div>
      )}
      {!user && <div className="">Not Logged in!!!</div>}
    </>
  );
}
