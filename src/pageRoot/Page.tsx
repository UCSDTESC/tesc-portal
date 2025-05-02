import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import type { User, UserCredentials } from "@lib/UserContext";
import { signIn, fetchUser, signOut, signUp } from "@services/user";

import Navbar from "./Navbar";

export default function Page() {
  const [User, setUser] = useState<User>({ id: "", email: "" });
  const [Error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // sign in user
  const handleSignIn = async ({ email, password }: UserCredentials, OnSuccess: () => void) => {
    const { user, error } = await signIn(email, password);
    if (user && user?.email) {
      setError("");
      setUser({ id: user.id, email: user.email });
      OnSuccess();
    }
    if (error) {
      setError(error.message);
    }
  };

  // sign up user
  const handleSignUp = async ({ email, password }: UserCredentials, OnSuccess: () => void) => {
    const { user, error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else if (user && user?.email) {
      setUser({ id: user?.id, email: user?.email });
      OnSuccess();
    }
  };

  // sign out user
  const handleSignOut = async () => {
    const error = await signOut();
    if (error) {
      setError(error.message);
    } else {
      setUser({ id: "", email: "" });
      navigate("");
    }
  };

  // get current user
  useEffect(() => {
    const getUser = async () => {
      const user = await fetchUser();
      if (user && user.email) {
        setUser({ id: user.id, email: user.email });
      } else {
        setUser({ id: "", email: "" });
        if (location.pathname !== "" && !location.pathname.includes("bulletin")) navigate("");
      }
    };
    getUser();
  }, [navigate]);

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
          handleSignUp
        }}
      >
        <Navbar />
        <div className="py-[15vh] w-full flex justify-center">
          <Outlet />
        </div>
      </UserContext.Provider>
    </main>
  );
}
