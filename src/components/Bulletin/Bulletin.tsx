import { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";

import UserContext from "@lib/UserContext";

import { BulletinContext, useBulletin } from "@lib/hooks/useBulletin";
import { useEditModal } from "@lib/hooks/useEditModal";
import { formdata } from "@lib/constants";
import { FaArrowRightToBracket } from "react-icons/fa6";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import CheckBoxes from "./CheckBoxes";
import { EventsList } from "./EventsList";
import BulletinDisplay from "./BulletinDisplay";
import Form from "../adminUser/Form/Form";

type EventTimeFilter = "current" | "past";

export default function Bulletin() {
  const { User } = useContext(UserContext);
  const postId = useParams();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<string>(String(postId.postId));
  const [displaysideBar, setDisplaySideBar] = useState(true);
  const [eventTimeFilter, setEventTimeFilter] = useState<EventTimeFilter>("current");
  const {
    data,
    People,
    isLoading,
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
    internalFilter,
    setInternalFilter,
    sortMethod,
    setSortMethod,
    fetchData,
  } = useBulletin(User);
  const { showEditModal, setShowEditModal, curID, currEdit, openEditModal } = useEditModal();

  // Sync selection with URL when navigating (e.g. direct link, browser back/forward)
  useEffect(() => {
    const id = String(postId.postId ?? "-1");
    setSelection(id);
  }, [postId.postId]);

  // Auto-select Current/Past tab when loading an event from URL so it displays correctly
  useEffect(() => {
    if (User?.role === "company" || !data) return;
    const eventId = postId.postId;
    if (!eventId || eventId === "-1") return;
    const event = data.find((e) => String(e.id) === String(eventId));
    if (event) {
      const endTime = new Date(event.end_date).getTime();
      const isCurrent = endTime >= Date.now();
      setEventTimeFilter(isCurrent ? "current" : "past");
    }
  }, [data, postId.postId, User?.role]);

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
        isLoading,
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
        internalFilter,
        setInternalFilter,
        sortMethod,
        setSortMethod,
        eventTimeFilter,
        openEditModal,
        showEditModal,
        setShowEditModal,
      }}
    >
      <div className="grid w-full  h-[calc(100vh-3.5rem)] grid-rows-[3.5rem_1fr] font-DM">
        <div className="bg-linear-to-r from-0% from-blue via-70% via-[#3B7DB6] to-blue flex min-h-[2.25rem] items-center gap-3 [&>*]:min-h-[2.25rem]">
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
                    onClick={() => {
                      if (eventTimeFilter !== "current") {
                        setEventTimeFilter("current");
                        setSelection("-1");
                        navigate("/bulletin/-1");
                      }
                    }}
                    className="relative z-10 flex flex-1 items-center justify-center rounded-full py-1.5 text-sm font-medium transition-colors duration-200 text-slate-600 hover:text-slate-900"
                    style={{
                      color: eventTimeFilter === "current" ? "white" : undefined,
                    }}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (eventTimeFilter !== "past") {
                        setEventTimeFilter("past");
                        setSelection("-1");
                        navigate("/bulletin/-1");
                      }
                    }}
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
      {showEditModal &&
        createPortal(
          <BulletinEditModal
            setShowEditModal={setShowEditModal}
            fetchData={fetchData}
            currEdit={currEdit}
            curID={curID}
          />,
          document.body,
        )}
    </BulletinContext.Provider>
  );
}

function BulletinEditModal({
  setShowEditModal,
  fetchData,
  currEdit,
  curID,
}: {
  setShowEditModal: (show: boolean) => void;
  fetchData: () => void;
  currEdit: formdata;
  curID: string;
}) {
  return (
    <div className="w-screen h-screen fixed top-0 flex justify-center items-center z-100 overflow-scroll">
      <div
        className="fixed top-0 w-full h-full bg-black opacity-35 cursor-pointer"
        onClick={() => setShowEditModal(false)}
      />
      <Form
        formdata={currEdit}
        id={curID}
        onSuccess={() => {
          setShowEditModal(false);
          fetchData();
        }}
        editEvent={true}
      />
    </div>
  );
}
