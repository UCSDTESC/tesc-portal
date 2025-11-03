import { useContext } from "react";
import { createPortal } from "react-dom";

import UserContext from "@lib/UserContext";
import { useEditModal } from "@lib/hooks/useEditModal";
import { useData } from "@lib/hooks/useData";
import { formdata } from "@lib/constants";

import Form from "../Form/Form";
import TableItem from "./TableItem";

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
          return <TableItem {...{ daton, handleDelete, openEditModal }} />;
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
  curID: string;
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
