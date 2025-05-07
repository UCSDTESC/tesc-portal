import supabase from "@server/supabase";
import { formdata } from "@lib/constants";
import { User } from "@lib/UserContext";
export const fetchEventByOrg = async (uid: string) => {
  const { data, error } = await supabase.from("Events").select().eq("UID", uid);
  return { data, error };
};

export const createEvent = async (User: User, formData: formdata) => {
  const { data: org_name } = await supabase
    .from("org_emails")
    .select("org_name")
    .eq("email", User.email);
  if (org_name) {
    console.log(org_name[0]);
    const { error } = await supabase.from("Events").insert({
      UID: User.id,
      title: formData.title,
      password: formData.password,
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location,
      location_str: formData.location_str,
      content: formData.content,
      tags: formData.tags,
      org_name: org_name[0].org_name,
    });
    return error;
  }
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
      poster: formData.poster,
    })
    .eq("id", eventId);
  return error;
};

export const queryEventsBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  sortMethod: string
) => {
  let query = supabase
    .from("Events")
    .select(
      "UID,content,created_at,end_date,id,location_str,start_date,tags,title,attendance,rsvp,Users (uuid,email,pfp_str), org_emails (email,org_name)"
    )
    .ilike("title", `%${keyword}%`);

  if (tagFilters.length > 0) query = query.overlaps("tags", tagFilters);

  if (orgFilters.length > 0) {
    query = query.in("org_name", orgFilters);
  }

  if (sortMethod === "Event Name (A-Z)")
    query = query.order("title", { ascending: true });
  else if (sortMethod == "Most Recent")
    query = query.order("start_date", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  return { events: data, error };
};
