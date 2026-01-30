import { Event, Member } from "@lib/constants";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
export function SidebarClub({
  daton,
  setSelection,
  selection,
}: {
  daton: Event;
  setSelection: (selection: string) => void;
  selection: string;
}) {
  const [imageURL, setImageURL] = useState("");
  const navigate = useNavigate();
  const imageRef = useRef(null);
  useEffect(() => {
    setImageURL(
      `https://mxbwjmjpevvyejnugisy.supabase.co/storage/v1/object/public/profile.images/${daton.orgs?.name}/${daton.orgs?.pfp_str}`
    );
  }, []);
  return (
    <button
      key={daton.id}
      className={` cursor-pointer flex flex-col p-1 h-[100px] font-DM ${
        selection !== String(daton.id) ? "opacity-80" : ""
      }`}
      onClick={() => {
        navigate(selection != "-1" ? "/bulletin/-1" : `/bulletin/${daton.id}`);
        setSelection(selection != "-1" && selection == String(daton.id) ? "-1" : String(daton.id));
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
            <div className="font-bold text-[19px] w-full line-clamp-1 text-left">{daton.title}</div>
            <div className="text-[12px] opacity-70 w-full text-left">
              {daton.orgs ? daton.orgs.name : "unknown"}
            </div>
          </div>
        </div>
        <span className="w-full flex flex-col items-start">
          <p className="text-[12px] line-clamp-1 text-muted-foreground">
            {new Date(daton.start_date).toUTCString().slice(0, 16)} <br />
          </p>
          <p className="w-full text-left text-[12px] line-clamp-1 font-bold text-muted-foreground">
            {daton.location_str ? daton.location_str : "N/A"}
          </p>
        </span>
      </div>
    </button>
  );
}

export function SidebarCompany({
  daton,
  setSelection,
  selection,
}: {
  daton: Member;
  setSelection: (selection: string) => void;
  selection: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      key={daton.email}
      className={` cursor-pointer flex flex-col p-1 h-[100px] font-DM ${
        selection !== daton.email ? "opacity-80" : ""
      }`}
      onClick={() => {
        navigate(selection != "-1" ? "/bulletin/-1" : `/bulletin/${daton.email}`);
        setSelection(selection != "-1" && selection == daton.email ? "-1" : daton.email);
      }}
    >
      <div className="flex flex-col rounded-lg bg-white h-full w-full px-4">
        <div className="flex gap-2 w-full h-1/2">
          <div className="flex flex-col">
            <div className="font-bold text-[20px] w-full line-clamp-1 text-left">
              {daton.first_name && daton.last_name
                ? daton.first_name + " " + daton.last_name
                : "Unknown"}
            </div>
            <div className="text-[12px] opacity-70 w-full text-left">
              {daton.major} | {daton.expected_grad}
            </div>
          </div>
        </div>
        <span className="w-full flex flex-col items-start">
          <p className="text-[12px] line-clamp-1">Events Attended: {daton.points}</p>
          <p className="w-full text-left text-[12px] line-clamp-1 font-bold">{daton.email}</p>
        </span>
      </div>
    </button>
  );
}
