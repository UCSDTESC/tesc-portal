import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import type { User, UserCredentials } from "@lib/UserContext";
import { signIn, fetchUser, signOut, signUp } from "@services/user";

import Navbar from "./Navbar";
import useToast from "@lib/hooks/useToast";

export default function Page() {
  const [User, setUser] = useState<User>({ id: "", email: "", role: "" });
  const [Error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // sign in user
  const handleSignIn = async (
    { email, password }: UserCredentials,
    OnSuccess: () => void
  ) => {
    const { user, error } = await signIn(email, password);
    if (user && user?.email) {
      setError("");
      setUser({ id: user.id, email: user.email, role: user.role });
      OnSuccess();
      useToast("Succesfully logged in", "success");
    }
    if (error) {
      console.error(error.message);
      useToast("Error signing in", "error");
    }
  };

  // sign up user
  const handleSignUp = async (
    { email, password }: UserCredentials,
    OnSuccess: () => void
  ) => {
    const { user, error } = await signUp(email, password);
    if (error) {
      console.error(error.message);
      useToast("Error signing up", "error");
    } else if (user && user?.email) {
      setUser({
        id: user?.id,
        email: user?.email,
        role: user.role ? user.role : "unknown",
      });
      OnSuccess();
      useToast("Succesfully logged in", "success");
    }
  };

  // sign out user
  const handleSignOut = async () => {
    const error = await signOut();
    if (error) {
      console.error(error.message);
      useToast("Error logging out", "error");
    } else {
      setUser({ id: "", email: "", role: "" });
      navigate("");
      useToast("Succesfully logged out", "success");
    }
  };

  // get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await fetchUser();
        if (user && user.email) {
          setUser({ id: user.id, email: user.email, role: user.role });
        } else {
          setUser({ id: "", email: "", role: "" });
          if (
            location.pathname !== "" &&
            !location.pathname.includes("bulletin")
          )
            navigate("");
        }
      } catch (err) {
        console.error(err);
      }
    };
    getUser();
  }, [location.pathname, navigate]);

  return (
    <main>
      <UserContext.Provider
        value={{
          User,
          Error,
          showLoginModal,
          setShowLoginModal,
          setError,
          handleSignIn,
          handleSignOut,
          handleSignUp,
        }}
      >
        <Navbar />
        <div className="py-[10vh] w-full flex justify-center">
          <Outlet />
        </div>
      </UserContext.Provider>
    </main>
  );
}
