import { useEffect, useState } from "react";
import supabase from "./supabase/supabase";

export default function DataTable({ userID }: { userID: string }) {
  const [data, setData] = useState<
    | {
        id: number;
        created_at: string;
        UID: string;
        Title: string;
        Content: string;
      }[]
    | null
  >(null);
  useEffect(() => {
    const fetchData = async () => {
      await supabase
        .from("Events")
        .select()
        .eq("UID", userID)
        .then(
          (data) => {
            setData(data.data);
          },
          (error) => {
            console.log(error);
          }
        );
    };
    fetchData();
  });
  return (
    <>
      {data && (
        <div className="grid w-1/2 mt-10 gap-2">
          {data.map((daton) => {
            return (
              <span
                className="border-black border rounded-lg w-full p-5 grid grid-cols-[auto_1fr] gap-x-2"
                key={daton.id}
              >
                <label className="">Tile</label>
                <div className=""> {daton.Title}</div>
                <label className="">Time Stamp</label>
                <div className=""> {daton.created_at}</div>
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
