import UserContext from "@lib/UserContext";
import { canManageOrgMembers, canManageOrgProfile, canManageUsers } from "@lib/constants";
import supabase from "@server/supabase";
import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import Modal from "@mui/material/Modal";
import EditOrgModal from "./EditOrgModal";
import ProfileAdminTables from "./ProfileAdminTables";
import OrgAttendanceInsights from "./OrgAttendanceInsights";

export default function OrgManagement() {
  const { User, activeOrgName, activeOrgRole, myOrgs } = useContext(UserContext);
  const [imageUrl, setImageUrl] = useState("");
  const [editModal, setEditModal] = useState(false);

  const belongsToOrg = myOrgs.length > 0;
  const canManageOrg = canManageOrgProfile(activeOrgRole);
  const showUserAdmin = canManageUsers(activeOrgName, activeOrgRole);
  const showOrgMembers = canManageOrgMembers(activeOrgName, activeOrgRole);
  const activeOrgId = useMemo(
    () => myOrgs.find((org) => org.name === activeOrgName)?.id,
    [myOrgs, activeOrgName],
  );

  useEffect(() => {
    document.title = `${activeOrgName || "Organization"} | Org Management`;
  }, [activeOrgName]);

  useEffect(() => {
    if (!belongsToOrg || !activeOrgName) {
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
  }, [belongsToOrg, activeOrgName, editModal]);

  const controlEditModal = () => {
    setEditModal(!editModal);
  };

  if (!User?.id) {
    return <Navigate to="/profile" replace />;
  }

  if (!belongsToOrg) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col gap-10 px-[min(15px,2vw)] pb-12 mt-8">
      <section className="flex w-full flex-col items-start gap-6 lg:flex-row lg:flex-nowrap">
        <div className="flex w-[max(30vw,300px)] max-w-full shrink-0 flex-col items-center justify-center gap-2 self-center px-1 min-w-0 lg:w-full lg:flex-[0_0_10%] lg:self-start">
          <div className="relative aspect-square w-full overflow-hidden rounded-full border border-slate-400">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-slate-100" />
            )}
            {canManageOrg && (
              <button
                onClick={controlEditModal}
                className="absolute bottom-0 flex h-fit w-full cursor-pointer justify-center bg-black/30 py-0.5 text-[clamp(0.5rem,2vw,0.75rem)] text-white"
              >
                Edit +
              </button>
            )}
          </div>
          <h1 className="w-full break-words text-center text-[clamp(0.875rem,2.5vw,1.25rem)] font-bold leading-tight text-blue">
            {activeOrgName}
          </h1>
        </div>
        <div className="flex min-w-0 flex-[1_1_90%] flex-col gap-10">
          {canManageOrg ? (
            <>
              <ProfileAdminTables
                orgName={activeOrgName === "super_org" ? undefined : activeOrgName}
                orgId={activeOrgId}
                showUserAdmin={showUserAdmin}
                showOrgMembers={showOrgMembers}
              />
              <OrgAttendanceInsights
                isSuperOrg={activeOrgName === "super_org"}
                orgId={activeOrgId}
                orgName={activeOrgName === "super_org" ? undefined : activeOrgName}
              />
            </>
          ) : (
            <p className="px-4 text-sm text-slate-600">
              You are a member of this organization. Board or org leader access is required to
              manage events, members, and attendance insights.
            </p>
          )}
        </div>
        {canManageOrg && activeOrgId && (
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
    </div>
  );
}
