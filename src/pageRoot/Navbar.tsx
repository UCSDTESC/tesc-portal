import { useContext } from "react";
import { NavLink } from "react-router";
import { createPortal } from "react-dom";
import UserContext from "@lib/UserContext";
import LoginModal from "./LoginModal";
import TESC from "/TESC.png";
import BasicMenu from "@components/User/BasicMenu";
export default function Navbar() {
  const { showLoginModal, setShowLoginModal } = useContext(UserContext);

  return (
    <nav className="w-full h-[10vh] bg-blue text-white text-[3vh] flex justify-between items-center px-4 absolute top-0 z-10">
      <NavLink to="/">
        <img src={TESC} alt="" className="h-[40px]" />
      </NavLink>
      <div className="flex gap-4">
        <BasicMenu />
      </div>
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
