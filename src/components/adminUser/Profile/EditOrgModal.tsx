import supabase from "@server/supabase";
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Plus, X } from "lucide-react";
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

      const org = data as unknown as { orgs: { name: string; pfp_str: string | null } } | null;
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
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <ImageIcon className="h-4 w-4 text-brand-500" />
        Org Picture
      </h3>

      <div
        className="relative flex flex-col items-center justify-center"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <label htmlFor="profilePic" className="group relative cursor-pointer">
          {loadingInitial ? (
            <div className="h-36 w-36 animate-pulse rounded-full bg-surface" />
          ) : imagePreview ? (
            <div className="relative">
              <div className="relative h-36 w-36 overflow-hidden rounded-full ring-1 ring-line">
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="h-full w-full object-cover"
                />

                {/* Edit+ strip INSIDE the circle */}
                <div className="absolute bottom-0 left-0 flex w-full justify-center bg-black/35 py-1 text-xs font-semibold text-white">
                  Edit +
                </div>

                {/* Optional hover overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span className="mb-1">Change</span>
                  <span className="text-xs">(click to replace)</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-dashed ${
                hovering ? "border-brand-500 bg-brand-50" : "border-line bg-white"
              } text-ink-muted transition-all duration-300 hover:text-brand-600`}
            >
              <Plus className="mb-1 h-7 w-7" />
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
            className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink-secondary shadow-sm transition hover:bg-surface"
            title="Remove image"
          >
            <X className="h-4 w-4" />
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

  if (loading) return <div className="text-sm text-ink-muted">Loading…</div>;

  return (
    <div className="w-full">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <FileText className="h-4 w-4 text-brand-500" />
        TESC Profile
      </h3>

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
    <div className="card-shadow w-[min(980px,92vw)] rounded-2xl border border-line bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Edit Organization</h2>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Update the organization picture and public profile.
          </p>
        </div>
        <button
          type="button"
          onClick={controlModal}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Layout: left = image, right = editor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-6">
          <ProfilePicUploader ref={picRef} />
        </div>

        <div>
          <OrgProfileEditor ref={editorRef} orgUuid={orgUuid} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
        <button
          type="button"
          onClick={controlModal}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSaveAll}
          disabled={saving}
          className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors ${
            saving
              ? "cursor-not-allowed bg-surface text-ink-muted"
              : "bg-navy-900 text-white hover:bg-navy-800"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
