import { useContext, useState } from "react";
import { useParams } from "react-router";

import UserContext from "@lib/UserContext";

import { BulletinContext, useBulletin } from "@lib/hooks/useBulletin";
import { FaArrowRightToBracket } from "react-icons/fa6";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import CheckBoxes from "./CheckBoxes";
import { EventsList } from "./EventsList";
import EventDisplay from "./EventDisplay";

export default function Bulletin() {
  const { User } = useContext(UserContext);
  const postId = useParams();
  const [selection, setSelection] = useState<number>(Number(postId.postId));
  const [displaysideBar, setDisplaySideBar] = useState(true);
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
    orgs,
    sortMethod,
    setSortMethod
  } = useBulletin(User);
  return (
    <BulletinContext.Provider
      value={{
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
        orgs,
        sortMethod,
        setSortMethod
      }}
    >
      <div className="grid w-full  h-[calc(100vh-3.5rem)] grid-rows-[3.5rem_1fr]">
        <div className=" bg-linear-to-r from-0% from-blue via-70% via-[#3B7DB6] to-blue">
          <CheckBoxes />
        </div>
        <div className="flex w-full h-full flex-row relative">
          <div
            className={`grid w-[200px] grid-rows-[40px_repeat(auto-fill,100px)] h-[calc(100vh-7rem)] overflow-y-scroll bg-gray-200  absolute z-99 opacity-95 md:relative md:grid-rows-[repeat(auto-fill,100px)] ${
              displaysideBar == true ? "block" : "hidden"
            }`}
          >
            <FaArrowRightFromBracket
              className="rotate-180 ml-auto w-[3.5rem] text-[20px] mr-2 mt-2 text-gray md:hidden"
              onClick={() => setDisplaySideBar(false)}
            />
            <EventsList {...{ setSelection }} />
          </div>
          {!displaysideBar && (
            <FaArrowRightToBracket
              className="text-[20px] absolute top-1/2 left-2 text-black opacity-80"
              onClick={() => setDisplaySideBar(true)}
            />
          )}
          <div className="flex w-full justify-center p-2 overflow-y-scroll h-[calc(100vh-7rem)]">
            <EventDisplay selection={selection} />
          </div>
        </div>
      </div>
    </BulletinContext.Provider>
  );
}
