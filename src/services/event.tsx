import supabase from "@server/supabase";
import { formdata } from "@lib/constants";
import { User } from "@lib/UserContext";
export const fetchEventByOrg = async (uid: string) => {
  const { data, error } = await supabase
    .from("Events")
    .select()
    .eq("UID", uid)
    .eq("deleted", false);
  return { data, error };
};

export const createEvent = async (User: User, formData: formdata) => {
  const { data: org_name } = await supabase
    .from("org_emails")
    .select("org_name")
    .eq("email", User.email);
  if (org_name) {
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
      poster: formData.poster
    });
    return error;
  }
};

export const deleteEvent = async (id: number) => {
  const { error } = await supabase.from("Events").update({ deleted: true }).eq("id", id);
  return error;
};

export const updateEvent = async (eventId: number, uid: string, formData: formdata) => {
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
      poster: formData.poster
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
      "UID,content,created_at,end_date,id,location_str,start_date,tags,title,attendance,poster,rsvp,Users (uuid,email,pfp_str), org_emails (email,org_name)"
    )
    .ilike("title", `%${keyword}%`)
    .eq("deleted", false);

  if (tagFilters.length > 0) query = query.overlaps("tags", tagFilters);

  if (orgFilters.length > 0) {
    query = query.in("org_name", orgFilters);
  }

  if (sortMethod === "Event Name (A-Z)") query = query.order("title", { ascending: true });
  else if (sortMethod == "Most Recent") query = query.order("start_date", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  return { events: data, error };
};

export const queryPeopleBySearchAndFilters = async (
  keyword: string,
  tagFilters: string[],
  orgFilters: string[],
  sortMethod: string
) => {
  let query = supabase
    .from("Users")
    .select("uuid,email,created_at,points,resume_link,expected_grad,major,first_name,last_name")
    .or(`first_name.ilike.%${keyword}%, last_name.ilike.%${keyword}%, email.ilike.%${keyword}%`)
    .not("resume_link", "is", null);

  if (tagFilters.length > 0) query = query.overlaps("expected_grad", tagFilters);

  if (orgFilters.length > 0) {
    query = query.in("major", orgFilters);
  }

  if (sortMethod === "Events attended") query = query.order("points", { ascending: true });
  else if (sortMethod == "First Name (A-Z)")
    query = query.order("first_name", { ascending: false });
  else if (sortMethod == "Last Name (A-Z)") query = query.order("last_name", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  return { People: data, error };
};
