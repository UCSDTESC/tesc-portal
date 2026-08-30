import { createContext } from "react";
export interface UserCredentials {
  email: string;
  password: string;
}
export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export const PENDING_PROFILE_SETUP_KEY = "tesc_pending_profile_setup";

export type AuthSuccessResult = {
  needsProfileSetup?: boolean;
};

interface UserContext {
  User: User | null;
  Error: string;
  showLoginModal: boolean;
  setShowLoginModal: (bool: boolean) => void;
  pendingProfileSetup: boolean;
  setPendingProfileSetup: (bool: boolean) => void;
  loginRecruiterMode: boolean;
  setLoginRecruiterMode: (bool: boolean) => void;
  setError: (error: string) => void;
  handleSignOut: () => void;
  handleSignIn: (user: UserCredentials, OnSuccess: () => void) => void;
  handleSignUp: (user: UserCredentials, OnSuccess: () => void) => void;
  handleGoogleAuth: () => void;
  handleVerifyOTP: (
    {
      email,
      password,
      type,
      resumeVisible,
    }: UserCredentials & { type: "email" | "recovery"; resumeVisible?: boolean },
    OnSuccess: (result?: AuthSuccessResult) => void,
  ) => void;
  handleSendRecovery: (email: string, OnSuccess: () => void) => void;
  handleUpdatePassword: (password: string, OnSuccess: () => void) => void;
  handleOrgSwitch: (selectedName: string) => void;
  myOrgs: { id: string; name: string }[];
  activeOrgName: string;
  activeOrgRole: string;
}
const UserContext = createContext<UserContext>({
  User: null,
  Error: "",
  showLoginModal: false,
  pendingProfileSetup: false,
  loginRecruiterMode: false,
  myOrgs: [{ id: "0", name: "" }],
  activeOrgName: "",
  activeOrgRole: "",
  setShowLoginModal: () => {},
  setPendingProfileSetup: () => {},
  setLoginRecruiterMode: () => {},
  setError: (error: string) => {
    console.log(error);
  },
  handleSignOut: () => {},
  handleSignIn: (user: UserCredentials) => {
    console.log(user);
  },
  handleSignUp: (user: UserCredentials) => {
    console.log(user);
  },
  handleGoogleAuth: () => {},
  handleVerifyOTP: ({
    email,
    password,
    type,
  }: UserCredentials & { type: "email" | "recovery" }) => {
    console.log(email, password, type);
  },
  handleSendRecovery: (email: string, OnSuccess: () => void) => {
    OnSuccess?.();
    console.log(email);
  },
  handleUpdatePassword: (password: string, OnSuccess: () => void) => {
    OnSuccess?.();
    console.log(password);
  },
  handleOrgSwitch: (selectedName: string) => {
    console.log(selectedName);
  },
});
export default UserContext;
