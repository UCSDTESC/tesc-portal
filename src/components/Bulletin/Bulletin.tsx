import { useContext, useMemo, useState } from "react";
import { useParams } from "react-router";

import UserContext from "@lib/UserContext";

import { BulletinContext, useBulletin } from "@lib/hooks/useBulletin";
import { FaArrowRightToBracket } from "react-icons/fa6";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import CheckBoxes from "./CheckBoxes";
import { EventsList } from "./EventsList";
import BulletinDisplay from "./BulletinDisplay";

type EventTimeFilter = "current" | "past";

export default function Bulletin() {
  const { User } = useContext(UserContext);
  const postId = useParams();
  const [selection, setSelection] = useState<string>(String(postId.postId));
  const [displaysideBar, setDisplaySideBar] = useState(true);
  const [eventTimeFilter, setEventTimeFilter] = useState<EventTimeFilter>("current");
  const {
    data,
    People,
    gradYears,
    tagFilters,
    RSVP,
    attendance,
    handleAttendance,
    handleRSVP,
    setTagFilters,
    setSearch,
    orgFilters,
    setOrgFilters,
    orgs,
    sortMethod,
    setSortMethod,
  } = useBulletin(User);

  const filteredData = useMemo(() => {
    if (!data || User?.role === "company") return data;
    const now = Date.now();
    return data.filter((event) => {
      const endTime = new Date(event.end_date).getTime();
      return eventTimeFilter === "current" ? endTime >= now : endTime < now;
    });
  }, [data, eventTimeFilter, User?.role]);

  return (
    <BulletinContext.Provider
      value={{
        data: filteredData,
        gradYears,
        People,
        tagFilters,
        RSVP,
        attendance,
        handleAttendance,
        handleRSVP,
        setTagFilters,
        setSearch,
        orgFilters,
        setOrgFilters,
        orgs,
        sortMethod,
        setSortMethod,
        eventTimeFilter,
      }}
    >
      <div className="grid w-full  h-[calc(100vh-3.5rem)] grid-rows-[3.5rem_1fr] font-DM">
        <div className="bg-linear-to-r from-0% from-blue via-70% via-[#3B7DB6] to-blue flex items-center gap-3 px-2">
          <CheckBoxes />
        </div>
        <div className="flex w-full h-full flex-row relative">
          <div
            className={`flex w-[300px] flex-col h-[calc(100vh-7rem)] bg-gray-200 absolute z-99 opacity-95 md:relative ${
              displaysideBar == true ? "block" : "hidden"
            }`}
          >
            <FaArrowRightFromBracket
              className="rotate-180 ml-auto w-[3.5rem] text-[20px] mr-2 mt-2 text-gray shrink-0 md:hidden"
              onClick={() => setDisplaySideBar(false)}
            />
            {User?.role !== "company" && (
              <div className="flex shrink-0 justify-center p-2">
                <div className="relative flex w-full max-w-[200px] items-center rounded-full bg-white/80 p-0.5 shadow-sm">
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-full bg-blue shadow-sm transition-transform duration-200 ease-out"
                    style={{
                      width: "calc(50% - 4px)",
                      left: "2px",
                      transform:
                        eventTimeFilter === "current" ? "translateX(0)" : "translateX(100%)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEventTimeFilter("current")}
                    className="relative z-10 flex flex-1 items-center justify-center rounded-full py-1.5 text-sm font-medium transition-colors duration-200 text-slate-600 hover:text-slate-900"
                    style={{
                      color: eventTimeFilter === "current" ? "white" : undefined,
                    }}
                  >
                    Current
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventTimeFilter("past")}
                    className="relative z-10 flex flex-1 items-center justify-center rounded-full py-1.5 text-sm font-medium transition-colors duration-200 text-slate-600 hover:text-slate-900"
                    style={{
                      color: eventTimeFilter === "past" ? "white" : undefined,
                    }}
                  >
                    Past
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-rows-[repeat(auto-fill,100px)]">
              <EventsList {...{ setSelection, selection }} />
            </div>
          </div>
          {!displaysideBar && (
            <FaArrowRightToBracket
              className="text-[20px] absolute top-1/2 left-2 text-black opacity-80"
              onClick={() => setDisplaySideBar(true)}
            />
          )}
          <div className="flex w-full justify-center p-2 overflow-y-scroll h-[calc(100vh-7rem)]">
            <BulletinDisplay selection={selection} />
          </div>
        </div>
      </div>
    </BulletinContext.Provider>
  );
}
