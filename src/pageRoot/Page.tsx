import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import supabase from "@server/supabase";

import UserContext from "@lib/UserContext";
import type { User, UserCredentials } from "@lib/UserContext";
import {
  signIn,
  fetchUser,
  signOut,
  signUp,
  verifyOTP,
  sendPasswordRecovery,
  updatePassword
} from "@services/user";

import Navbar from "./Navbar";
import DisplayToast from "@lib/hooks/useToast";
import Footer from "./Footer";

export default function Page() {
  const [User, setUser] = useState<User | null>(null);
  const [Error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  // -- USER ORGS --
  // org id for drop down, switching btwn orgs on single user
  // org-dropdown
    // call for the clubs that user is in, sort in alphabetical order
  const [myOrgs, setMyOrgs] = useState<{ id: string; name: string }[]>([]);
  const [activeOrgName, setActiveOrgName] = useState<string>("");
  // navigate btwn org accounts
  const navigate = useNavigate();

  useEffect(() => {
    const getMyClubs = async () => {
      if (!User?.id) return;

      const { data: roles, error } = await supabase
        .from("user_org_roles")
        .select("org_uuid, orgs(name)") 
        .eq("user_uuid", User.id);

      if (roles && !error) {
        const formattedOrgs = roles.map((role: any) => ({
          id: String(role.org_uuid),
          name: role.orgs.name
        })).sort((a, b) => a.name.localeCompare(b.name));
        
        setMyOrgs(formattedOrgs);
        if (activeOrgName) { // keep at current org selected
          setActiveOrgName(activeOrgName);
        } else if (formattedOrgs.length > 0 && !activeOrgName) {
          setActiveOrgName(formattedOrgs[0].name); // fall back to first org
        }
      }
    };

    getMyClubs();
  }, [User?.id]);

  // navigate btwn org accounts
  const handleOrgSwitch = (selectedName: string) => {
  setActiveOrgName(selectedName);
};




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
    onSuccess: () => void
  ) => {
    const { user, error } = await verifyOTP(email, Token, type);
    if (error) {
      console.error(error.message);
      DisplayToast("Error verifying OTP", "error");
    } else {
      setUser({
        id: user?.id ? user?.id : "",
        email: user?.email ? user?.email : "",
        role: user?.role ? user.role : "unknown"
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
          handleVerifyOTP,
          handleSendRecovery,
          handleUpdatePassword,
          handleOrgSwitch,
          myOrgs,
          activeOrgName,
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
