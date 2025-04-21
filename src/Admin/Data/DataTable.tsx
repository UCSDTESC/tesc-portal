import { useContext, useEffect, useState } from "react";
import UserContext from "../../UserContext";
import { EditorProvider } from "@tiptap/react";
import { extensions } from "../Form/EditorExtensions";
import { createPortal } from "react-dom";
import Form from "../Form/Form";
import { DateParser, toISO } from "../../lib/utils";
import { Event, eventFormDataDefault, formdata } from "../../lib/constants";
import { deleteEvent, fetchEventByOrg } from "../../services/event";

export default function DataTable() {
  const { User } = useContext(UserContext);
  const [data, setData] = useState<Event[] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [curID, setCurrID] = useState(0);
  const [currEdit, setCurrEdit] = useState<formdata>(eventFormDataDefault);

  // fetch events posted by user
  useEffect(() => {
    if (!User) {
      return;
    }
    const fetchData = async () => {
      const { data, error } = await fetchEventByOrg(User.id);
      if (data) {
        setData(data);
      } else if (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [User, showEditModal]);

  // delete event
  const handleDelete = async (id: number) => {
    const error = await deleteEvent(id);
    if (error) {
      console.log(error);
    } else {
      setData(data ? data.filter((daton) => daton.id != id) : null);
    }
  };

  // Open the Edit Modal with the corresponding data inserted in
  const setEdit = (daton: Event) => {
    setShowEditModal(true);
    setCurrID(daton.id);
    setCurrEdit({
      title: daton.title,
      password: daton.password,
      start_date: toISO(daton.start_date),
      end_date: toISO(daton.end_date),
      location: [],
      location_str: daton.location_str,
      content: daton.content,
      tags: daton.tags
    });
  };

  return (
    <>
      {data && (
        <div className="grid w-1/2 gap-2">
          {data.map((daton) => {
            console.log(daton.content);
            return (
              <span
                className="border-black border rounded-lg w-full p-5  relative"
                key={daton.id}
              >
                <button
                  className="absolute right-[-15px] top-[-15px] rounded-lg p-2 text-white bg-red-600 w-fit hover:bg-red-800 cursor-pointer"
                  onClick={() => {
                    handleDelete(daton.id);
                  }}
                >
                  Delete
                </button>
                <button
                  className="absolute right-[50px] top-[-15px] rounded-lg p-2 text-black bg-gray-300 w-fit hover:bg-gray-400 cursor-pointer"
                  onClick={() => {
                    setEdit(daton);
                  }}
                >
                  edit
                </button>
                <div className="w-full grid grid-cols-[auto_1fr] gap-x-2 ">
                  <label className="">Title</label>
                  <div className=""> {daton.title}</div>
                  <label className="">Password</label>
                  <div className=""> {daton.password}</div>
                  <label className="">Time Stamp</label>
                  <div className=""> {DateParser(daton.created_at)}</div>
                  <label htmlFor="">Start Date</label>
                  <div className=" whitespace-pre-line">
                    {DateParser(daton.start_date)}
                  </div>
                  <label htmlFor="">End Date</label>
                  <div className=" whitespace-pre-line">
                    {DateParser(daton.end_date)}
                  </div>
                  <label htmlFor="">Location</label>
                  <div className=" whitespace-pre-line">
                    {daton.location_str}
                  </div>
                  <label htmlFor="">rsvp: </label>
                  <div className=" whitespace-pre-line">{daton.rsvp}</div>
                  <label htmlFor="">tags: </label>
                  <div className=" whitespace-pre-line">
                    {daton.tags ? daton.tags.join(", ") : ""}
                  </div>
                </div>
                <EditorProvider
                  extensions={extensions}
                  content={daton.content}
                  editable={false}
                  editorProps={{
                    attributes: {
                      class:
                        "border-black border rounded-lg p-3 w-full col-span-2 focus:outline-none max-h-[40vh]  overflow-y-auto"
                    }
                  }}
                ></EditorProvider>
              </span>
            );
          })}
        </div>
      )}
      {showEditModal &&
        createPortal(
          <div className="w-screen h-screen fixed top-0 flex justify-center items-center z-100 overflow-scroll">
            <div
              className="fixed top-0 w-full h-full bg-black opacity-35 cursor-pointer"
              onClick={() => {
                setShowEditModal(false);
              }}
            ></div>
            <Form
              formdata={currEdit}
              id={curID}
              onSuccess={() => {
                window.location.href = "";
              }}
            ></Form>
          </div>,
          document.body
        )}
    </>
  );
}
