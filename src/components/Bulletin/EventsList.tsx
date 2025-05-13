import { BulletinContext } from "@lib/hooks/useBulletin";
import { memo, useContext } from "react";
import SidebarItem from "./SidebarItem";
export const EventsList = memo(function ({
  setSelection,
}: {
  setSelection: (selection: number) => void;
}) {
  const { data } = useContext(BulletinContext);

  return (
    <>
      {data?.map((daton) => {
        return <SidebarItem {...{ daton, setSelection }} />;
      })}
    </>
  );
});
