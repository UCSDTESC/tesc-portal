import { useContext, useEffect, useMemo, useState } from "react";
import supabase from "../supabase/supabase";
import Editor from "./Editor";
import { useNavigate, useParams } from "react-router";
import UserContext from "./../UserContext";
export default function Bulletin() {
  const { User, setShowLoginModal } = useContext(UserContext);
  const [data, setData] = useState<
    {
      id: number;
      UID: string;
      created_at: string;
      title: string;
      content: string;
      location: string;
      location_str: string;
      start_date: string;
      end_date: string;
    }[]
  >();
  const postId = useParams();
  const [selection, setSelection] = useState<number>(Number(postId.postId));
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [RSVP, setRSVP] = useState<number[]>([]);
  const filtered = useMemo(() => {
    return search
      ? data?.filter((daton) => daton.title.toLowerCase().includes(search))
      : data;
  }, [search, data]);

  useEffect(() => {
    console.log("fetching data");
    const fetch = async () => {
      const { data, error } = await supabase
        .from("Events")
        .select()
        .order("created_at", { ascending: false });
      if (data) {
        setData(data);
      } else {
        console.log(error);
      }
      if (User?.id) {
        const { data, error } = await supabase
          .from("Users")
          .select("rsvp")
          .eq("email", User.email);
        if (data) {
          // console.log("rsvp: ", data[0].rsvp);
          setRSVP(data[0].rsvp);
          console.log(data[0].rsvp);
        }
        if (error) {
          console.log(error);
        }
      }
    };
    fetch();
  }, [User]);

  const formatDate = (date: string) => {
    return date.replaceAll(":", "").replaceAll("-", "").split("+")[0];
  };

  const handleRSVP = async (id: number, remove: boolean) => {
    let currRSVP = RSVP;
    if (!User?.id) {
      setShowLoginModal(true);
    } else {
      if (remove) {
        currRSVP = currRSVP.filter((item) => item !== id);
      } else {
        currRSVP = [...currRSVP, id];
      }
      const { error } = await supabase
        .from("Users")
        .update({ rsvp: currRSVP })
        .eq("email", User.email);

      if (error) {
        console.log(error);
      } else {
        const { data, error } = await supabase
          .from("Events")
          .select("rsvp")
          .eq("id", id);
        if (data) {
          const { error } = await supabase
            .from("Events")
            .update({ rsvp: remove ? data[0].rsvp - 1 : data[0].rsvp + 1 })
            .eq("id", id);
          if (error) {
            console.log(error);
          } else {
            setRSVP(currRSVP);
          }
        }
        if (error) {
          console.log(error);
        }
      }
    }
  };
  return (
    <div className="w-full flex justify-center mt-10">
      <div className="grid w-[80%] border border-black border-spacing-1 grid-cols-[200px_1fr] min-h-[80vh]  grid-rows-[auto_1fr] my-20">
        <div className="col-span-2">
          <form action="" className="p-3">
            <input
              type="Search"
              placeholder="Search"
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className=" border rounded-standard p-1 focus:outline-none"
            />
          </form>
        </div>
        <div className="grid grid-rows-[repeat(auto-fill,100px)] border-t border-black overflow-y-auto ">
          {filtered?.map((daton) => {
            return (
              <button
                className=" cursor-pointer flex flex-col p-1 h-full"
                onClick={() => {
                  navigate(`/bulletin/${daton.id}`);
                  setSelection(daton.id);
                }}
              >
                <div className="border  border-black h-full w-full p-1 rounded-standard bg-lightBlue">
                  <div className="font-bold w-max">{daton.title}</div>
                  <span className="line-clamp-3 w-max">
                    posted: {new Date(daton.created_at).toDateString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="border-l border-t border-black flex justify-center">
          <div className="w-[90%] p-10">
            <div className="">
              {data?.map((daton) => {
                if (daton.id === selection)
                  return (
                    <span className="">
                      <h1 className="font-bold text-[30px]">
                        {daton.title} -&nbsp;
                        {new Date(daton.created_at).toUTCString()}
                      </h1>
                      <div className="">
                        Start Date:&nbsp;
                        {new Date(daton.start_date).toUTCString()}
                      </div>
                      <div className="">
                        End Date: &nbsp;
                        {new Date(daton.end_date).toUTCString()}
                      </div>
                      {daton.location_str && (
                        <div className="">
                          location: &nbsp;
                          {daton.location_str} |{" "}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${daton.location_str
                              .replace(" ", "+")
                              .replace(",", "%2C")}&travelmode=walking`}
                            className=" hover:underline decoration-auto"
                          >
                            directions
                          </a>
                        </div>
                      )}

                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${daton.title.replace(
                          " ",
                          "+"
                        )}&details=More+details+see:+${
                          window.location.href
                        }&location=${daton.location_str}&dates=${formatDate(
                          daton.start_date
                        )}/${formatDate(daton.end_date)}&ctz=America/Los_Angeles
`}
                        className="hover:underline decoration-auto"
                      >
                        Add to Calendar
                      </a>
                      <div className="">
                        {new Date() < new Date(daton.start_date) &&
                          !RSVP.includes(daton.id) && (
                            <button
                              className="border px-4 py-2 rounded-lg cursor-pointer"
                              onClick={() => {
                                handleRSVP(daton.id, false);
                              }}
                            >
                              RSVP
                            </button>
                          )}
                        {new Date() < new Date(daton.start_date) &&
                          RSVP.includes(daton.id) && (
                            <button
                              className="border px-4 py-2 rounded-lg cursor-pointer"
                              onClick={() => {
                                handleRSVP(daton.id, true);
                              }}
                            >
                              Remove RSVP
                            </button>
                          )}
                        {new Date() >= new Date(daton.start_date) &&
                          new Date() <= new Date(daton.end_date) && (
                            <button className="border px-4 py-2 rounded-lg cursor-pointer">
                              Mark attendance
                            </button>
                          )}
                      </div>

                      <Editor content={daton.content}></Editor>
                    </span>
                  );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
