import supabase from "@server/supabase";
import { useContext, useRef, useState } from "react";
import UserContext from "@lib/UserContext";

interface Props {
  controlModal: () => void;
}
//TODO: code clean-up
export default function NewProfile({ controlModal }: Props) {
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
      if (!picInput.current?.files) {
        return;
      }

      const { data: Orgname, error } = await supabase
        .from("org_emails")
        .select("org_name")
        .eq("email", User?.email);
      if (Orgname) {
        console.log(Orgname[0].org_name);
        const { data, error } = await supabase.storage
          .from("profile.images")
          .upload(
            `${Orgname[0].org_name}/${picInput.current.files[0].name}`,
            picInput.current.files[0],
            {
              cacheControl: "3600",
              upsert: true,
            }
          );
        if (data) {
          const { error } = await supabase
            .from("Users")
            .update({ pfp_str: picInput.current.files[0].name })
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
    controlModal();
  };

  return (
    <div className="w-full h-full relative">
      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          handleUploadProfilePicture();
        }}
      >
        <div className="flex flex-row gap-8 items-center">
          <input
            type="file"
            accept="image/*"
            ref={picInput}
            className="px-2 h-fit border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-300"
            onChange={imageUpload}
          ></input>
          {picInput.current?.files && (
            <img
              src={image}
              alt=""
              className="w-[8vw] h-[8vw] object-cover rounded-full"
            />
          )}
        </div>
        <button
          type="submit"
          className="absolute bottom-10 right-0 rounded-lg px-2 py-1 hover:bg-slate-300 border border-slate-500 cursor-pointer"
        >
          Done
        </button>
      </form>
    </div>
  );
}
