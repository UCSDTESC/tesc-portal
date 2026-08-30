import Modal from "@mui/material/Modal";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/components/ui/card";
import { Button } from "@components/components/ui/button";
import DisplayToast from "@lib/hooks/useToast";
import { getPdfPreviewUrl, isValidUrl } from "@lib/utils";
import { getResumeSignedUrl } from "@services/resume";
import type { AdminUserDetail, OrgOption, RoleOption } from "@services/adminUsers";
import { fetchOrgOptions, fetchRoleOptions, getUserAdminDetail } from "@services/adminUsers";
import UserRolesEditor from "./UserRolesEditor";

type Props = {
  userId: string | null;
  onClose: () => void;
  onRolesChanged: () => void;
};

function ProfileField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export default function UserDetailDrawer({ userId, onClose, onRolesChanged }: Props) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadUser = async () => {
    if (!userId) return;
    setLoading(true);
    const { user: detail, error } = await getUserAdminDetail(userId);
    setLoading(false);
    if (error || !detail) {
      DisplayToast(error?.message ?? "Failed to load user", "error");
      return;
    }
    setUser(detail);
  };

  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }
    loadUser();
  }, [userId]);

  useEffect(() => {
    const loadOptions = async () => {
      const [{ roles: roleOptions }, { orgs: orgOptions }] = await Promise.all([
        fetchRoleOptions(),
        fetchOrgOptions(),
      ]);
      setRoles(roleOptions);
      setOrgs(orgOptions);
    };
    if (userId) loadOptions();
  }, [userId]);

  useEffect(() => {
    const loadPreview = async () => {
      if (!user) {
        setPreviewUrl(null);
        return;
      }
      if (user.resume_storage_path) {
        const { url } = await getResumeSignedUrl(user.resume_storage_path);
        setPreviewUrl(url);
        return;
      }
      if (user.resume_link && isValidUrl(user.resume_link)) {
        setPreviewUrl(getPdfPreviewUrl(user.resume_link).previewUrl);
        return;
      }
      setPreviewUrl(null);
    };
    loadPreview();
  }, [user]);

  const handleRolesUpdated = async () => {
    await loadUser();
    onRolesChanged();
  };

  const displayName =
    user && (user.first_name || user.last_name)
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : user?.email ?? "User";

  return (
    <Modal open={Boolean(userId)} onClose={onClose} aria-labelledby="user-admin-detail">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(96vw,900px)] max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 md:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="user-admin-detail" className="text-xl font-semibold">
              {displayName}
            </h2>
            {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading user…</p>}

        {!loading && user && (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <ProfileField label="First name" value={user.first_name} />
                  <ProfileField label="Last name" value={user.last_name} />
                  <ProfileField label="Major" value={user.major} />
                  <ProfileField label="Graduation year" value={user.expected_grad} />
                  <ProfileField label="Points" value={user.points} />
                  <ProfileField label="Open RSVPs" value={user.rsvp_count} />
                  <ProfileField label="Events attended" value={user.attended_count} />
                  <ProfileField
                    label="Resume visible to recruiters"
                    value={user.resume_visible ? "Yes" : "No"}
                  />
                  {user.resume_link && (
                    <div className="sm:col-span-2 grid gap-1">
                      <p className="text-xs font-medium text-muted-foreground">Resume link</p>
                      <a
                        href={user.resume_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue underline break-all"
                      >
                        {user.resume_link}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {previewUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resume preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <iframe
                      src={previewUrl}
                      title="Resume preview"
                      className="w-full h-[420px] border rounded-md"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <UserRolesEditor
              user={user}
              roles={roles}
              orgs={orgs}
              onUpdated={handleRolesUpdated}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
