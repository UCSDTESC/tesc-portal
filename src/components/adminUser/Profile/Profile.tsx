import UserContext from "@lib/UserContext";
import supabase from "@server/supabase";
import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router";
import DataTable from "../Data/DataTable";

// TODO: code clean-up
export default function Profile() {
  const { User } = useContext(UserContext);
  const [orgname, setOrgname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
  }, [User?.email, orgname]);
  return (
    <div className="flex flex-row justify-between items-start w-screen mt-8 mx-15 gap-8">
      <div className="flex flex-row gap-4">
        <div className="w-32 h-32 aspect-square rounded-full overflow-hidden relative border-2 border-black">
          <img src={imageUrl} alt="" className="w-full h-full object-cover " />
          <NavLink
            to="./edit"
            className="absolute bottom-0 w-full h-fit flex justify-center bg-black/30 cursor-pointer text-white"
          >
            Edit +
          </NavLink>
        </div>
        <h1 className="text-3xl mt-8">{orgname}</h1>
      </div>
      <div className="w-1/2 flex flex-col justify-end gap-3">
        <h1 className="text-xl font-semibold">My Posted Events</h1>
        <DataTable />
      </div>
    </div>
  );
}
