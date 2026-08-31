import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import supabase from "@server/supabase";

import UserContext, { PENDING_PROFILE_SETUP_KEY } from "@lib/UserContext";
import type { User, UserCredentials, AuthSuccessResult, PendingQrFlow } from "@lib/UserContext";
import {
  signIn,
  fetchUser,
  signOut,
  signUp,
  signInWithGoogle,
  verifyOTP,
  sendPasswordRecovery,
  updatePassword
} from "@services/user";

import Navbar from "./Navbar";
import DisplayToast from "@lib/hooks/useToast";
import Footer from "./Footer";

export default function Page() {
  const [User, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [Error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProfileSetup, setPendingProfileSetup] = useState(false);
  const [loginRecruiterMode, setLoginRecruiterMode] = useState(false);
  const [pendingQrFlow, setPendingQrFlow] = useState<PendingQrFlow | null>(null);
  const [loginModalContext, setLoginModalContext] = useState("");
  const location = useLocation();

  // -- USER ORGS --
  // org id for drop down, switching btwn orgs on single user
  // org-dropdown
    // call for the clubs that user is in, sort in alphabetical order
  const [myOrgs, setMyOrgs] = useState<{ id: string; name: string }[]>([]);
  const [activeOrgName, setActiveOrgName] = useState<string>("");
  const [orgMemberships, setOrgMemberships] = useState<{ id: string; name: string; role: string }[]>(
    [],
  );
  const navigate = useNavigate();

  const activeOrgRole = useMemo(
    () => orgMemberships.find((org) => org.name === activeOrgName)?.role ?? "",
    [orgMemberships, activeOrgName],
  );

  const userOrgIds = useMemo(() => orgMemberships.map((org) => org.id), [orgMemberships]);

  useEffect(() => {
    const loadUserOrgs = async () => {
      if (!User?.id) {
        setOrgMemberships([]);
        setMyOrgs([]);
        setActiveOrgName("");
        return;
      }

      const { data: roles, error } = await supabase
        .from("user_org_roles")
        .select("org_uuid, roles(name), orgs(name)")
        .eq("user_uuid", User.id);

      if (error || !roles) {
        console.error(error?.message);
        return;
      }

      const memberships = roles
        .map((role) => {
          const row = role as {
            org_uuid: string;
            roles: { name: string } | { name: string }[];
            orgs: { name: string } | { name: string }[];
          };
          const roleName = Array.isArray(row.roles) ? row.roles[0]?.name : row.roles?.name;
          const orgName = Array.isArray(row.orgs) ? row.orgs[0]?.name : row.orgs?.name;
          return {
            id: String(row.org_uuid),
            name: orgName ?? "",
            role: roleName?.trim() ?? "",
          };
        })
        .filter((org) => org.name)
        .sort((a, b) => a.name.localeCompare(b.name));

      setOrgMemberships(memberships);
      setMyOrgs(memberships.map(({ id, name }) => ({ id, name })));

      setActiveOrgName((current) => {
        if (current && memberships.some((org) => org.name === current)) return current;
        return memberships[0]?.name ?? "";
      });
    };

    loadUserOrgs();
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
      setPendingQrFlow(null);
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
      DisplayToast(error.message || "Error signing up", "error");
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

  const handleGoogleAuth = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error(error.message);
      DisplayToast("Error connecting Google account", "error");
    }
  };

  const handleVerifyOTP = async (
    {
      email,
      password: Token,
      type,
      resumeVisible = true,
    }: UserCredentials & { type: "email" | "recovery"; resumeVisible?: boolean },
    onSuccess: (result?: AuthSuccessResult) => void
  ) => {
    const { user, error } = await verifyOTP(email, Token, type, resumeVisible);
    if (error) {
      console.error(error.message);
      DisplayToast(error.message || "Error verifying OTP", "error");
    } else {
      setUser({
        id: user?.id ? user?.id : "",
        email: user?.email ? user?.email : "",
        role: user?.role ? user.role : "unknown"
      });
      setPendingQrFlow(null);
      onSuccess({
        needsProfileSetup: type === "email" && user?.role !== "company",
      });
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
    if (User) {
      setAuthReady(true);
      return;
    }
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
      } finally {
        setAuthReady(true);
      }
    };
    getUser();
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!User?.id) return;
    const pendingSetup = sessionStorage.getItem(PENDING_PROFILE_SETUP_KEY);
    if (!pendingSetup) return;
    sessionStorage.removeItem(PENDING_PROFILE_SETUP_KEY);
    if (User.role === "company") return;
    setPendingProfileSetup(true);
    setShowLoginModal(true);
  }, [User?.id, User?.role]);

  return (
    <main>
      <UserContext.Provider
        value={{
          User,
          authReady,
          Error,
          showLoginModal,
          setShowLoginModal,
          pendingProfileSetup,
          setPendingProfileSetup,
          loginRecruiterMode,
          setLoginRecruiterMode,
          pendingQrFlow,
          setPendingQrFlow,
          loginModalContext,
          setLoginModalContext,
          setError,
          handleSignIn,
          handleSignOut,
          handleSignUp,
          handleGoogleAuth,
          handleVerifyOTP,
          handleSendRecovery,
          handleUpdatePassword,
          handleOrgSwitch,
          myOrgs,
          activeOrgName,
          activeOrgRole,
          userOrgIds,
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
