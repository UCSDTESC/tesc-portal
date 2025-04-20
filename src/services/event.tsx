import supabase from "../supabase/supabase";
import { formdata } from "../lib/constants";

export const fetchEventByOrg = async (uid: string) => {
  const { data, error } = await supabase.from("Events").select().eq("UID", uid);
  return { data, error };
};

export const deleteEvent = async (id: number) => {
  const { error } = await supabase.from("Events").delete().eq("id", id);
  return error;
};

export const updateEvent = async (
  eventId: number,
  uid: string,
  formData: formdata
) => {
  const { error } = await supabase
    .from("Events")
    .update({
      UID: uid,
      title: formData.title,
      password: formData.password,
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location,
      location_str: formData.location_str,
      content: formData.content,
      tags: formData.tags,
    })
    .eq("id", eventId);
  return error;
};
