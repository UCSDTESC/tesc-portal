import { ReactNode, useContext } from "react";
import { createPortal } from "react-dom";

import { EditorProvider } from "@tiptap/react";
import UserContext from "@lib/UserContext";
import { DateParser } from "@lib/utils";
import { useEditModal } from "@lib/hooks/useEditModal";
import { useData } from "@lib/hooks/useData";
import { formdata } from "@lib/constants";

import { extensions } from "../Form/EditorExtensions";
import Form from "../Form/Form";

// TODO: Loading and Error state for the data
// TODO: styling of the component
export default function DataTable() {
  const { User } = useContext(UserContext);
  // data hook also returns error and loading state variables to be implemented later for error and loading states
  const { data, handleDelete, fetchData } = useData(User);
  const { showEditModal, curID, currEdit, setShowEditModal, openEditModal } =
    useEditModal();

  if (data)
    return (
      <main className="grid w-1/2 gap-2">
        {data.map((daton) => {
          return (
            <span
              className="border-black border rounded-lg w-full p-5  relative"
              key={daton.id}
            >
              <span
                className="border-black border rounded-lg w-full p-5  relative"
                key={daton.id}
              >
                <button
                  className="absolute right-[-15px] top-[-15px] rounded-lg p-2 text-white bg-red-600 w-fit hover:bg-red-800 cursor-pointer"
                  onClick={() => handleDelete(daton.id)}
                >
                  Delete
                </button>
                <button
                  className="absolute right-[50px] top-[-15px] rounded-lg p-2 text-black bg-gray-300 w-fit hover:bg-gray-400 cursor-pointer"
                  onClick={() => openEditModal(daton)}
                >
                  edit
                </button>
                <span className="w-full grid grid-cols-[auto_1fr] gap-x-2 ">
                  <DataPair data={daton.title}>Title</DataPair>
                  <DataPair data={daton.password}>Password</DataPair>
                  <DataPair data={DateParser(daton.created_at)}>
                    Time Stamp
                  </DataPair>
                  <DataPair
                    data={DateParser(daton.start_date ? daton.start_date : "")}
                  >
                    Start Date
                  </DataPair>
                  <DataPair
                    data={DateParser(daton.end_date ? daton.end_date : "")}
                  >
                    End Date
                  </DataPair>
                  <DataPair data={daton.location_str}>Location</DataPair>
                  <DataPair data={daton.rsvp}>rsvp:</DataPair>
                  <DataPair data={daton.attendance}>attendance:</DataPair>
                  <DataPair data={daton.tags ? daton.tags.join(", ") : ""}>
                    tags:
                  </DataPair>
                </span>
                <EditorProvider
                  extensions={extensions}
                  content={daton.content}
                  editable={false}
                  editorProps={{
                    attributes: {
                      class:
                        "border-black border rounded-lg p-3 w-full col-span-2 focus:outline-none max-h-[40vh]  overflow-y-auto",
                    },
                  }}
                />
              </span>
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
  curID,
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
  className,
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
