import UserContext from "@lib/UserContext";
import { canManageOrgMembers, canManageOrgProfile, canManageUsers } from "@lib/constants";
import supabase from "@server/supabase";
import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { Pencil, Users } from "lucide-react";
import Modal from "@mui/material/Modal";
import PageHeader from "@components/shell/PageHeader";
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
    <div className="flex w-full flex-col gap-6 pb-12">
      <div className="flex items-start gap-4">
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl bg-surface ring-1 ring-line sm:w-24">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-navy-900 text-2xl font-bold text-white">
              {activeOrgName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {canManageOrg && (
            <button
              onClick={controlEditModal}
              className="absolute bottom-0 flex w-full cursor-pointer justify-center bg-black/40 py-1 text-xs font-semibold text-white transition-colors hover:bg-black/55"
            >
              Edit +
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <PageHeader
            eyebrow="Organization"
            title={activeOrgName}
            subtitle="Manage this organization's events, members, and attendance insights."
            actions={
              canManageOrg ? (
                <button
                  type="button"
                  onClick={controlEditModal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface"
                >
                  <Pencil className="h-4 w-4" />
                  Edit organization
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      {canManageOrg ? (
        <div className="flex flex-col gap-8">
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
        </div>
      ) : (
        <div className="card-shadow flex items-start gap-3 rounded-2xl border border-line bg-white p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-ink-secondary">
            You are a member of this organization. Board or org leader access is required to
            manage events, members, and attendance insights.
          </p>
        </div>
      )}

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
    </div>
  );
}
