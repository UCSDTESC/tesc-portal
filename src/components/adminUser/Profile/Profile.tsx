import UserContext from "@lib/UserContext";
import supabase from "@server/supabase";
import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router";

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
  }, [orgname]);
  return (
    <section>
      <div className="flex ">
        {orgname}{" "}
        <div className="w-32 aspect-square rounded-full overflow-hidden relative border-2 border-black">
          <img src={imageUrl} alt="" className="w-full h-full object-cover " />
          <NavLink
            to="./edit"
            className="absolute bottom-0 w-full h-fit flex justify-center bg-black/30 cursor-pointer"
          >
            Edit +
          </NavLink>
        </div>
      </div>
    </section>
  );
}
