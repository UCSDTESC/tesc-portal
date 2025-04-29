import { useNavigate } from "react-router";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { useContext } from "react";
export function EventsList({ setSelection }: { setSelection: (selection: number) => void }) {
  const { data } = useContext(BulletinContext);
  const navigate = useNavigate();
  return (
    <>
      {data?.map((daton) => {
        return (
          <button
            className=" cursor-pointer flex flex-col p-1 h-full"
            onClick={() => {
              navigate(`/bulletin/${daton.id}`);
              setSelection(daton.id);
            }}
          >
            <div className="border  border-black h-full w-full p-1 rounded-standard bg-lightBlue">
              <div className="font-bold w-max">{daton.title}</div>
              <span className="line-clamp-3 w-max">
                {new Date(daton.created_at).toUTCString().slice(0, 16)} <br />
                {daton.org_emails ? daton.org_emails.org_name : "unknown"}
              </span>
            </div>
          </button>
        );
      })}
    </>
  );
}
