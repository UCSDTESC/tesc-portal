import supabase from "@server/supabase";
import { useContext, useRef, useState } from "react";
import UserContext from "@lib/UserContext";

interface Props {
  controlModal: () => void;
}

export default function NewProfile({ controlModal }: Props) {
  const { User } = useContext(UserContext);
  const picInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  const imageUpload = () => {
    const file = picInput.current?.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");

      if (picInput.current) picInput.current.value = "";
      return;
    }

    setImage(URL.createObjectURL(file));
  };

  const handleUploadProfilePicture = async () => {
    console.log("-----UPLOAD PROFILE PICTURE-----");
    setLoading(true);
    try {
      const file = picInput.current?.files?.[0];
      if (!file || !User?.email) return;

      console.log("fetching org name from org_emails");
      const { data: org, error: orgError } = await supabase
        .from("org_emails")
        .select("org_name")
        .eq("email", User.email)
        .single();

      if (orgError || !org) throw orgError;

      const orgName = org.org_name;
      const filePath = `${orgName}/${file.name}`;

      console.log("uploading profile picture to storage");
      const { error: uploadError } = await supabase.storage
        .from("profile.images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      console.log("update profile picture path on Users");
      const { error: updateError } = await supabase
        .from("Users")
        .update({ pfp_str: file.name })
        .eq("email", User.email);

      if (updateError) throw updateError;

      controlModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        alert(`Upload failed: ${err.message}`);
      } else {
        console.error("Unknown error:", err);
        alert("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUploadProfilePicture();
        }}
        className="flex flex-col items-center gap-6 p-8 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 transition-transform duration-300 hover:scale-[1.02] w-full h-full"
      >
        <h2 className="text-lg font-semibold text-navy tracking-wide">
          Upload New Profile Picture
        </h2>

        <div
          className="relative flex flex-col items-center justify-center"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Make both empty & filled states clickable */}
          <label htmlFor="profilePic" className="cursor-pointer group relative">
            {image ? (
              <div className="relative">
                <img
                  src={image}
                  alt="Profile Preview"
                  className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md transition-all duration-300 group-hover:brightness-90"
                />
                <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/40 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="mb-1">Change</span>
                  <span className="text-xs">(click to replace)</span>
                </div>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-dashed ${
                  hovering ? "border-blue-400 bg-blue-50/50" : "border-gray-300 bg-white/40"
                } text-gray-500 hover:text-blue-600 transition-all duration-300`}
              >
                <span className="text-3xl font-bold mb-1">+</span>
                <span className="text-xs font-medium">Add Photo</span>
              </div>
            )}
          </label>

          {/* Remove button */}
          {image && (
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (picInput.current) picInput.current.value = "";
              }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-gray-600 border border-gray-300 shadow-sm flex items-center justify-center font-bold hover:bg-gray-100 transition"
              title="Remove image"
            >
              ×
            </button>
          )}

          <input
            id="profilePic"
            type="file"
            accept="image/*"
            ref={picInput}
            onChange={imageUpload}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !image}
          className={`px-8 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm border border-gray-200
            ${
              loading || !image
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-800 to-indigo-800 text-white hover:from-blue-900 hover:to-indigo-900 hover:shadow-md"
            }`}
        >
          {loading ? "Uploading..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
