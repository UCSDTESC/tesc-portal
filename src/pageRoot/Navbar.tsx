import { useContext } from "react";
import { NavLink } from "react-router";
import { createPortal } from "react-dom";
import UserContext from "@lib/UserContext";
import LoginModal from "./LoginModal";
import TESC from "/TESC.png";
import BasicMenu from "@components/User/BasicMenu";
import { Button } from "@components/components/ui/button";
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
            <Button
              // className="rounded-full h-8 px-4 text-sm"
              className="font-DM text-lg font-semibold  px-5 cursor-pointer h-[40px] right-10 bg-navy rounded-full"
              onClick={() => {
                setShowLoginModal(true);
              }}
            >
              Log in
            </Button>
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
