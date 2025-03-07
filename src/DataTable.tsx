import { useContext, useEffect, useState } from "react";
import supabase from "./supabase/supabase";
import UserContext from "./UserContext";

export default function DataTable() {
  const { User } = useContext(UserContext);
  const [data, setData] = useState<
    | {
        id: number;
        created_at: string;
        UID: string;
        Title: string;
        Content: string;
        Date: string;
        Location_Str: string;
      }[]
    | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log(User);
      const { data, error } = await supabase
        .from("Events")
        .select()
        .eq("UID", User.toString());
      if (data) {
        setData(data);
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
        <div className="grid w-1/2 mt-[10vh] gap-2">
          {data.map((daton) => {
            return (
              <span
                className="border-black border rounded-lg w-full p-5 grid grid-cols-[auto_1fr] gap-x-2 relative"
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
                <label className="">Tile</label>
                <div className=""> {daton.Title}</div>
                <label className="">Time Stamp</label>
                <div className=""> {daton.created_at}</div>
                <label htmlFor="">Date</label>
                <div className=" whitespace-pre-line">
                  {new Date(Date.parse(daton.Date)).toString()}
                </div>
                <label htmlFor="">Location</label>
                <div className=" whitespace-pre-line">{daton.Location_Str}</div>
                <label htmlFor="">content</label>
                <div className=" whitespace-pre-line"> {daton.Content}</div>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
