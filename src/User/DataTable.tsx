import { useContext, useEffect, useState } from "react";
import supabase from "../supabase/supabase";
import UserContext from "../UserContext";
import { EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Image from "@tiptap/extension-image";
// define your extension array
const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure(),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  StarterKit,
  Image.configure({
    HTMLAttributes: {
      class: "w-1/2 aspect-square object-contain ml-2",
    },
    inline: true,
  }),
  Placeholder,

  BulletList.configure({
    HTMLAttributes: {
      class: "list-disc",
    },
  }),
  OrderedList.configure({
    HTMLAttributes: {
      class: "list-decimal",
    },
  }),
  ListItem,
];

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
  }, [User]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("Events").delete().eq("id", id);
    if (error) {
      console.log(error);
    }
  };
  return (
    <>
      {data && (
        <div className="grid w-1/2 mt-[20vh] gap-2">
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
                <div className="w-full grid grid-cols-[auto_1fr] gap-x-2">
                  <label className="">Tile</label>
                  <div className=""> {daton.title}</div>
                  <label className="">Time Stamp</label>
                  <div className=""> {daton.created_at}</div>
                  <label htmlFor="">Start Date</label>
                  <div className=" whitespace-pre-line">
                    {new Date(Date.parse(daton.start_date)).toString()}
                  </div>
                  <label htmlFor="">End Date</label>
                  <div className=" whitespace-pre-line">
                    {new Date(Date.parse(daton.end_date)).toString()}
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
                        "border-black border rounded-lg p-3 w-full col-span-2 focus:outline-none max-h-[40vh]  overflow-y-auto",
                    },
                  }}
                ></EditorProvider>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
