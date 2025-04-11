import { useEffect, useState } from "react";
import UserContext from "../UserContext";
import supabase from "../supabase/supabase";
import type { User, UserCredentials } from "../UserContext";
import Navbar from "./Navbar";
import { Outlet, useNavigate } from "react-router";
export default function Page() {
  const [User, setUser] = useState<User>({ id: "", email: "" });
  const [Error, setError] = useState("");
  const navigate = useNavigate();
  const handleSignIn = async (
    { email, password }: UserCredentials,
    OnSuccess: () => void
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (data.user && data.user?.email) {
      console.log(data);
      setError("");
      setUser({ id: data.user.id, email: data.user.email });
      OnSuccess();
    }
    if (error) {
      setError(error.message);
    }
  };

  const handleSignUp = async (
    { email, password }: UserCredentials,
    OnSuccess: () => void
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (data.user) {
      const { error } = await supabase
        .from("Users")
        .insert({ uuid: data.user?.id, email: data.user?.email });
      if (error) {
        setError(error.message);
      } else {
        if (data.user && data.user?.email)
          setUser({ id: data.user?.id, email: data.user?.email });
        OnSuccess();
      }
    }
    if (error) {
      setError(error.message);
    }
  };
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        console.log(user);
        setUser({ id: user.id, email: user.email });
      }
    };
    getUser();
  }, []);
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      console.log(error);
    } else {
      setUser({ id: "", email: "" });
      navigate("");
    }
  };
  return (
    <main>
      <UserContext.Provider
        value={{
          User,
          Error,
          setError,
          handleSignIn,
          handleSignOut,
          handleSignUp,
        }}
      >
        <Navbar />
        <Outlet />
      </UserContext.Provider>
    </main>
  );
}
