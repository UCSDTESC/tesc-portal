import Modal from "@mui/material/Modal";
import { useEffect, useState } from "react";
import { FileText, User as UserIcon, X } from "lucide-react";
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
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="text-sm text-ink">{value || "—"}</p>
    </div>
  );
}

function initialsFor(user: AdminUserDetail) {
  const first = user.first_name?.trim()?.[0] ?? "";
  const last = user.last_name?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || user.email?.[0]?.toUpperCase() || "?";
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
      <div className="absolute top-0 right-0 h-full w-[min(96vw,760px)] overflow-y-auto border-l border-line bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
              {user ? initialsFor(user) : "?"}
            </div>
            <div className="min-w-0">
              <h2 id="user-admin-detail" className="truncate text-lg font-semibold tracking-tight text-ink">
                {displayName}
              </h2>
              {user?.email && <p className="truncate text-sm text-ink-secondary">{user.email}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          {loading && <p className="text-sm text-ink-muted">Loading user…</p>}

          {!loading && user && (
            <>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                  <UserIcon className="h-4 w-4 text-brand-500" />
                  Profile
                </h3>
                <div className="card-shadow grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
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
                    <div className="grid gap-1 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Resume link
                      </p>
                      <a
                        href={user.resume_link}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm text-brand-600 underline"
                      >
                        {user.resume_link}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {previewUrl && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                    <FileText className="h-4 w-4 text-brand-500" />
                    Resume preview
                  </h3>
                  <div className="card-shadow rounded-2xl border border-line bg-white p-5">
                    <iframe
                      src={previewUrl}
                      title="Resume preview"
                      className="h-[420px] w-full rounded-xl border border-line"
                    />
                  </div>
                </section>
              )}

              <section>
                <UserRolesEditor
                  user={user}
                  roles={roles}
                  orgs={orgs}
                  onUpdated={handleRolesUpdated}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
