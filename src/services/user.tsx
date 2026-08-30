import supabase from "@server/supabase";

type RoleRow = { roles: { name: string } };

function resolveUserRole(roleRows: RoleRow[] | null | undefined): string {
  if (!roleRows?.length) return "member";
  const names = roleRows.map((row) => row.roles.name.trim());
  if (names.includes("company")) return "company";
  if (names.includes("super_user")) return "super_user";
  if (names.includes("internal")) return "internal";
  if (names.includes("org leader")) return "org leader";
  return names[0] ?? "member";
}

async function fetchUserRole(userId: string) {
  const { data } = await supabase
    .from("user_org_roles")
    .select("roles(name)")
    .eq("user_uuid", userId);
  return resolveUserRole(data as RoleRow[] | null);
}

async function finalizeUserSignup(resumeVisible = true) {
  const { error } = await supabase.rpc("finalize_user_signup", {
    p_resume_visible: resumeVisible,
  });
  return error;
}

async function ensureUserProfile(userId: string) {
  const { data: profile } = await supabase
    .from("users")
    .select("uuid")
    .eq("uuid", userId)
    .maybeSingle();

  if (!profile) {
    const finalizeError = await finalizeUserSignup();
    if (finalizeError) return finalizeError;
  }

  return null;
}

export const signIn = async (email: string, password: string) => {
  console.log("-----Sign in User-----");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  if (error) return { user: null, error };
  console.log("Fetch user role");
  const profileError = await ensureUserProfile(data.user.id);
  if (profileError) return { user: null, error: profileError };
  const role = await fetchUserRole(data.user.id);
  const user = {
    id: data.user.id,
    email: data.user.email,
    role
  };
  return { user, error };
};

export const fetchUser = async () => {
  console.log("------FETCH USER---------");
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const profileError = await ensureUserProfile(user.id);
  if (profileError) return null;
  const role = await fetchUserRole(user.id);
  return {
    id: user.id,
    email: user.email,
    role
  };
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

export const signInWithGoogle = async () => {
  const redirectTo =
    typeof globalThis !== "undefined" && "location" in globalThis
      ? globalThis.location.origin
      : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });
  return { data, error };
};

export const verifyOTP = async (
  email: string,
  token: string,
  type: "email" | "recovery",
  resumeVisible = true,
) => {
  console.log("-----------verify User otp-------------");
  const { data, error } = await supabase.auth.verifyOtp({ email: email, token: token, type: type });
  if (error) return { user: null, error };
  // For email verification (signup), add user to Users table.
  // For recovery, verification will sign the user in (session) and we don't need to insert into Users.
  if (data.user) {
    if (type === "email") {
      console.log("finalize user signup");
      const finalizeError = await finalizeUserSignup(resumeVisible);
      if (finalizeError) return { user: null, error: finalizeError };

      const role = await fetchUserRole(data.user.id);
      const user = {
        id: data.user.id,
        email: data.user.email,
        role,
      };
      return { user, error: null };
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
  const { data, error } = await supabase
    .from("events_log")
    .select("event_id, event_slot_id, attended, users!inner(email)")
    .eq("users.email", email);
  if (data) {
    const rsvpByEvent: Record<string, string> = {};
    const attendedByEvent: Record<string, string> = {};
    for (const row of data) {
      const eventId = String(row.event_id);
      const slotId = row.event_slot_id ? String(row.event_slot_id) : "";
      if (row.attended) {
        attendedByEvent[eventId] = slotId;
      } else {
        rsvpByEvent[eventId] = slotId;
      }
    }
    return { rsvpByEvent, attendedByEvent, error: null };
  }
  return { rsvpByEvent: null, attendedByEvent: null, error };
};

export const editRSVP = async (
  eventId: string,
  slotId: string,
  action: "rsvp" | "cancel" | "switch",
) => {
  console.log("---update RSVP info----");
  const { error } = await supabase.rpc("manage_event_rsvp", {
    p_event_id: Number(eventId),
    p_event_slot_id: Number(slotId),
    p_action: action,
  });
  return error;
};

export const logAttendance = async (
  selection: string,
  id: string,
  userInput: string | null,
  eventSlotId?: string | null,
) => {
  console.log("---Validate attendance---");
  const { error } = await supabase.rpc("validate_attendance", {
    p_user_id: id,
    p_event_id: Number(selection),
    p_password: userInput,
    p_event_slot_id: eventSlotId ? Number(eventSlotId) : null,
  });
  if (!error) {
    console.log("Get User attendance from Users");
    const { data, error: userError } = await supabase.from("users").select("attended").eq("uuid", id);
    if (!userError && data?.[0]) {
      const currAttended = data[0].attended;
      const { error: updateError } = await supabase
        .from("users")
        .update({ attended: [...currAttended, selection] })
        .eq("uuid", id);
      if (updateError) return updateError;
    }
  }
  return error;
};

// for attended events list
export const fetchAttendedEvents = async (userId: string) => {
  console.log("---Fetch User Attended Events---");
  // base cases
  const { data: logData, error: logError } = await supabase
    .from("events_log")
    .select("event_id, points")
    .eq("user_id", userId)
    .eq("attended", true);
  
  if (logError) {
    console.error("Error fetching event log:", logError);
    return { events: null, error: logError };
  }
  if (!logData || logData.length == 0) {
    return { events: [], error: null };
  }

  console.log("Fetching attended event details");
  // extract IDs
  const attendedEventsIds = logData.map((log) => log.event_id);
  const { data: eventDetails, error: detailsError } = await supabase
    .from("events")
    .select(
      `
      id, 
      title, 
      start_date, 
      end_date, 
      location, 
      location_str, 
      content, 
      tags, 
      poster,
      org_id, 
      orgs!inner(name, pfp_str) 
      `
    )
    .in("id", attendedEventsIds)
    .eq("deleted", false);

  if (detailsError) {
    console.error("Error fetching event details:", detailsError);
    return { events: null, error: detailsError };
  }
  
  const attendedEventsWithPoints = eventDetails.map(event => {
    const logEntry = logData.find(log => log.event_id === event.id);
    return {
      id: event.id,
      title: event.title,
      date: `${event.start_date} - ${event.end_date}`,
      location: event.location_str,
      points: logEntry ? logEntry.points : 0,
      category: event.tags[0] || 'General',
      description: event.content,
      coverImage: event.poster,
    };
  });

  return { events: attendedEventsWithPoints, error: null };
};