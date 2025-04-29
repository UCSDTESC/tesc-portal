import supabase from "@server/supabase";
import { useContext, useRef, useState } from "react";
import UserContext from "@lib/UserContext";
export default function NewProfile() {
  const { User } = useContext(UserContext);
  const picInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const imageUpload = () => {
    if (!picInput.current?.files) return;
    if (picInput.current.files[0].size > 2097152) {
      alert("File is too big");
      picInput.current.value = "";
    } else {
      setImage(URL.createObjectURL(picInput.current.files[0]));
      console.log(picInput.current.files[0].type.replace("image/", "."));
    }
  };

  const handleUploadProfilePicture = async () => {
    const fetchOrgname = async () => {
      if (!picInput.current?.files) return;
      console.log(User?.email);
      const { data: Orgname, error } = await supabase
        .from("org_emails")
        .select("org_name")
        .eq("email", User?.email);
      if (Orgname) {
        console.log(Orgname[0].org_name);
        const { data, error } = await supabase.storage
          .from("profile.images")
          .upload(
            `${Orgname[0].org_name}/pfp${picInput.current.files[0].type.replace("image/", ".")}`,
            picInput.current.files[0],
            {
              upsert: true
            }
          );
        if (data) {
          const { error } = await supabase
            .from("Users")
            .update({ pfp_str: `pfp${picInput.current.files[0].type.replace("image/", ".")}` })
            .eq("email", User?.email);
          if (error) {
            console.log(error.message);
          }
        }
        if (error) {
          console.log(error);
        } else {
          return;
        }
      }
      if (error) {
        console.log(error.message);
      }
    };
    fetchOrgname();
  };

  return (
    <div>
      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          handleUploadProfilePicture();
        }}
      >
        <input
          type="file"
          accept="image/*"
          ref={picInput}
          className="border border-black rounded-lg cursor-pointer hover:bg-amber-50"
          onChange={imageUpload}
        ></input>
        {picInput.current?.files && (
          <img src={image} alt="" className="w-[5vw] h-[5vw] object-cover rounded-full" />
        )}
        <button
          type="submit"
          className="border border-black rounded-lg px-2 py-1 hover:bg-amber-100 cursor-pointer"
        >
          Submit Profile Picture
        </button>
      </form>
    </div>
  );
}
