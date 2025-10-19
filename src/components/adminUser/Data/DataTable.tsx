import { ReactNode, useContext } from "react";
import { createPortal } from "react-dom";

import { EditorProvider } from "@tiptap/react";
import UserContext from "@lib/UserContext";
import { DateParser } from "@lib/utils";
import { useEditModal } from "@lib/hooks/useEditModal";
import { useData } from "@lib/hooks/useData";
import { formdata } from "@lib/constants";

import { EditOutlined } from "@ant-design/icons";
import { DeleteOutlined } from "@ant-design/icons";

import { extensions } from "../Form/EditorExtensions";
import Form from "../Form/Form";

// TODO: Loading and Error state for the data
// TODO: styling of the component
export default function DataTable() {
  const { User } = useContext(UserContext);
  // data hook also returns error and loading state variables to be implemented later for error and loading states
  const { data, handleDelete, fetchData } = useData(User);
  const { showEditModal, curID, currEdit, setShowEditModal, openEditModal } = useEditModal();

  if (data)
    return (
      <main className="grid w-full gap-4">
        {data.map((daton) => {
          return (
            <div
              className="border-slate-400 border bg-slate-100 rounded-lg w-full p-5 relative shadow-2xl"
              key={daton.id}
            >
              <button
                className="absolute right-[-15px] top-[-15px] rounded-full p-2 w-10 text-white bg-red-700 hover:bg-red-800 cursor-pointer"
                onClick={() => handleDelete(daton.id)}
              >
                <DeleteOutlined />
              </button>
              <button
                className="absolute right-[30px] top-[-15px] rounded-full p-2 w-10 text-black bg-gray-300 hover:bg-gray-400 cursor-pointer"
                onClick={() => openEditModal(daton)}
              >
                <EditOutlined />
              </button>
              <span className="w-full grid grid-cols-[auto_1fr] gap-x-2 ">
                <DataPair data={daton.title ?? "N/A"}>
                  <p className="font-bold text-blue">Title</p>
                </DataPair>
                <DataPair data={daton.password ?? "N/A"}>
                  <p className="font-bold text-blue">Password</p>
                </DataPair>
                <DataPair data={DateParser(daton.created_at ?? "N/A")}>
                  <p className="font-bold text-blue">Time Stamp</p>
                </DataPair>
                <DataPair data={DateParser(daton.start_date ? daton.start_date : "N/A")}>
                  <p className="font-bold text-blue">Start Date</p>
                </DataPair>
                <DataPair data={DateParser(daton.end_date ? daton.end_date : "N/A")}>
                  <p className="font-bold text-blue">End Date</p>
                </DataPair>
                <DataPair data={daton.location_str ?? "N/A"}>
                  <p className="font-bold text-blue">Location</p>
                </DataPair>
                <DataPair data={daton.rsvp}>
                  <p className="font-bold text-blue">RSVP Count</p>
                </DataPair>
                <DataPair data={daton.attendance}>
                  <p className="font-bold text-blue">Attendance Count</p>
                </DataPair>
                <DataPair data={daton.tags ? daton.tags.join(", ") : "N/A"}>
                  <p className="font-bold text-blue">Tags</p>
                </DataPair>
                {daton.content === null ? (
                  <DataPair data={"N/A"}>
                    <p className="font-bold text-blue">Description</p>
                  </DataPair>
                ) : (
                  <p className="font-bold text-blue">Description</p>
                )}
              </span>
              {daton.content && (
                <EditorProvider
                  extensions={extensions}
                  content={daton.content}
                  editable={false}
                  editorProps={{
                    attributes: {
                      class:
                        "ml-8 w-full col-span-2 focus:outline-none max-h-[40vh] overflow-y-auto"
                    }
                  }}
                />
              )}
            </div>
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
        editEvent={true}
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
  data: string | number | undefined;
  className?: string;
}) {
  return (
    <>
      <label className="">{children}</label>
      <div className={className}> {data}</div>
    </>
  );
}
