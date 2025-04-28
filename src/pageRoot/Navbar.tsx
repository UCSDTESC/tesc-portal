import { useContext } from "react";
import { NavLink } from "react-router";
import { createPortal } from "react-dom";

import UserContext from "@lib/UserContext";

import LoginModal from "./LoginModal";

export default function Navbar() {
  const { User, handleSignOut } = useContext(UserContext);
  console.log(User);
  const { showLoginModal, setShowLoginModal } = useContext(UserContext);
  return (
    <nav className="w-full h-[10vh] bg-green-200 text-[3vh] flex justify-between items-center px-10 absolute top-0 z-10">
      {User && User.id && (
        <>
          Logged in: {User.email}
          <NavLink to="/">Home</NavLink>
          <NavLink to="/bulletin">Bulletin</NavLink>
          <NavLink to="/form">Form</NavLink>
          <NavLink to="/data">Data</NavLink>
          <NavLink to="/profile">profile</NavLink>
          <button
            className="rounded-lg border border-black px-5 cursor-pointer h-1/2 right-10 bg-red-400 hover:bg-red-500"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </>
      )}
      {!User ||
        (!User.id && (
          <>
            <NavLink to="/bulletin">Bulletin</NavLink>
            <button
              className="rounded-lg border border-black px-5 cursor-pointer h-1/2 right-10 bg-green-400 hover:bg-green-500"
              onClick={() => {
                setShowLoginModal(true);
              }}
            >
              Log in
            </button>
          </>
        ))}
      {showLoginModal &&
        createPortal(
          <LoginModal
            onclose={() => {
              setShowLoginModal(false);
            }}
          />,
          document.body
        )}
    </nav>
  );
}
