import supabase from "@server/supabase";

export const fetchOrgs = async () => {
  const { data, error } = await supabase.from("org_emails").select("org_name");
  if (data) {
    const events = data.map((item) => item.org_name);
    return { events, error };
  }
  return { events: null, error };
};
