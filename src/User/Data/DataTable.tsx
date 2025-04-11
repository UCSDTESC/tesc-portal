import { useContext, useEffect, useState } from "react";
import supabase from "../../supabase/supabase";
import UserContext from "../../UserContext";
import { EditorProvider } from "@tiptap/react";
import { extensions } from "../Form/EditorExtensions";
import { createPortal } from "react-dom";
import Form from "../Form/Form";
import { formdata } from "../Form/Form";
export default function DataTable() {
  const { User } = useContext(UserContext);
  const [data, setData] = useState<
    | {
        id: number;
        created_at: string;
        UID: string;
        title: string;
        content: string;
        start_date: string;
        end_date: string;
        location_str: string;
        rsvp: string;
      }[]
    | null
  >(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [curID, setCurrID] = useState(0);
  const [currEdit, setCurrEdit] = useState<formdata>({
    title: "",
    start_date: "",
    end_date: "",
    location: [],
    location_str: "",
    content: ""
  });
  useEffect(() => {
    console.log(User);
    if (!User) {
      return;
    }
    const fetchData = async () => {
      console.log(User);
      const { data, error } = await supabase
        .from("Events")
        .select()
        .eq("UID", User.id);
      if (data) {
        setData(data);
        console.log(data);
      }
      if (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [User, showEditModal]);

  const handleDelete = async (id: number) => {
    console.log(id);
    const { error } = await supabase.from("Events").delete().eq("id", id);
    if (error) {
      console.log(error);
    } else {
      setData(data ? data.filter((daton) => daton.id != id) : null);
    }
  };
  const DateParser = (date: string) => {
    const parsedDate = date.split(/-|T|:/);
    console.log(parsedDate);
    const correctDate = new Date(
      Date.UTC(
        parseInt(parsedDate[0]),
        parseInt(parsedDate[1]) - 1,
        parseInt(parsedDate[2]),
        parseInt(parsedDate[3]),
        parseInt(parsedDate[4])
      )
    );
    return correctDate.toUTCString();
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
                    setShowEditModal(true);
                    setCurrID(daton.id);
                    setCurrEdit({
                      title: daton.title,
                      start_date: daton.start_date.substring(
                        0,
                        ((daton.start_date.indexOf("T") | 0) + 6) | 0
                      ),
                      end_date: daton.end_date.substring(
                        0,
                        ((daton.end_date.indexOf("T") | 0) + 6) | 0
                      ),
                      location: [],
                      location_str: daton.location_str,
                      content: daton.content
                    });
                  }}
                >
                  edit
                </button>
                <div className="w-full grid grid-cols-[auto_1fr] gap-x-2">
                  <label className="">Tile</label>
                  <div className=""> {daton.title}</div>
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
          <div className="w-screen min-h-screen fixed top-0 flex justify-center items-center z-100">
            <div
              className="absolute top-0 w-full h-full bg-black opacity-35 cursor-pointer"
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
