import supabase from "../supabase/supabase";

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
  return user;
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
    const user = data.user;
    return { user, error };
  } else return { user: null, error };
};
