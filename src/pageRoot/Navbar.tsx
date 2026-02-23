import { useContext } from "react";
import { NavLink } from "react-router";
import { createPortal } from "react-dom";
import UserContext from "@lib/UserContext";
import LoginModal from "./LoginModal";
import TESC from "/TESC.png";
import BasicMenu from "@components/User/BasicMenu";
import { Button } from "@components/components/ui/button";
import { OrgDropdown } from "@components/components/ui/org-dropdown";

export default function Navbar() {
  const { User, myOrgs, activeOrgName, handleOrgSwitch } = useContext(UserContext);
  const { showLoginModal, setShowLoginModal } = useContext(UserContext);

  return (
    <nav className="w-full h-[10vh] bg-blue text-white text-[3vh] flex justify-between items-center px-4 absolute top-0 z-10">
      <NavLink to="/">
        <img src={TESC} alt="" className="h-[40px]" />
      </NavLink>

      {/* switch org feature */}
      {User && User.id && (
        <div className="flex items-center gap-6">
          {myOrgs.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-30 text-black text-base">
                <OrgDropdown
                  organizations={myOrgs}
                  value={activeOrgName}
                  onValueChange={handleOrgSwitch}
                  placeholder="Select Club"
                />
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <BasicMenu />
          </div>
        </div>
      )}

      {!User ||
        (!User.id && (
          <>
            <Button
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
