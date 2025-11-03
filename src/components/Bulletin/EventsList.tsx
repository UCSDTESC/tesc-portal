import { BulletinContext } from "@lib/hooks/useBulletin";
import { memo, useContext } from "react";
import { SidebarClub, SidebarCompany } from "./SidebarItem";
import UserContext from "@lib/UserContext";
export const EventsList = memo(function ({
  setSelection,
  selection
}: {
  setSelection: (selection: string) => void;
  selection: string;
}) {
  const { data, People } = useContext(BulletinContext);
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
  return (
    <>
      {data?.map((daton) => {
        return <SidebarClub {...{ daton, setSelection, selection }} />;
      })}
    </>
  );
});
