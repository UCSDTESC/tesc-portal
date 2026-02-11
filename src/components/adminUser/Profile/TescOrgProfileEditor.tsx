import { useEffect, useState } from "react";
import supabase from "@server/supabase";
import Editor from "../Form/Editor"; 

export default function TescOrgProfileEditor({orgUuid = 42, containerClassName = "bg-blue text-white",}: {orgUuid?: number; containerClassName?: string;}) {

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("orgs")
        .select("profile")
        .eq("uuid", orgUuid)
        .single();

      if (!alive) return;

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setEditorContent((data?.profile as string) || "");
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [orgUuid]);

  const normalizeTiptapHtml = (html: string) => {
    const cleaned = (html ?? "").trim();

    const compact = cleaned.replace(/\s+/g, " ").trim();

    if (
        compact === "<p></p>" ||
        compact === "<p><br></p>" ||
        compact === "<p> </p>"
    ) {
        return "";
  }

  const textOnly = compact.replace(/<[^>]*>/g, "").trim();
  if (!textOnly) return "";

  return cleaned;
  };


  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");

    const normalized = normalizeTiptapHtml(editorContent);
    const { error } = await supabase
      .from("orgs")
      .update({ profile: normalized === "" ? null : normalized })
      .eq("uuid", orgUuid);

    if (error) setErrorMsg(error.message);

    setSaving(false);
  };

  return (
    <div className={`w-full rounded-2xl p-6 ${containerClassName}`}>


      <h2 className="text-xl font-semibold mb-2">TESC Profile</h2>


      {loading ? (
        <div className="text-white/80">Loading…</div>
      ) : (
        <>
          {/* EXACT same editor from New Event */}
          <Editor content={editorContent} setEditorContent={setEditorContent} />

          {errorMsg && <div className="mt-3 text-red-200">Error: {errorMsg}</div>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`mt-4 px-5 py-2 rounded-xl font-semibold ${
              saving ? "bg-white/30 cursor-not-allowed" : "bg-white text-blue-900 hover:bg-white/90"
            }`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      )}
    </div>
  );
}
