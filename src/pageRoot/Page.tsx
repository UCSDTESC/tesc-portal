import { useEffect, useState } from "react";
import UserContext from "../UserContext";
import type { User, UserCredentials } from "../UserContext";
import Navbar from "./Navbar";
import { Outlet, useNavigate } from "react-router";
import { signIn, fetchUser, signOut, signUp } from "../services/user";

export default function Page() {
  const [User, setUser] = useState<User>({ id: "", email: "" });
  const [Error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  // sign in user
  const handleSignIn = async (
    { email, password }: UserCredentials,
    OnSuccess: () => void
  ) => {
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
  const handleSignUp = async (
    { email, password }: UserCredentials,
    OnSuccess: () => void
  ) => {
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
        navigate("");
      }
    };
    getUser();
  }, []);

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
        <div className="pt-[15vh]">
          <Outlet />
        </div>
      </UserContext.Provider>
    </main>
  );
}
