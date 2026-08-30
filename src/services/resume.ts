import supabase from "@server/supabase";

const RESUME_BUCKET = "resumes";

export function resumeObjectPath(userId: string) {
  return `${userId}/resume.pdf`;
}

export async function uploadResumePdf(file: File, userId: string) {
  const path = resumeObjectPath(userId);
  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(path, file, {
    upsert: true,
    contentType: "application/pdf",
  });
  return { path: error ? null : path, error };
}

export async function getResumeSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return { url: null, error };
  return { url: data.signedUrl, error: null };
}
