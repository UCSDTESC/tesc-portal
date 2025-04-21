import { ReactNode, useContext, useEffect, useState } from "react";
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
  const fetchData = async () => {
    if (!User) {
      return;
    }
    const { data, error } = await fetchEventByOrg(User.id);
    if (data) {
      setData(data);
    } else if (error) {
      console.log(error);
    }
  };

  // fetch events posted by user on component render
  useEffect(() => {
    fetchData();
  }, [User]);

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
  const openEditModal = (daton: Event) => {
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
  if (data)
    return (
      <main className="grid w-1/2 gap-2">
        {data.map((daton) => {
          return (
            <span className="border-black border rounded-lg w-full p-5  relative" key={daton.id}>
              <button
                className="absolute right-[-15px] top-[-15px] rounded-lg p-2 text-white bg-red-600 w-fit hover:bg-red-800 cursor-pointer"
                onClick={() => {
                  handleDelete(daton.id);
                }}>
                Delete
              </button>
              <button
                className="absolute right-[50px] top-[-15px] rounded-lg p-2 text-black bg-gray-300 w-fit hover:bg-gray-400 cursor-pointer"
                onClick={() => {
                  openEditModal(daton);
                }}>
                edit
              </button>
              <div className="w-full grid grid-cols-[auto_1fr] gap-x-2 ">
                <DataPair data={daton.title}>Title</DataPair>
                <DataPair data={daton.password}>Password</DataPair>
                <DataPair data={DateParser(daton.created_at)}>Time Stamp</DataPair>
                <DataPair data={DateParser(daton.start_date)}>Start Date</DataPair>

                <DataPair data={DateParser(daton.end_date)}>End Date</DataPair>
                <DataPair data={daton.location_str}>Location</DataPair>
                <DataPair data={daton.rsvp}>rsvp:</DataPair>
                <DataPair data={daton.tags ? daton.tags.join(", ") : ""}>tags:</DataPair>
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
                }}></EditorProvider>
            </span>
          );
        })}
        {showEditModal &&
          createPortal(
            <EditModal {...{ setShowEditModal, fetchData, currEdit, curID }} />,
            document.body
          )}
      </main>
    );
}

// Edit modal that is shown when User clicks on edit for a particular data object
function EditModal({
  setShowEditModal,
  fetchData,
  currEdit,
  curID
}: {
  setShowEditModal: (ShowEditModal: boolean) => void;
  currEdit: formdata;
  fetchData: () => void;
  curID: number;
}) {
  return (
    <div className="w-screen h-screen fixed top-0 flex justify-center items-center z-100 overflow-scroll">
      <div
        className="fixed top-0 w-full h-full bg-black opacity-35 cursor-pointer"
        onClick={() => {
          setShowEditModal(false);
        }}
      />
      <Form
        formdata={currEdit}
        id={curID}
        onSuccess={() => {
          setShowEditModal(false);
          fetchData();
        }}
      />
    </div>
  );
}

// Label-Data pair displayed on
function DataPair({
  children,
  data,
  className
}: {
  children: ReactNode;
  data: string | number;
  className?: string;
}) {
  return (
    <>
      <label className="">{children}</label>
      <div className={className}> {data}</div>
    </>
  );
}
