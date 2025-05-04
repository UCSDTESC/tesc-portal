import supabase from "@server/supabase";

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  const user = data.user;
  return { user, error };
};

export const fetchUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: role } = await supabase
    .from("Users")
    .select("role")
    .eq("email", user?.email);
  if (user && role)
    return { id: user.id, email: user.email, role: role[0].role };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return error;
};

export const signUp = async (email: string, password: string) => {
  // add user to auth table
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error) return { user: null, error };

  // add user to user table
  if (data.user) {
    const { error } = await supabase
      .from("Users")
      .insert({ uuid: data.user?.id, email: data.user?.email });
    const { data: role } = await supabase
      .from("Users")
      .select("role")
      .eq("email", data.user.email);
    const user = {
      id: data.user.id,
      email: data.user.email,
      role: role ? role[0].role : "unknown",
    };
    return { user, error };
  } else return { user: null, error };
};

export const fetchRSVPAndAttended = async (email: string) => {
  const { data, error } = await supabase
    .from("Users")
    .select("rsvp,attended")
    .eq("email", email);
  if (data) {
    return {
      rsvp: data[0].rsvp ? data[0].rsvp : [],
      attended: data[0].attended ? data[0].attended : [],
      error: null,
    };
  } else return { rsvp: null, attended: null, error };
};

export const editRSVP = async (
  id: number,
  email: string,
  remove: boolean,
  currRSVP: number[]
) => {
  // update rsvp array in user table
  const { error } = await supabase
    .from("Users")
    .update({ rsvp: currRSVP })
    .eq("email", email);

  if (error) {
    return error;
  } else {
    // update rsvp count in event table
    const { data, error } = await supabase
      .from("Events")
      .select("rsvp")
      .eq("id", id);

    if (data) {
      const { error } = await supabase
        .from("Events")
        .update({ rsvp: remove ? data[0].rsvp - 1 : data[0].rsvp + 1 })
        .eq("id", id);
      if (error) {
        return error;
      }
    } else return error;
  }

  // return no errors
  return null;
};

export const logAttendance = async () => {};
