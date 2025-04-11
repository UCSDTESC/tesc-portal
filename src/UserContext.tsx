import { createContext } from "react";
export interface UserCredentials {
  email: string;
  password: string;
}
export interface User {
  id: string;
  email: string;
}

interface UserContext {
  User: {
    id: string;
    email: string;
  } | null;
  Error: string;
  setError:(error:string)=>void
  handleSignOut: () => void;
  handleSignIn: (user: UserCredentials, OnSuccess: () => void) => void;
  handleSignUp: (user: UserCredentials, OnSuccess: () => void) => void;
}
const UserContext = createContext<UserContext>({
  User: null,
  Error: "",
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
});
export default UserContext;
