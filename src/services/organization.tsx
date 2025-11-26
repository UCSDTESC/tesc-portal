import supabase from "@server/supabase";

export const fetchOrgs = async () => {
  console.log("------------FECTHING ORG NAMES----------------");
  const { data, error } = await supabase.from("org_emails").select("org_name");
  if (data) {
    const events = data.map((item) => item.org_name);
    return { events, error };
  }
  return { events: null, error };
};

export const fetchGradYears = async () => {
  console.log("------------FECTHING GRAD YEARS----------------");
  const { data, error } = await supabase.from("Users").select("expected_grad");
  if (data) {
    const events = data
      .filter((item) => item.expected_grad !== null && item.expected_grad !== undefined)
      .map((item) => item.expected_grad);
    const unique = [...new Set(events)];
    return { gradYears: unique, error };
  }
  return { gradYears: null, error };
};
