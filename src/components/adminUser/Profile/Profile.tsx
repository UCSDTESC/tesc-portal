import UserContext from "@lib/UserContext";
import supabase from "@server/supabase";
import { useContext, useEffect, useState } from "react";
import DataTable from "../Data/DataTable";
import Modal from "@mui/material/Modal";
import NewProfile from "./NewProfile";
import EditProfileForm from "./EditMemberProfile";

import PageAllAttendEvents from "@components/User/PageAllAttendEvents";

// TODO: code clean-up
export default function Profile() {
  const { User } = useContext(UserContext);
  const [orgname, setOrgname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editModal, setEditModal] = useState(false);
  useEffect(() => {
    document.title = "My Profile | TESC Portal";
  }, []);

  useEffect(() => {
    if (!User) return;
    if (User.role === "member") return;
    const fetchOrgname = async () => {
      const { data, error } = await supabase
        .from("user_org_roles")
        .select("org_uuid, orgs (name)")
        .eq("user_uuid", User?.id);
      const orgname = data as unknown as
        | {
            org_uuid: string;
            orgs: {
              name: string;
            };
          }[]
        | null;
      if (orgname) {
        setOrgname(orgname[0].orgs.name);
      }
      if (error) {
        console.log(error.message);
      }
    };
    fetchOrgname();
  }, [User, User?.id]);

  useEffect(() => {
    if (!User) return;
    if (User.role === "member") return;
    const fetchpfp = async () => {
      console.log("------FETCHING PROFILE PICTURE-------");
      console.log("getting profile picture path from Users");
      const { data } = await supabase
        .from("user_org_roles")
        .select("orgs (name, pfp_str)")
        .eq("user_uuid", User.id);
      const pfp_name = data as unknown as
        | {
            orgs: {
              name: string;
              pfp_str: string;
            };
          }[]
        | null;
      if (pfp_name) {
        console.log("pulling profile picture link from storage");
        console.log(pfp_name);
        const { data: URL } = supabase.storage
          .from("profile.images")
          .getPublicUrl(`${orgname}/${pfp_name[0].orgs.pfp_str}`);
        console.log(URL);
        if (URL) setImageUrl(URL.publicUrl);
      }
    };
    fetchpfp();
  }, [User?.id, orgname, editModal, User]);

  const controlEditModal = () => {
    setEditModal(!editModal);
  };

  if (User?.role === "internal") {
    return (
      <div className="flex flex-col lg:flex-row lg:flex-nowrap items-start w-screen min-h-screen mt-8 px-[min(15px,2vw)] gap-6">
        <div className="flex w-[max(30vw,300px)] max-w-full lg:flex-[0_0_10%] lg:w-full flex-col items-center justify-center gap-2 min-w-0 px-1 shrink-0 self-center lg:self-start">
          <div className="w-full aspect-square rounded-full overflow-hidden relative border border-slate-400">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <button
              onClick={controlEditModal}
              className="absolute bottom-0 w-full h-fit flex justify-center bg-black/30 cursor-pointer text-white text-[clamp(0.5rem,2vw,0.75rem)] py-0.5"
            >
              Edit +
            </button>
          </div>
          <h1 className="text-[clamp(0.875rem,2.5vw,1.25rem)] text-blue font-bold text-center leading-tight break-words w-full">
            {orgname}
          </h1>
        </div>
        <div className="flex flex-[1_1_90%] min-w-0 flex-col">
          <DataTable />
        </div>
        <Modal
          open={editModal}
          onClose={controlEditModal}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-fit h-fit  rounded-lg p-4">
            <NewProfile controlModal={controlEditModal} />
          </div>
        </Modal>
      </div>
    );
  } else {
    const currentPath = window.location.pathname;

    if (currentPath === "/all-attended-events") {
      return <PageAllAttendEvents />;
      // TODO: FIX
      // this is for the all-attended-events page when yo uwant to look at every event
      // you attended -- through the recently attended events bar
      // but it doesn't work right now sorry
    } else {
      return (
        <div className="flex flex-wrap justify-center w-screen min-h-screen mt-8 px-15 gap-8">
          <EditProfileForm />
        </div>
      );
    }
  }
}
