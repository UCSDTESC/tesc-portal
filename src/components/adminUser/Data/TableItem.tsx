import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { DateParser } from "@lib/utils";
import { EditorProvider } from "@tiptap/react";
import { ReactNode, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { extensions } from "../Form/EditorExtensions";
import { Event } from "@lib/constants";
import supabase from "@server/supabase";
import { CopyButton } from "@components/ui/shadcn-io/copy-button";
export default function TableItem({
  daton,
  handleDelete,
  openEditModal
}: {
  daton: Event;
  handleDelete: (id: number) => Promise<void>;
  openEditModal: (daton: Event) => void;
}) {
  const [attendees, setAttendees] = useState<{ user_id: string; Users: { email: string } }[]>([]);
  const [displayAttendees, setDisplayAttendees] = useState(false);
  const toggleAttendees = () => {
    setDisplayAttendees(!displayAttendees);
    if (attendees.length === 0) fetchAttendees();
    console.log(attendees.map((attendee) => attendee.Users.email).join("\n"));
  };

  const fetchAttendees = async () => {
    const { data } = await supabase
      .from("Attendance_Log")
      .select("user_id, Users (email)")
      .eq("event_id", daton.id);
    if (data) {
      setAttendees(data as object as { user_id: string; Users: { email: string } }[]);
    }
  };
  return (
    <div
      className="border-slate-400 border bg-slate-100 rounded-lg w-full p-5 relative shadow-2xl"
      key={daton.id}
    >
      <button
        className="absolute right-[-15px] top-[-15px] rounded-full p-2 w-10 text-white bg-red-700 hover:bg-red-800 cursor-pointer"
        onClick={() => handleDelete(daton.id)}
      >
        <DeleteOutlined />
      </button>
      <button
        className="absolute right-[30px] top-[-15px] rounded-full p-2 w-10 text-black bg-gray-300 hover:bg-gray-400 cursor-pointer"
        onClick={() => openEditModal(daton)}
      >
        <EditOutlined />
      </button>
      <span className="w-full grid grid-cols-[auto_1fr] gap-x-2 ">
        <DataPair data={daton.title ?? "N/A"}>
          <p className="font-bold text-blue">Title</p>
        </DataPair>
        <DataPair data={daton.password ?? "N/A"}>
          <p className="font-bold text-blue">Password</p>
        </DataPair>
        <DataPair data={DateParser(daton.created_at ?? "N/A")}>
          <p className="font-bold text-blue">Time Stamp</p>
        </DataPair>
        <DataPair data={DateParser(daton.start_date ? daton.start_date : "N/A")}>
          <p className="font-bold text-blue">Start Date</p>
        </DataPair>
        <DataPair data={DateParser(daton.end_date ? daton.end_date : "N/A")}>
          <p className="font-bold text-blue">End Date</p>
        </DataPair>
        <DataPair data={daton.location_str ?? "N/A"}>
          <p className="font-bold text-blue">Location</p>
        </DataPair>
        <DataPair data={daton.rsvp}>
          <p className="font-bold text-blue">RSVP Count</p>
        </DataPair>

        <DataPair data={daton.attendance}>
          <p className="font-bold text-blue">Attendance</p>
        </DataPair>
        <div className="font-bold text-blue"> Attendees</div>
        <label className="w-1/2 border border-lightBlue rounded-full flex items-center px-2">
          <div className="line-clamp-1 h-7 overflow-x-clip w-min">
            {displayAttendees &&
              attendees.map((attendee) => {
                return <>{attendee.Users.email + ", "}</>;
              })}
          </div>
          <div className="ml-auto flex items-center">
            {displayAttendees && (
              <CopyButton
                content={attendees.map((attendee) => attendee.Users.email).join("\n")}
                variant="ghost"
                size="sm"
              />
            )}
            <button className=" cursor-pointer w-min" onClick={toggleAttendees}>
              {displayAttendees ? (
                <FaRegEye className="pointer-events-none" />
              ) : (
                <FaRegEyeSlash className="pointer-events-none" />
              )}
            </button>
          </div>
        </label>

        <DataPair data={daton.tags ? daton.tags.join(", ") : "N/A"}>
          <p className="font-bold text-blue">Tags</p>
        </DataPair>
        {daton.content === null ? (
          <DataPair data={"N/A"}>
            <p className="font-bold text-blue">Description</p>
          </DataPair>
        ) : (
          <p className="font-bold text-blue">Description</p>
        )}
      </span>
      {daton.content && (
        <EditorProvider
          extensions={extensions}
          content={daton.content}
          editable={false}
          editorProps={{
            attributes: {
              class: "ml-8 w-full col-span-2 focus:outline-none max-h-[40vh] overflow-y-auto"
            }
          }}
        />
      )}
    </div>
  );
}
// Label-Data pair displayed on
function DataPair({
  children,
  data,
  className
}: {
  children: ReactNode;
  data: string | number | undefined;
  className?: string;
}) {
  return (
    <>
      <label className="">{children}</label>
      <div className={className}> {data}</div>
    </>
  );
}
