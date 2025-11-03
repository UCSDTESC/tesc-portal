import { useContext } from "react";
import UserContext from "@lib/UserContext";
import MemberResume from "./MemberResume";
import EventInfo from "./EventInfo";

export default function BulletinDisplay({ selection }: { selection: string }) {
  const { User } = useContext(UserContext);

  if (User?.role === "company") {
    return <MemberResume selection={selection} />;
  } else return <EventInfo selection={selection} />;
}
