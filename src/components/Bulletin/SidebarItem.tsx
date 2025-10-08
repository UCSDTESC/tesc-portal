import { Event } from "@lib/constants";
import supabase from "@server/supabase";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
export default function SidebarItem({
  daton,
  setSelection
}: {
  daton: Event;
  setSelection: (selection: number) => void;
}) {
  const [imageURL, setImageURL] = useState("");
  const navigate = useNavigate();
  const imageRef = useRef(null);
  useEffect(() => {
    const fetchPfpImage = async () => {
      const { data: pfpString, error } = await supabase
        .from("Users")
        .select("pfp_str")
        .eq("uuid", daton.UID);
      if (pfpString && pfpString[0].pfp_str) {
        setImageURL(
          `https://mxbwjmjpevvyejnugisy.supabase.co/storage/v1/object/public/profile.images/${daton.org_emails?.org_name}/${pfpString[0].pfp_str}`
        );
      }
      if (error) {
        console.log(error);
      }
    };
    fetchPfpImage();
  }, []);
  return (
    <button
      key={daton.id}
      className=" cursor-pointer flex flex-col p-1 h-[100px] font-DM"
      onClick={() => {
        navigate(`/bulletin/${daton.id}`);
        setSelection(daton.id);
      }}
    >
      <div className="flex flex-col justify-between rounded-lg bg-white h-full w-full p-1">
        <div className="flex gap-2 w-full h-1/2">
          {imageURL ? (
            <img
              src={imageURL}
              ref={imageRef}
              alt=""
              className="h-full rounded-full object-cover aspect-square"
            />
          ) : (
            <img
              src="https://placehold.co/600x600"
              ref={imageRef}
              alt=""
              className="h-full rounded-full object-cover aspect-square"
            />
          )}
          <div className="flex flex-col">
            <div className="font-bold text-[20px] w-full line-clamp-1">{daton.title}</div>
            <div className="text-[12px] opacity-70 w-full text-left">
              {daton.org_emails ? daton.org_emails.org_name : "unknown"}
            </div>
          </div>
        </div>
        <span className="w-full flex flex-col items-start">
          <p className="text-[12px] line-clamp-1">
            {new Date(daton.created_at).toUTCString().slice(0, 16)} <br />
          </p>
          <p className="w-full text-left text-[12px] line-clamp-1 font-bold">
            {daton.location_str ? daton.location_str : "N/A"}
          </p>
        </span>
      </div>
    </button>
  );
}
