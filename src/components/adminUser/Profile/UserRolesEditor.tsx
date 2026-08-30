import { useMemo, useState } from "react";
import { Button } from "@components/components/ui/button";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import DisplayToast from "@lib/hooks/useToast";
import type { AdminUserDetail, AdminUserOrgRole, OrgOption, RoleOption } from "@services/adminUsers";
import {
  removeUserOrgRole,
  setUserOrgRole,
} from "@services/adminUsers";

type Props = {
  user: AdminUserDetail;
  roles: RoleOption[];
  orgs: OrgOption[];
  onUpdated: () => void;
};

export default function UserRolesEditor({ user, roles, orgs, onUpdated }: Props) {
  const [pendingOrgId, setPendingOrgId] = useState("");
  const [pendingRoleId, setPendingRoleId] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const assignedOrgIds = useMemo(
    () => new Set(user.roles.map((row) => row.org_uuid)),
    [user.roles],
  );

  const availableOrgs = orgs.filter((org) => !assignedOrgIds.has(org.uuid));

  const handleRoleChange = async (membership: AdminUserOrgRole, nextRoleId: string) => {
    const key = `${membership.org_uuid}`;
    setSavingKey(key);
    const { error } = await setUserOrgRole(user.uuid, membership.org_uuid, Number(nextRoleId));
    setSavingKey(null);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    DisplayToast("Role updated", "success");
    onUpdated();
  };

  const handleRemove = async (membership: AdminUserOrgRole) => {
    const label = `${membership.role_name} @ ${membership.org_name}`;
    if (!window.confirm(`Remove ${label} from this user?`)) return;

    const key = `remove-${membership.org_uuid}`;
    setSavingKey(key);
    const { error } = await removeUserOrgRole(user.uuid, membership.org_uuid);
    setSavingKey(null);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    DisplayToast("Membership removed", "success");
    onUpdated();
  };

  const handleAdd = async () => {
    if (!pendingOrgId || !pendingRoleId) {
      DisplayToast("Select an organization and role", "error");
      return;
    }
    setSavingKey("add");
    const { error } = await setUserOrgRole(user.uuid, Number(pendingOrgId), Number(pendingRoleId));
    setSavingKey(null);
    if (error) {
      DisplayToast(error.message, "error");
      return;
    }
    DisplayToast("Membership added", "success");
    setPendingOrgId("");
    setPendingRoleId("");
    onUpdated();
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Organization roles</h3>

      {user.roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organization memberships yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Organization</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {user.roles.map((membership) => (
                <tr key={membership.user_org_role_uuid} className="border-t">
                  <td className="px-3 py-2">{membership.org_name}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={String(membership.role_id)}
                      onValueChange={(value) => handleRoleChange(membership, value)}
                      disabled={savingKey === String(membership.org_uuid)}
                    >
                      <SelectTrigger className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={savingKey === `remove-${membership.org_uuid}`}
                      onClick={() => handleRemove(membership)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border p-4 flex flex-col gap-3">
        <h4 className="font-medium">Add membership</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Organization</Label>
            <Select value={pendingOrgId} onValueChange={setPendingOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableOrgs.map((org) => (
                  <SelectItem key={org.uuid} value={String(org.uuid)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={pendingRoleId} onValueChange={setPendingRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          className="w-fit bg-navy"
          disabled={savingKey === "add" || availableOrgs.length === 0}
          onClick={handleAdd}
        >
          Add membership
        </Button>
      </div>
    </div>
  );
}
