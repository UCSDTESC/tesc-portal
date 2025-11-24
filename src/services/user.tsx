import supabase from "@server/supabase";

export const signIn = async (email: string, password: string) => {
  console.log("-----Sign in User-----");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  if (error) return { user: null, error };
  console.log("Fetch user role");
  const { data: role } = await supabase.from("Users").select("role").eq("email", data.user.email);
  const user = {
    id: data.user.id,
    email: data.user.email,
    role: role ? role[0].role : "unknown"
  };
  return { user, error };
};

export const fetchUser = async () => {
  console.log("------FETCH USER---------");
  const {
    data: { user }
  } = await supabase.auth.getUser();
  console.log("Fetch user role");
  const { data: role } = await supabase.from("Users").select("role").eq("email", user?.email);
  if (user && role) return { id: user.id, email: user.email, role: role[0].role };
};

export const signOut = async () => {
  console.log("---Sign User out---");
  const { error } = await supabase.auth.signOut();
  return error;
};

export const signUp = async (email: string, password: string) => {
  // add user to auth table
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  if (error) return { user: null, error };

  // // add user to user table
  // if (data.user) {
  //   const { error } = await supabase
  //     .from("Users")
  //     .insert({ uuid: data.user?.id, email: data.user?.email });
  //   const { data: role } = await supabase
  //     .from("Users")
  //     .select("role")
  //     .eq("email", data.user.email);
  //   const user = {
  //     id: data.user.id,
  //     email: data.user.email,
  //     role: role ? role[0].role : "unknown",
  //   };
  //   return { user, error };
  // } else return { user: null, error };
  return { user: data.user, error };
};

export const verifyOTP = async (email: string, token: string, type: "email" | "recovery") => {
  console.log("-----------verify User otp-------------");
  const { data, error } = await supabase.auth.verifyOtp({ email: email, token: token, type: type });
  if (error) return { user: null, error };
  // For email verification (signup), add user to Users table.
  // For recovery, verification will sign the user in (session) and we don't need to insert into Users.
  if (data.user) {
    if (type === "email") {
      console.log("insert new user into database");
      const { error } = await supabase
        .from("Users")
        .insert({ uuid: data.user?.id, email: data.user?.email });
      console.log("fetch new user role");
      const { data: role } = await supabase
        .from("Users")
        .select("role")
        .eq("email", data.user.email);
      const user = {
        id: data.user.id,
        email: data.user.email,
        role: role ? role[0].role : "unknown"
      };
      return { user, error };
    }
    // recovery or other types: return user info without inserting
    const user = {
      id: data.user.id,
      email: data.user.email,
      role: "unknown"
    };
    return { user, error: null };
  }
  return { user: null, error };
};

export const sendPasswordRecovery = async (email: string) => {
  // triggers Supabase recovery email/OTP
  console.log("---------Send verify OTP-----------");
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const updatePassword = async (password: string) => {
  // updates the currently-authenticated user's password
  console.log("update user password");
  const { error } = await supabase.auth.updateUser({ password });
  return error;
};
export const fetchRSVPAndAttended = async (email: string) => {
  console.log("---fetch RSVP and Attended events---");
  const { data, error } = await supabase.from("Users").select("rsvp,attended").eq("email", email);
  if (data) {
    return {
      rsvp: data[0].rsvp ? data[0].rsvp : [],
      attended: data[0].attended ? data[0].attended : [],
      error: null
    };
  } else return { rsvp: null, attended: null, error };
};

export const editRSVP = async (id: string, email: string, remove: boolean, currRSVP: string[]) => {
  console.log("---update RSVP info----");
  console.log("update rsvp array in user table---");
  // update rsvp array in user table
  const { error } = await supabase.from("Users").update({ rsvp: currRSVP }).eq("email", email);

  if (error) {
    return error;
  } else {
    // update rsvp count in event table
    console.log("get rsvp count in events table");
    const { data, error } = await supabase.from("Events").select("rsvp").eq("id", id);

    if (data) {
      console.log("update rsvp count in events table");
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

export const logAttendance = async (selection: string, id: string, userInput: string | null) => {
  console.log("---Validate attendance---");
  const { error } = await supabase.rpc("validate_attendance", {
    event_id: selection,
    input: userInput,
    user_id: id
  });
  if (!error) {
    console.log("Get User attendance from Users");
    const { data, error } = await supabase.from("Users").select("attended").eq("uuid", id);
    if (!error) {
      const currAttended = data[0].attended;
      const { error } = await supabase
        .from("Users")
        .update({ attended: [...currAttended, selection] })
        .eq("uuid", id);
      if (error) return error;
    }
  }
  return error;
};
