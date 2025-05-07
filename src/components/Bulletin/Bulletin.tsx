import { useContext, useState } from "react";
import { useParams } from "react-router";

import UserContext from "@lib/UserContext";

import { BulletinContext, useBulletin } from "@lib/hooks/useBulletin";

import CheckBoxes from "./CheckBoxes";
import { EventsList } from "./EventsList";
import EventDisplay from "./EventDisplay";

export default function Bulletin() {
  const { User } = useContext(UserContext);
  const postId = useParams();
  const [selection, setSelection] = useState<number>(Number(postId.postId));
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
    setSortMethod,
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
        setSortMethod,
      }}
    >
      <div className="grid w-full grid-cols-[330px_1fr] min-h-[80vh] max-h-screen grid-rows-[auto_1fr]">
        <div className="col-span-2 bg-linear-to-r from-0% from-blue via-70% via-[#3B7DB6] to-blue">
          <CheckBoxes />
        </div>
        <div className="grid grid-rows-[repeat(auto-fill,100px)] overflow-y-auto bg-gray-200 ">
          <EventsList {...{ setSelection }} />
        </div>
        <div className="flex justify-center p-2">
          <EventDisplay selection={selection} />
        </div>
      </div>
    </BulletinContext.Provider>
  );
}
