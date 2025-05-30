import UserContext from "@lib/UserContext";
import supabase from "@server/supabase";
import { useContext, useEffect, useState } from "react";
import DataTable from "../Data/DataTable";
import Modal from "@mui/material/Modal";
import NewProfile from "./NewProfile";

// TODO: code clean-up
export default function Profile() {
  const { User } = useContext(UserContext);
  const [orgname, setOrgname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    const fetchOrgname = async () => {
      const { data, error } = await supabase
        .from("org_emails")
        .select("org_name")
        .eq("email", User?.email);
      if (data) {
        setOrgname(data[0].org_name);
      }
      if (error) {
        console.log(error.message);
      }
    };
    fetchOrgname();
  });

  useEffect(() => {
    const fetchpfp = async () => {
      const { data: pfp_name } = await supabase
        .from("Users")
        .select("pfp_str")
        .eq("email", User?.email);
      if (pfp_name) {
        const { data: URL } = supabase.storage
          .from("profile.images")
          .getPublicUrl(`${orgname}/${pfp_name[0].pfp_str}`);
        if (URL) setImageUrl(URL.publicUrl);
      }
    };
    fetchpfp();
  }, [User?.email, orgname, editModal]);

  const controlEditModal = () => {
    setEditModal(!editModal);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start w-screen mt-8 mx-15 gap-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-32 h-32 aspect-square rounded-full overflow-hidden relative border-1 border-slate-400">
          <img src={imageUrl} alt="" className="w-full h-full object-cover " />
          <button
            onClick={controlEditModal}
            className="absolute bottom-0 w-full h-fit flex justify-center bg-black/30 cursor-pointer text-white"
          >
            Edit +
          </button>
        </div>
        <h1 className="text-3xl mt-8 text-blue font-bold">{orgname}</h1>
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-end gap-3">
        <h1 className="text-xl font-semibold">My Posted Events</h1>
        <DataTable />
      </div>
      <Modal
        open={editModal}
        onClose={controlEditModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-slate-200 rounded-lg p-4">
          <h1 className="font-semibold text-lg mb-3">Edit Profile</h1>
          <NewProfile controlModal={controlEditModal} />
        </div>
      </Modal>
    </div>
  );
}
