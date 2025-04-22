import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router";

import UserContext from "@lib/UserContext";
import { tags } from "@lib/constants";
import { formatDate } from "@lib/utils";

import Editor from "./Editor";
import { useBulletin } from "@lib/hooks/useBulletin";
import { Event } from "@lib/constants";
// TODO: useBulletin custom hook
// TODO: refactor individualised components to shorten return statement
// TODO: refactor arrow functions into individual functions
// TODO: replace mark attendance / rsvp spaghetti code into ternary operators
export default function Bulletin() {
  const { User } = useContext(UserContext);
  const postId = useParams();
  const [selection, setSelection] = useState<number>(Number(postId));
  const {
    data,
    tagFilters,
    RSVP,
    attendance,
    handleAttendance,
    handleRSVP,
    setTagFilters,
    setSearch,
    orgFilters,
    setOrgFilters,
    orgs
  } = useBulletin(User);
  return (
    <div className="grid w-[80%] border border-black border-spacing-1 grid-cols-[200px_1fr] min-h-[80vh]  grid-rows-[auto_1fr]">
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
          <div className="flex flex-row gap-3">
            <div>
              <TagsCheckboxes {...{ tagFilters, setTagFilters }} />
            </div>
            <div className="max-h-[10rem] overflow-scroll">
              <OrgsCheckboxes {...{ orgs, orgFilters, setOrgFilters }} />
            </div>
          </div>
        </form>
      </div>
      <div className="grid grid-rows-[repeat(auto-fill,100px)] border-t border-black overflow-y-auto ">
        <EventsList {...{ data, setSelection }} />
      </div>
      <div className="border-l border-t border-black flex justify-center p-10">
        {data?.map((daton) => {
          if (daton.id === selection)
            return (
              <span className="w-full flex flex-col">
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
                  )}&details=More+details+see:+${window.location.href}&location=${
                    daton.location_str
                  }&dates=${formatDate(daton.start_date)}/${formatDate(
                    daton.end_date
                  )}&ctz=America/Los_Angeles`}
                  className="hover:underline decoration-auto"
                >
                  Add to Calendar
                </a>

                {new Date() < new Date(daton.start_date) && !RSVP.includes(daton.id) && (
                  <button
                    className="border px-4 py-2 rounded-lg cursor-pointer"
                    onClick={() => handleRSVP(daton.id, false)}
                  >
                    RSVP
                  </button>
                )}
                {new Date() < new Date(daton.start_date) && RSVP.includes(daton.id) && (
                  <button
                    className="border px-4 py-2 rounded-lg cursor-pointer"
                    onClick={() => handleRSVP(daton.id, true)}
                  >
                    Remove RSVP
                  </button>
                )}
                {new Date() >= new Date(daton.start_date) &&
                  new Date() <= new Date(daton.end_date) &&
                  !attendance.includes(daton.id) && (
                    <button
                      className="border px-4 py-2 rounded-lg cursor-pointer"
                      onClick={() => handleAttendance(false, selection)}
                    >
                      Mark attendance
                    </button>
                  )}
                {new Date() >= new Date(daton.start_date) &&
                  new Date() <= new Date(daton.end_date) &&
                  attendance.includes(daton.id) && (
                    <button
                      className="border px-4 py-2 rounded-lg cursor-pointer"
                      onClick={() => handleAttendance(true, selection)}
                    >
                      Remove Attendance
                    </button>
                  )}

                <Editor content={daton.content}></Editor>
              </span>
            );
        })}
      </div>
    </div>
  );
}

function TagsCheckboxes({
  tagFilters,
  setTagFilters
}: {
  tagFilters: string[];
  setTagFilters: (tagFilters: string[]) => void;
}) {
  return (
    <>
      {tags.map((tag: string) => {
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={tag}
              onChange={(e) => {
                if (e.target.checked) {
                  setTagFilters([...tagFilters, tag]);
                } else {
                  setTagFilters(tagFilters.filter((t) => t !== tag));
                }
              }}
            />
            <label htmlFor={tag} className="ml-2">
              {tag}
            </label>
          </div>
        );
      })}
    </>
  );
}

function OrgsCheckboxes({
  orgs,
  orgFilters,
  setOrgFilters
}: {
  orgs: string[];
  orgFilters: string[];
  setOrgFilters: (orgFilters: string[]) => void;
}) {
  return (
    <>
      {orgs.map((org: string) => {
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={org}
              onChange={(e) => {
                if (e.target.checked) {
                  setOrgFilters([...orgFilters, org]);
                } else {
                  setOrgFilters(orgFilters.filter((t) => t !== org));
                }
              }}
            />
            <label htmlFor={org} className="ml-2">
              {org}
            </label>
          </div>
        );
      })}
    </>
  );
}

function EventsList({
  data,
  setSelection
}: {
  data: Event[] | undefined;
  setSelection: (id: number) => void;
}) {
  const navigate = useNavigate();
  return (
    <>
      {data?.map((daton) => {
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
    </>
  );
}
