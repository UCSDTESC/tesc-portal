import { useContext } from "react";
import { NavLink } from "react-router";
import { createPortal } from "react-dom";
import UserContext from "@lib/UserContext";
import LoginModal from "./LoginModal";
import TESC from "/TESC.png";
export default function Navbar() {
  const { User, handleSignOut } = useContext(UserContext);
  const { showLoginModal, setShowLoginModal } = useContext(UserContext);

  return (
    <nav className="w-full h-[10vh] bg-blue text-white text-[3vh] flex justify-between items-center px-10 absolute top-0 z-10">
      {User && User.id && (
        <>
          <NavLink to="/">
            <img src={TESC} alt="" className="h-[40px]" />
          </NavLink>
          <div className="flex gap-4">
            <NavLink to="/bulletin">Bulletin</NavLink>
            {User.role === "internal" && (
              <>
                <NavLink to="/form">Form</NavLink>
                <NavLink to="/data">Data</NavLink>
                <NavLink to="/profile">profile</NavLink>
              </>
            )}
            <button
              className="rounded-2xl px-5 cursor-pointer h-1/2 right-10 bg-navy hover:opacity-80"
              onClick={handleSignOut}
            >
              {User.email}
            </button>
          </div>
        </>
      )}
      {!User ||
        (!User.id && (
          <>
            <NavLink to="/bulletin">Bulletin</NavLink>
            <button
              className=" border border-black px-5 cursor-pointer h-1/2 right-10 bg-navy rounded-2xl hover:opacity-80"
              onClick={() => {
                setShowLoginModal(true);
              }}
            >
              Member Log in
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
