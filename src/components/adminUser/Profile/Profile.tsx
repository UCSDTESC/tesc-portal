import UserContext from "@lib/UserContext";
import { canManageOrgMembers, canManageOrgProfile, canManageUsers } from "@lib/constants";
import supabase from "@server/supabase";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import Modal from "@mui/material/Modal";
import EditProfileForm from "./EditMemberProfile";
import EditOrgModal from "./EditOrgModal";
import PageAllAttendEvents from "@components/User/PageAllAttendEvents";
import ProfileAdminTables from "./ProfileAdminTables";

export default function Profile() {
  const { User, activeOrgName, activeOrgRole, myOrgs } = useContext(UserContext);
  const location = useLocation();
  const [imageUrl, setImageUrl] = useState("");
  const [editModal, setEditModal] = useState(false);

  const canManageOrg = canManageOrgProfile(activeOrgRole);
  const showUserAdmin = canManageUsers(activeOrgName, activeOrgRole);
  const showOrgMembers = canManageOrgMembers(activeOrgName, activeOrgRole);
  const activeOrgId = useMemo(
    () => myOrgs.find((org) => org.name === activeOrgName)?.id,
    [myOrgs, activeOrgName],
  );

  useEffect(() => {
    document.title = canManageOrg
      ? `${activeOrgName || "Organization"} | TESC Portal`
      : "My Profile | TESC Portal";
  }, [activeOrgName, canManageOrg]);

  useEffect(() => {
    if (!canManageOrg || !activeOrgName) {
      setImageUrl("");
      return;
    }

    const fetchOrgProfilePicture = async () => {
      const { data, error } = await supabase
        .from("orgs")
        .select("pfp_str")
        .eq("name", activeOrgName)
        .maybeSingle();

      if (error || !data?.pfp_str) {
        setImageUrl("");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("profile.images")
        .getPublicUrl(`${activeOrgName}/${data.pfp_str}`);
      setImageUrl(urlData.publicUrl);
    };

    fetchOrgProfilePicture();
  }, [canManageOrg, activeOrgName, editModal]);

  const controlEditModal = () => {
    setEditModal(!editModal);
  };

  if (location.pathname.endsWith("/all-attended-events")) {
    return <PageAllAttendEvents />;
  }

  return (
    <div className="flex flex-col w-full min-h-screen mt-8 px-[min(15px,2vw)] gap-10 pb-12">
      {canManageOrg && activeOrgName && (
        <section className="flex flex-col lg:flex-row lg:flex-nowrap items-start w-full gap-6">
          <div className="flex w-[max(30vw,300px)] max-w-full lg:flex-[0_0_10%] lg:w-full flex-col items-center justify-center gap-2 min-w-0 px-1 shrink-0 self-center lg:self-start">
            <div className="w-full aspect-square rounded-full overflow-hidden relative border border-slate-400">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100" />
              )}
              <button
                onClick={controlEditModal}
                className="absolute bottom-0 w-full h-fit flex justify-center bg-black/30 cursor-pointer text-white text-[clamp(0.5rem,2vw,0.75rem)] py-0.5"
              >
                Edit +
              </button>
            </div>
            <h1 className="text-[clamp(0.875rem,2.5vw,1.25rem)] text-blue font-bold text-center leading-tight break-words w-full">
              {activeOrgName}
            </h1>
          </div>
          <div className="flex flex-[1_1_90%] min-w-0 flex-col gap-4">
            <ProfileAdminTables
              orgName={activeOrgName === "super_org" ? undefined : activeOrgName}
              orgId={activeOrgId}
              showUserAdmin={showUserAdmin}
              showOrgMembers={showOrgMembers}
            />
          </div>
          {activeOrgId && (
            <Modal
              open={editModal}
              onClose={controlEditModal}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <EditOrgModal orgUuid={Number(activeOrgId)} controlModal={controlEditModal} />
              </div>
            </Modal>
          )}
        </section>
      )}

      {User?.role !== "company" && (
        <section className="flex flex-wrap justify-center w-full gap-8">
          <EditProfileForm />
        </section>
      )}
    </div>
  );
}
