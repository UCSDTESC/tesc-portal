import supabase from "@server/supabase";
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import UserContext from "@lib/UserContext";
import Editor from "../Form/Editor";

// -----------------------------
// Profile picture uploader (ref-based)
// -----------------------------
export type ProfilePicUploaderHandle = {
  save: () => Promise<void>;
  hasPending: () => boolean;
};

const ProfilePicUploader = forwardRef<ProfilePicUploaderHandle>(function ProfilePicUploader(
  _props,
  ref
) {
  const { User } = useContext(UserContext);

  const picInput = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
  const loadCurrentPfp = async () => {
    try {
      if (!User) return;

      // Get org name + existing pfp_str
      const { data, error } = await supabase
        .from("user_org_roles")
        .select("orgs (name, pfp_str)")
        .eq("user_uuid", User.id)
        .single();

      if (error) throw error;

      const org = data as { orgs: { name: string; pfp_str: string | null } } | null;
      const orgName = org?.orgs?.name;
      const pfpStr = org?.orgs?.pfp_str;

      // If no picture set yet, stop loading and show "Add Photo"
      if (!orgName || !pfpStr) return;

      // Build public URL from storage path
      const { data: urlData } = supabase.storage
        .from("profile.images")
        .getPublicUrl(`${orgName}/${pfpStr}`);

      if (urlData?.publicUrl) {
        setImagePreview(urlData.publicUrl);
      }
    } catch (e) {
      console.error("Failed to load current org profile picture:", e);
    } finally {
      setLoadingInitial(false);
    }
  };

  loadCurrentPfp();
}, [User]);


  const imageUpload = () => {
    const file = picInput.current?.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      if (picInput.current) picInput.current.value = "";
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  };

  const hasPending = () => {
    return !!picInput.current?.files?.[0];
  };

  const save = async () => {
    const file = picInput.current?.files?.[0];
    if (!file || !User?.email) return; // nothing to save

    // fetch org uuid + name
    const { data, error: orgError } = await supabase
      .from("user_org_roles")
      .select("orgs (uuid, name)")
      .eq("user_uuid", User.id)
      .single();

    const org = data as { orgs: { uuid: string; name: string } } | null;
    if (orgError || !org) throw orgError;

    const orgName = org.orgs.name;
    const filePath = `${orgName}/${file.name}`;

    // upload
    const { error: uploadError } = await supabase.storage
      .from("profile.images")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    // update org row
    const { error: updateError } = await supabase
      .from("orgs")
      .update({ pfp_str: file.name })
      .eq("uuid", org.orgs.uuid);

    if (updateError) throw updateError;

    // clear selection after save
    if (picInput.current) picInput.current.value = "";
  };

  useImperativeHandle(ref, () => ({ save, hasPending }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-navy mb-3">Org Picture</h3>

      <div
        className="relative flex flex-col items-center justify-center"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <label htmlFor="profilePic" className="cursor-pointer group relative">
          {loadingInitial ? (
            <div className="w-36 h-36 rounded-full bg-gray-100 animate-pulse" />
          ) : imagePreview ? (
            <div className="relative">
              <div className="relative w-36 h-36 rounded-full overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />

                {/* Edit+ strip INSIDE the circle */}
                <div className="absolute bottom-0 left-0 w-full flex justify-center bg-black/35 text-white text-xs font-semibold py-1">
                  Edit +
                </div>

                {/* Optional hover overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="mb-1">Change</span>
                  <span className="text-xs">(click to replace)</span>
                </div>
              </div>


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


        {imagePreview && (
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
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
    </div>
  );
});

// -----------------------------
// Org profile editor (ref-based)
// -----------------------------
export type OrgProfileEditorHandle = {
  save: () => Promise<void>;
  hasPending: () => boolean;
};

function normalizeTiptapHtml(html: string) {
  const cleaned = (html ?? "").trim();
  const compact = cleaned.replace(/\s+/g, " ").trim();

  if (compact === "<p></p>" || compact === "<p><br></p>" || compact === "<p> </p>") return "";

  const textOnly = compact.replace(/<[^>]*>/g, "").trim();
  if (!textOnly) return "";

  return cleaned;
}

const OrgProfileEditor = forwardRef<OrgProfileEditorHandle, { orgUuid: number }>(function OrgProfileEditor(
  { orgUuid },
  ref
) {
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState<string>("");
  const [initialContent, setInitialContent] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("orgs")
        .select("profile")
        .eq("uuid", orgUuid)
        .single();

      if (!alive) return;
      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }

      const v = (data?.profile as string) || "";
      setEditorContent(v);
      setInitialContent(v);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [orgUuid]);

  const hasPending = () => {
    return normalizeTiptapHtml(editorContent) !== normalizeTiptapHtml(initialContent);
  };

  const save = async () => {
    const normalized = normalizeTiptapHtml(editorContent);

    const { error } = await supabase
      .from("orgs")
      .update({ profile: normalized === "" ? null : normalized })
      .eq("uuid", orgUuid);

    if (error) throw error;

    setInitialContent(editorContent);
  };

  useImperativeHandle(ref, () => ({ save, hasPending }));

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-navy mb-3">TESC Profile</h3>

      {/* TipTap */}
      <Editor content={editorContent} setEditorContent={setEditorContent} />
    </div>
  );
});

// -----------------------------
// Combined modal
// -----------------------------
export default function EditOrgModal({
  orgUuid,
  controlModal
}: {
  orgUuid: number;
  controlModal: () => void;
}) {
  const picRef = useRef<ProfilePicUploaderHandle>(null);
  const editorRef = useRef<OrgProfileEditorHandle>(null);

  const [saving, setSaving] = useState(false);

  const onSaveAll = async () => {
    setSaving(true);
    try {
      const tasks: Promise<void>[] = [];

      if (picRef.current?.hasPending()) tasks.push(picRef.current.save());
      if (editorRef.current?.hasPending()) tasks.push(editorRef.current.save());

      await Promise.all(tasks);

      controlModal();
    } catch (err: any) {
      console.error(err);
      alert(`Save failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-[min(980px,92vw)] p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-navy">Edit Organization</h2>
        <button
          type="button"
          onClick={controlModal}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {/* Layout: left = image, right = editor */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="lg:sticky lg:top-6">
          <ProfilePicUploader ref={picRef} />
        </div>

        <div>
          <OrgProfileEditor ref={editorRef} orgUuid={orgUuid} />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onSaveAll}
          disabled={saving}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm border border-gray-200
            ${saving ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue text-white hover:opacity-90"}`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
