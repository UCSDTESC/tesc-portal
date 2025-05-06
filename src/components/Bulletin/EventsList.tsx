import { BulletinContext } from "@lib/hooks/useBulletin";
import { useContext } from "react";
import SidebarItem from "./SidebarItem";
export function EventsList({
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
}
