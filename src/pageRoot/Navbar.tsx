import { useContext } from "react";
import { NavLink } from "react-router";
import { createPortal } from "react-dom";
import UserContext from "@lib/UserContext";
import LoginModal from "./LoginModal";
import TESC from "/TESC.png";
import BasicMenu from "@components/User/BasicMenu";
export default function Navbar() {
  const { User } = useContext(UserContext);
  const { showLoginModal, setShowLoginModal } = useContext(UserContext);

  return (
    <nav className="w-full h-[10vh] bg-blue text-white text-[3vh] flex justify-between items-center px-4 absolute top-0 z-10">
      <NavLink to="/">
        <img src={TESC} alt="" className="h-[40px]" />
      </NavLink>
      {User && User.id && (
        <>
          <div className="flex gap-4">
            <BasicMenu />
          </div>
        </>
      )}
      {!User ||
        (!User.id && (
          <>
            <button
              className="  px-5 cursor-pointer h-[40px] right-10 bg-navy rounded-full hover:opacity-80"
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
