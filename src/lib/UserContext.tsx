import { createContext } from "react";
export interface UserCredentials {
  email: string;
  password: string;
}
export interface User {
  id: string;
  email: string;
  role: string;
}

interface UserContext {
  User: User | null;
  Error: string;
  showLoginModal: boolean;
  setShowLoginModal: (bool: boolean) => void;
  setError: (error: string) => void;
  handleSignOut: () => void;
  handleSignIn: (user: UserCredentials, OnSuccess: () => void) => void;
  handleSignUp: (user: UserCredentials, OnSuccess: () => void) => void;
  handleSignInWithGoogle: () => void;
  handleVerifyOTP: (
    { email, password, type }: UserCredentials & { type: "email" | "recovery" },
    OnSuccess: () => void,
  ) => void;
  handleSendRecovery: (email: string, OnSuccess: () => void) => void;
  handleUpdatePassword: (password: string, OnSuccess: () => void) => void;
}
const UserContext = createContext<UserContext>({
  User: null,
  Error: "",
  showLoginModal: false,
  setShowLoginModal: () => {},
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
  handleSignInWithGoogle: () => {
    console.log("Sign in with Google");
  },
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
});
export default UserContext;
