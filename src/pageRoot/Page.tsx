import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import type { User, UserCredentials } from "@lib/UserContext";
import supabase from "@server/supabase";
import {
  signIn,
  fetchUser,
  signOut,
  signUp,
  verifyOTP,
  sendPasswordRecovery,
  updatePassword,
  signInWithGoogle,
} from "@services/user";

import Navbar from "./Navbar";
import DisplayToast from "@lib/hooks/useToast";
import Footer from "./Footer";

export default function Page() {
  const [User, setUser] = useState<User | null>(null);
  const [Error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // sign in user
  const handleSignIn = async ({ email, password }: UserCredentials, OnSuccess: () => void) => {
    const { user, error } = await signIn(email, password);
    if (user && user?.email) {
      setError("");
      setUser({ id: user.id, email: user.email, role: user.role });
      OnSuccess();
      DisplayToast("Succesfully logged in", "success");
    }
    if (error) {
      console.error(error.message);
      DisplayToast("Error signing in", "error");
    }
  };

  // sign up user
  const handleSignUp = async ({ email, password }: UserCredentials, OnSuccess: () => void) => {
    const { error } = await signUp(email, password);
    if (error) {
      console.error(error.message);
      DisplayToast("Error signing up", "error");
    } else {
      // setUser({
      //   id: user?.id,
      //   email: user?.email,
      //   role: user.role ? user.role : "unknown"
      // });
      OnSuccess();
      // DisplayToast("Succesfully logged in", "success");
    }
  };

  const handleVerifyOTP = async (
    { email, password: Token, type }: UserCredentials & { type: "email" | "recovery" },
    onSuccess: () => void,
  ) => {
    const { user, error } = await verifyOTP(email, Token, type);
    if (error) {
      console.error(error.message);
      DisplayToast("Error verifying OTP", "error");
    } else {
      setUser({
        id: user?.id ? user?.id : "",
        email: user?.email ? user?.email : "",
        role: user?.role ? user.role : "unknown",
      });
      onSuccess();
      DisplayToast("Succesfully logged in", "success");
    }
  };

  // sign out user
  const handleSignOut = async () => {
    const error = await signOut();
    if (error) {
      console.error(error.message);
      DisplayToast("Error logging out", "error");
    } else {
      setUser({ id: "", email: "", role: "" });
      navigate("bulletin");
      DisplayToast("Succesfully logged out", "success");
    }
  };

  // send recovery OTP to email
  const handleSendRecovery = async (email: string, OnSuccess: () => void) => {
    const { error } = await sendPasswordRecovery(email);
    if (error) {
      console.error(error.message);
      DisplayToast("Error sending recovery OTP", "error");
    } else {
      OnSuccess();
      DisplayToast("Recovery OTP sent", "success");
    }
  };

  // update password for authenticated user (after verifying OTP)
  const handleUpdatePassword = async (password: string, OnSuccess: () => void) => {
    const error = await updatePassword(password);
    if (error) {
      console.error(error.message);
      DisplayToast("Error updating password", "error");
    } else {
      OnSuccess();
      DisplayToast("Password updated", "success");
    }
  };

  // sign in with Google
  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error(error.message);
      DisplayToast("Error signing in with Google", "error");
    }
    // Note: User will be set via auth state change listener when OAuth completes
  };

  // listen for auth state changes (handles OAuth callbacks)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && session?.user) {
        // User signed in (including OAuth)
        try {
          // Check if user exists in users table (for OAuth users who sign in for first time)
          if (session.user.email) {
            const { data: existingUser } = await supabase
              .from("users")
              .select("uuid")
              .eq("uuid", session.user.id)
              .single();

            // If user doesn't exist in users table, insert them (for Google OAuth first-time sign-in)
            if (!existingUser) {
              console.log("Inserting new OAuth user into database");
              await supabase.from("users").insert({
                uuid: session.user.id,
                email: session.user.email,
              });
            }
          }

          const user = await fetchUser();
          if (user && user.email) {
            setUser({ id: user.id, email: user.email, role: user.role });
            DisplayToast("Successfully logged in", "success");
            // Close login modal if open
            setShowLoginModal(false);
          }
        } catch (err) {
          console.error("Error fetching user after auth:", err);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // get current user
  useEffect(() => {
    // if (location.pathname.includes("bulletin")) return;
    if (User) return;
    const getUser = async () => {
      try {
        const user = await fetchUser();
        if (user && user.email) {
          setUser({ id: user.id, email: user.email, role: user.role });
        } else {
          setUser({ id: "", email: "", role: "" });
          if (location.pathname !== "" && !location.pathname.includes("bulletin"))
            navigate("bulletin");
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
          handleSignInWithGoogle,
          handleVerifyOTP,
          handleSendRecovery,
          handleUpdatePassword,
        }}
      >
        <Navbar />
        <div className="pt-[10vh] w-full flex justify-center">
          <Outlet />
        </div>
        <Footer />
      </UserContext.Provider>
    </main>
  );
}
