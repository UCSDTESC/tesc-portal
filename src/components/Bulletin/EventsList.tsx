import { BulletinContext } from "@lib/hooks/useBulletin";
import { memo, useContext } from "react";
import { SidebarClub, SidebarCompany } from "./SidebarItem";
import UserContext from "@lib/UserContext";
export const EventsList = memo(function ({
  setSelection,
  selection,
}: {
  setSelection: (selection: string) => void;
  selection: string;
}) {
  const { data, People, eventTimeFilter } = useContext(BulletinContext);
  const { User } = useContext(UserContext);
  if (User?.role === "company") {
    return (
      <>
        {People?.map((daton) => {
          return <SidebarCompany {...{ daton, setSelection, selection }} />;
        })}
      </>
    );
  }
  if (eventTimeFilter === "current" && (!data || data.length === 0)) {
    return (
      <p className="px-4 py-6 text-center text-sm text-slate-600">
        There are no upcoming events right now. Please check back later!
      </p>
    );
  }
  return (
    <>
      {data?.map((daton) => {
        return <SidebarClub {...{ daton, setSelection, selection }} />;
      })}
    </>
  );
});
