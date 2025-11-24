import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { DateParser } from "@lib/utils";
import { EditorProvider } from "@tiptap/react";
import { ReactNode, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { extensions } from "../Form/EditorExtensions";
import { Event } from "@lib/constants";
import supabase from "@server/supabase";
import { CSVLink } from "react-csv";
import { IoMdDownload } from "react-icons/io";
import { motion } from "motion/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
export default function TableItem({
  daton,
  handleDelete,
  openEditModal
}: {
  daton: Event;
  handleDelete: (id: string) => Promise<void>;
  openEditModal: (daton: Event) => void;
}) {
  const [attendees, setAttendees] = useState<
    {
      user_id: string;
      Users: { email: string; first_name: string; last_name: string; major: string };
    }[]
  >([]);
  const [displayAttendees, setDisplayAttendees] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const DeleteAction = async () => {
    setIsDeleting(true);
    try {
      handleDelete(daton.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAttendees = () => {
    setDisplayAttendees(!displayAttendees);
    if (attendees.length === 0) fetchAttendees();
  };

  const fetchAttendees = async () => {
    const { data } = await supabase
      .from("Attendance_Log")
      .select("user_id, Users (email, first_name,last_name,major)")
      .eq("event_id", daton.id);
    if (data) {
      setAttendees(
        data as object as {
          user_id: string;
          Users: { email: string; first_name: string; last_name: string; major: string };
        }[]
      );
    }
  };
  return (
    <div
      className="border-slate-400 border bg-slate-100 rounded-lg w-full p-5 relative shadow-2xl"
      key={daton.id}
    >
      <DeleteConfirmationModal
        itemName="this post"
        isDeleting={isDeleting}
        onConfirm={DeleteAction}
        trigger={
          <button className="absolute right-[-15px] top-[-15px] rounded-full p-2 w-10 text-white bg-red-700 hover:bg-red-800 cursor-pointer">
            <DeleteOutlined />
          </button>
        }
      />

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
        <DataPair data={daton.attendance_cap}>
          <p className="font-bold text-blue">Max RSVP </p>
        </DataPair>

        <DataPair data={daton.attendance}>
          <p className="font-bold text-blue">Attendance</p>
        </DataPair>
        <div className="font-bold text-blue"> Attendees</div>
        <div className="w-1/2 border border-lightBlue overflow-auto flex items-center px-2 pr-4 min-h-7 h-7 resize-y">
          <div className="overflow-clip w-min h-full">
            {displayAttendees &&
              attendees.map((attendee) => {
                return (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {attendee.Users.email + ", "}
                    </motion.div>
                  </>
                );
              })}
          </div>
          <div className="ml-auto flex items-center gap-1">
            {displayAttendees && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <CSVLink
                  data={attendees.map((attendee) => ({
                    user_id: attendee.user_id,
                    email: attendee.Users.email,
                    first_name: attendee.Users.first_name,
                    last_name: attendee.Users.last_name,
                    major: attendee.Users.major
                  }))}
                  className="opacity-50 hover:opacity-95"
                >
                  <IoMdDownload />
                </CSVLink>
              </motion.div>
            )}
            <button className="cursor-pointer w-min" onClick={toggleAttendees}>
              {displayAttendees ? (
                <FaRegEye className="pointer-events-none" />
              ) : (
                <FaRegEyeSlash className="pointer-events-none" />
              )}
            </button>
          </div>
        </div>

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
