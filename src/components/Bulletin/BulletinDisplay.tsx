import { useContext } from "react";
import { BulletinContext } from "@lib/hooks/useBulletin";
import MemberResume from "./MemberResume";
import EventInfo from "./EventInfo";

export default function BulletinDisplay({ selection }: { selection: string }) {
  const { portalMode } = useContext(BulletinContext);

  if (portalMode === "recruiter") {
    return <MemberResume selection={selection} />;
  }
  return <EventInfo selection={selection} />;
}
